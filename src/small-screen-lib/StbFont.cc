/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "StbFont.h"
#include "LoadStbFontSampleAsyncWorker.h"

using namespace Napi;

FunctionReference StbFont::constructor;

StbFont::StbFont(const CallbackInfo& info) : ObjectWrap<StbFont>(info) {

}

StbFont::~StbFont() {

}

void StbFont::Init(Napi::Env env) {
    HandleScope scope(env);
    auto zero = Number::New(env, 0);
    auto empty = String::New(env, "");
    auto func = DefineClass(env, "StbFont", {
        InstanceValue("count", zero, napi_property_attributes::napi_writable),
        InstanceValue("family", empty, napi_property_attributes::napi_writable),
        InstanceValue("style", zero, napi_property_attributes::napi_writable),
        InstanceValue("weight", zero, napi_property_attributes::napi_writable),
        InstanceValue("status", zero, napi_property_attributes::napi_writable),
        InstanceMethod("createSample", &StbFont::CreateSample),
    });

    constructor = Persistent(func);
    constructor.SuppressDestruct();
}

Object StbFont::New(Napi::Env env, int32_t count, std::shared_ptr<uint8_t> ttf) {
    auto obj = StbFont::constructor.New({});
    auto font = ObjectWrap::Unwrap(obj);

    font->ttf = ttf;

    // TODO: move to constructor?
    obj["count"] = Number::New(env, count);

    return obj;
}

Value StbFont::CreateSample(const CallbackInfo& info) {
    auto env = info.Env();
    auto fontSize = info[0].As<Number>().Int32Value();
    auto worker = new LoadStbFontSampleAsyncWorker(env, this->ttf, 0, fontSize);

    worker->Queue();

    return worker->Promise();
}
