/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "AsyncTaskQueue.h"

#include <blockingconcurrentqueue.h>
#include <vector>
#include <thread>
#include <cstring>
#include <cstdlib>
#include <iostream>
#include <memory>

// Flag indicating that the consumers are running and actively processing items from the image load request queue.
std::atomic<bool> sRunning (true);

// The javascript load() method will add image load requests to this queue. Consumers will wait on the queue
// for the next item.
moodycamel::BlockingConcurrentQueue<std::shared_ptr<AsyncTask>> sLoadRequests;

// Pool of image load request processors. Each consumer will continue to run as long as sRunning is true and
// the queue does not return a null Task.
std::vector<std::shared_ptr<std::thread>> sConsumers;

void AsyncTaskQueue::Join() {
    // Wake up the consumers by putting a null request in the queue. When a consumer dequeues null, it immediately
    // exits. sConsumers.size() nulls will shutdown all consumers.
    for (size_t i = 0; i < sConsumers.size(); i++) {
        sLoadRequests.enqueue(std::shared_ptr<AsyncTask>());
    }

    for (size_t i = 0; i < sConsumers.size(); i++) {
        sConsumers[i]->join();
    }

    sConsumers.clear();
}

void AsyncTaskWorker () {
    moodycamel::ConsumerToken t(sLoadRequests);

    while (sRunning) {
        std::shared_ptr<AsyncTask> task;

        sLoadRequests.wait_dequeue(t, task);

        if (!sRunning || task == nullptr) {
            break;
        }

        try {
            task->Run();
        } catch (std::exception& e) {
            task->DispatchError(e.what());
            continue;
        } catch (...) {
            task->DispatchError("Unknown async worker exception.");
            continue;
        }

        task->Dispatch();
    }
}

int AsyncTaskQueue::GetThreadPoolSize() {
    return static_cast<int>(sConsumers.size());
}

void AsyncTaskQueue::SetThreadPoolSize(size_t size) {
    if (size == 0) {
        auto concurrency = std::thread::hardware_concurrency();

        if (concurrency == 0) {
            size = 1;
        } else {
            size = concurrency;
        }
    }

    if (sConsumers.size() == size) {
        return;
    }

    // Destroy all consumers and create size new ones. Could diff here and shutdown/create what is needed, but that
    // seems like overkill for an infrequent operation.
    AsyncTaskQueue::Join();

    for (size_t i = 0; i < size; i++) {
        sConsumers.push_back(std::make_shared<std::thread>(AsyncTaskWorker));
    }
}

void AsyncTaskQueue::Enqueue(std::shared_ptr<AsyncTask> task) {
    sLoadRequests.enqueue(task);
}

void AsyncTaskQueue::Close() {
    sRunning = false;
    AsyncTaskQueue::Join();
}
