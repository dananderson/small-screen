/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "napi.h"

#include <vector>
#include <thread>
#include <iostream>
#include <cstdio>
#include <cstring>
#include <cstdlib>

#include "TextureFormat.h"
#include "TextLayout.h"
#include "FontStore.h"
#include "AsyncTaskQueue.h"
#include "LoadImageAsyncTask.h"
#include "CapInsets.h"

using namespace Napi;

void JS_SetThreadPoolSize(const CallbackInfo& info) {
    auto size = info[0].As<Number>().Int32Value();

    if (size < 0) {
        throw Error::New(info.Env(), "thread pool size must be >= 0");
    }

    AsyncTaskQueue::SetThreadPoolSize(size);
}

Value JS_GetThreadPoolSize(const CallbackInfo& info) {
    return Number::New(info.Env(), AsyncTaskQueue::GetThreadPoolSize());
}

void JS_ImageLoad(const CallbackInfo& info) {
    auto source = info[0];

    if (!source.IsBuffer() && !source.IsString()) {
        throw Error::New(info.Env(), "source parameter must a String or Buffer");
    }

    // libuv will try to acquire a lock in this call (ThreadSafeCallback ctor), blocking the event loop.
    auto callback = std::make_shared<ThreadSafeCallback>(info[2].As<Function>());
    auto options = info[1].As<Object>();
    auto width = options.Has("width") ? options.Get("width").As<Number>().Int32Value() : 0;
    auto height = options.Has("height") ? options.Get("height").As<Number>().Int32Value(): 0;
    auto format = options.Has("format") ? Cast(options.Get("format").As<Number>().Int32Value()): TEXTURE_FORMAT_RGBA;
    auto sourceType = options.Has("type") ? options.Get("type").As<String>().Utf8Value() : std::string();
    auto basename = options.Has("basename") ? options.Get("basename").ToBoolean() : false;
    
    AsyncTaskQueue::Enqueue(std::make_shared<LoadImageAsyncTask>(
        callback,
        source,
        sourceType,
        width,
        height,
        format,
        basename));
}

void JS_ImageRelease(const CallbackInfo& info) {
    if (info[0].IsBuffer()) {
        free(info[0].As<Buffer<unsigned char>>().Data());
    }
}



void JS_ImageJoinThreadPool(const CallbackInfo& info) {
    AsyncTaskQueue::Close();
}

Object Init(Env env, Object exports) {
    TextLayout::Init(env, exports);
    CapInsets::Init(env, exports);
    FontStore::Init(env, exports);

    exports["ImageSetThreadPoolSize"] = Function::New(env, JS_SetThreadPoolSize, "ImageSetThreadPoolSize");
    exports["ImageGetThreadPoolSize"] = Function::New(env, JS_GetThreadPoolSize, "ImageGetThreadPoolSize");
    exports["ImageJoinThreadPool"] = Function::New(env, JS_ImageJoinThreadPool, "ImageJoinThreadPool");

    exports["loadImage"] = Function::New(env, JS_ImageLoad, "loadImage");
    exports["releaseImage"] = Function::New(env, JS_ImageRelease, "releaseImage");

    // napi_add_env_cleanup_hook(env, [] (void *arg) { AsyncTaskQueue::Close(); }, nullptr);

    std::atexit([] () {
        AsyncTaskQueue::Close();
    });

    AsyncTaskQueue::SetThreadPoolSize(0);

    return exports;
}

NODE_API_MODULE(SmallScreenLib, Init);
