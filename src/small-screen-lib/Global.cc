/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "Global.h"
#include "TextureFormat.h"
#include "LoadImageAsyncWorker.h"
#include "LoadStbFontAsyncWorker.h"

using namespace Napi;

void LoadImage(const CallbackInfo& info) {
    HandleScope scope(info.Env());

    auto source = info[0];

    if (!source.IsBuffer() && !source.IsString()) {
        throw Error::New(info.Env(), "source parameter must a String or Buffer");
    }

    auto options = info[1].As<Object>();
    auto callback = info[2].As<Function>();

    Value value;

    value = options.Get("width");
    auto width = value.IsNumber() ? value.As<Number>().Int32Value() : 0;

    value = options.Get("height");
    auto height = value.IsNumber() ? value.As<Number>().Int32Value(): 0;

    value = options.Get("format");
    auto format = value.IsNumber() ? Cast(value.As<Number>().Int32Value()): TEXTURE_FORMAT_RGBA;

    value = options.Get("type");
    auto sourceType = value.IsString() ? value.As<String>().Utf8Value() : std::string();

    value = options.Get("basename");
    auto basename = value.ToBoolean();

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

void ReleaseImage(const CallbackInfo& info) {
    if (info[0].IsBuffer()) {
        free(info[0].As<Buffer<unsigned char>>().Data());
    }
}

Value LoadFont(const CallbackInfo& info) {
    auto filename = info[0].As<String>().Utf8Value();
    auto worker = new LoadStbFontAsyncWorker(info.Env(), filename);

    worker->Queue();

    return worker->Promise();
}

Object Global::Init(Env env, Object exports) {
    exports["loadImage"] = Function::New(env, LoadImage, "loadImage");
    exports["releaseImage"] = Function::New(env, ReleaseImage, "releaseImage");
    exports["loadFont"] = Function::New(env, LoadFont, "loadFont");

    return exports;
}
