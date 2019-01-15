/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "Font.h"
#include "Methods.h"
#include "AsyncTaskQueue.h"

#include "napi.h"

using namespace Napi;

Object Init(Env env, Object exports) {
    FontInit(env, exports);

    exports["setThreadPoolSize"] = Function::New(env, JS_SetThreadPoolSize, "setThreadPoolSize");
    exports["getThreadPoolSize"] = Function::New(env, JS_GetThreadPoolSize, "getThreadPoolSize");

    exports["loadImage"] = Function::New(env, JS_ImageLoad, "loadImage");
    exports["releaseImage"] = Function::New(env, JS_ImageRelease, "releaseImage");

    std::atexit([] () {
        AsyncTaskQueue::Close();
    });

    AsyncTaskQueue::SetThreadPoolSize(0);

    return exports;
}

NODE_API_MODULE(internal, Init);
