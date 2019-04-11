/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "StbFont.h"
#include "LoadStbFontSampleAsyncWorker.h"

using namespace Napi;

FunctionReference StbFont::constructor;

StbFont::StbFont(const CallbackInfo& info) : ObjectWrap<StbFont>(info), index(-1) {

}

StbFont::~StbFont() {

}

void StbFont::Init(Napi::Env env) {
    HandleScope scope(env);
    auto zero = Number::New(env, 0);
    auto empty = String::New(env, "");
    auto func = DefineClass(env, "StbFont", {
        // Properties used by javascript.
        InstanceValue("family", empty, napi_property_attributes::napi_writable),
        InstanceValue("style", zero, napi_property_attributes::napi_writable),
        InstanceValue("weight", zero, napi_property_attributes::napi_writable),
        InstanceValue("status", zero, napi_property_attributes::napi_writable),
        // Native bound properties.
        InstanceAccessor("index", &StbFont::GetIndex, nullptr),
        // Methods
        InstanceMethod("createSample", &StbFont::CreateSample),
    });

    constructor = Persistent(func);
    constructor.SuppressDestruct();
}

Object StbFont::New(Napi::Env env, int32_t index, std::shared_ptr<uint8_t> ttf) {
    auto obj = StbFont::constructor.New({});
    auto font = ObjectWrap::Unwrap(obj);

    font->ttf = ttf;
    font->index = index;

    return obj;
}

Value StbFont::GetIndex(const CallbackInfo& info) {
    return Number::New(info.Env(), this->index);
}

Value StbFont::CreateSample(const CallbackInfo& info) {
    auto env = info.Env();
    auto fontSize = info[0].As<Number>().Int32Value();
    auto worker = new LoadStbFontSampleAsyncWorker(env, this->ttf, this->index, fontSize);

    worker->Queue();

    return worker->Promise();
}
