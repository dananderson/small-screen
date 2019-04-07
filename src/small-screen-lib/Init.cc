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
#include <YogaValue.h>
#include <YogaNode.h>
#include <YogaGlobal.h>

#include "TextureFormat.h"
#include "TextLayout.h"
#include "FontStore.h"
#include "LoadImageAsyncWorker.h"
#include "CapInsets.h"

using namespace Napi;

void JS_ImageLoad(const CallbackInfo& info) {
    auto source = info[0];

    if (!source.IsBuffer() && !source.IsString()) {
        throw Error::New(info.Env(), "source parameter must a String or Buffer");
    }

    auto options = info[1].As<Object>();
    auto width = options.Has("width") ? options.Get("width").As<Number>().Int32Value() : 0;
    auto height = options.Has("height") ? options.Get("height").As<Number>().Int32Value(): 0;
    auto format = options.Has("format") ? Cast(options.Get("format").As<Number>().Int32Value()): TEXTURE_FORMAT_RGBA;
    auto sourceType = options.Has("type") ? options.Get("type").As<String>().Utf8Value() : std::string();
    auto basename = options.Has("basename") ? options.Get("basename").ToBoolean() : false;
    auto callback = info[2].As<Function>();

    auto worker = new LoadImageAsyncWorker(
        callback,
        source,
        sourceType,
        width,
        height,
        format,
        basename);

    worker->Queue();
}

void JS_ImageRelease(const CallbackInfo& info) {
    if (info[0].IsBuffer()) {
        free(info[0].As<Buffer<unsigned char>>().Data());
    }
}

Object Init(Env env, Object exports) {
    TextLayout::Init(env, exports);
    CapInsets::Init(env, exports);
    FontStore::Init(env, exports);

    auto yoga = Object::New(env);

    exports["Yoga"] = yoga;
    Yoga::Value::Init(env, yoga);
    Yoga::Node::Init(env, yoga);
    Yoga::Init(env, yoga);

    exports["loadImage"] = Function::New(env, JS_ImageLoad, "loadImage");
    exports["releaseImage"] = Function::New(env, JS_ImageRelease, "releaseImage");

    return exports;
}

NODE_API_MODULE(SmallScreenLib, Init);
