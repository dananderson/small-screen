/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "Image.h"

#include <napi-thread-safe-callback.hpp>
#include <blockingconcurrentqueue.h>
#include <vector>
#include <thread>
#include <iostream>
#include <cstdio>
#include <cstring>
#include <cstdlib>

#include "ImageLoader.h"

using namespace Napi;

// Flag indicating that the consumers are running and actively processing items from the image load request queue.
std::atomic<bool> sRunning (true);

// The javascript load() method will add image load requests to this queue. Consumers will wait on the queue
// for the next item.
moodycamel::BlockingConcurrentQueue<ImageLoader *> sLoadRequests;

// Pool of image load request processors. Each consumer will continue to run as long as sRunning is true and
// the queue does not return a null ImageLoader.
std::vector<std::thread*> sConsumers;

SourceType StringToSourceType(const std::string& type) {
    if (type == "xml") {
        return XML;
    } else if (type == "base64") {
        return BASE64;
    }

    return FILENAME;
}

void JoinConsumers() {
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

void ImageLoadWorker () {
    moodycamel::ConsumerToken t(sLoadRequests);

    while (sRunning) {
        ImageLoader *value;

        sLoadRequests.wait_dequeue(t, value);

        if (!sRunning || value == nullptr) {
            break;
        }

        try {
            value->Load();
        } catch (std::exception e) {
            value->DispatchError(std::string("ImageLoadWorker: Internal error: ").append(e.what()));
            break;
        }

        value->Dispatch();

        delete value;
    }
}

void SetThreadPoolSize(size_t size) {
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
    JoinConsumers();

    for (size_t i = 0; i < size; i++) {
        sConsumers.push_back(new std::thread(ImageLoadWorker));
    }
}

void JS_ImageSetThreadPoolSize(const CallbackInfo& info) {
    auto size = info[0].As<Number>().Int32Value();

    if (size < 0) {
        // XXX: ThrowAsJavascriptException() is not a method???
        // Error::New(info.Env(), "thread pool size must be >= 0").ThrowAsJavascriptException();
        return;
    }

    SetThreadPoolSize(size);
}

Value JS_ImageGetThreadPoolSize(const CallbackInfo& info) {
    return Number::New(info.Env(), (int)sConsumers.size());
}

void JS_ImageLoad(const CallbackInfo& info) {
    // ThreadSafeCallback and libuv will block to acquire their respective locks here. On the RPI2/3, the wait
    // can occasionally take 10's of milliseconds, resulting in jerky animations for image heavy UI (like an image grid).
    // To alleviate the effects, the resource manager spreads load calls across multiple frames if they take too long
    // and swapped out thread pools to the BlockingConcurrentQueue version here.
    auto callback = std::make_shared<ThreadSafeCallback>(info[2].As<Function>());
    auto options = info[1].As<Object>();
    auto width = options.Has("width") ? options.Get("width").As<Number>().Int32Value() : 0;
    auto height = options.Has("height") ? options.Get("height").As<Number>().Int32Value(): 0;
    auto format = options.Has("format") ? options.Get("format").As<Number>().Int32Value(): FORMAT_RGBA;
    auto sourceType = StringToSourceType(options.Has("sourceType") ? options.Get("sourceType").ToString() : std::string());

    sLoadRequests.enqueue(new ImageLoader(
        callback,
        info[0].As<String>().Utf8Value(),
        sourceType,
        width,
        height,
        format));
}

void JS_ImageRelease(const CallbackInfo& info) {
    if (info[0].IsBuffer()) {
        free(info[0].As<Buffer<unsigned char>>().Data());
    }
}

Object ImageInit(Env env, Object exports) {
    auto image = Object::New(env);

    image["setThreadPoolSize"] = Function::New(env, JS_ImageSetThreadPoolSize, "setThreadPoolSize");
    image["getThreadPoolSize"] = Function::New(env, JS_ImageGetThreadPoolSize, "getThreadPoolSize");
    image["load"] = Function::New(env, JS_ImageLoad, "load");
    image["release"] = Function::New(env, JS_ImageRelease, "release");

    // Javascript will use the native functions (pieces) to compose the Image class.
    exports["ImagePieces"] = image;
    
    std::atexit([] () {
        sRunning = false;
        JoinConsumers();
    });

    SetThreadPoolSize(0);
    
    return exports;
}
