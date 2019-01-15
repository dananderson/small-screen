/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "AsyncTaskQueue.h"

#include <blockingconcurrentqueue.h>
#include <vector>
#include <thread>
#include <iostream>
#include <cstdio>
#include <cstring>
#include <cstdlib>

// Flag indicating that the consumers are running and actively processing items from the image load request queue.
std::atomic<bool> sRunning (true);

// The javascript load() method will add image load requests to this queue. Consumers will wait on the queue
// for the next item.
moodycamel::BlockingConcurrentQueue<AsyncTask *> sLoadRequests;

// Pool of image load request processors. Each consumer will continue to run as long as sRunning is true and
// the queue does not return a null Task.
std::vector<std::thread*> sConsumers;

void AsyncTaskQueue::Join() {
    // Wake up the consumers by putting a null request in the queue. When a consumer dequeues null, it immediately
    // exits. sConsumers.size() nulls will shutdown all consumers.
    for (size_t i = 0; i < sConsumers.size(); i++) {
        sLoadRequests.enqueue(nullptr);
    }

    for (size_t i = 0; i < sConsumers.size(); i++) {
        sConsumers[i]->join();
        delete sConsumers[i];
    }

    sConsumers.clear();
}

void AsyncTaskWorker () {
    moodycamel::ConsumerToken t(sLoadRequests);

    while (sRunning) {
        AsyncTask *value;

        sLoadRequests.wait_dequeue(t, value);

        if (!sRunning || value == nullptr) {
            break;
        }

        try {
            value->Run();
        } catch (std::exception e) {
            value->DispatchError(std::string("Task::Run - Internal error: ").append(e.what()));
            break;
        }

        value->Dispatch();

        delete value;
    }
}

int AsyncTaskQueue::GetThreadPoolSize() {
    return (int)sConsumers.size();
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
        sConsumers.push_back(new std::thread(AsyncTaskWorker));
    }
}

void AsyncTaskQueue::Enqueue(AsyncTask *task) {
    sLoadRequests.enqueue(task);
}

void AsyncTaskQueue::Close() {
    sRunning = false;
    AsyncTaskQueue::Join();
}
