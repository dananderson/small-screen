/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "StbFontSample.h"

using namespace Napi;

FunctionReference StbFontSample::constructor;

StbFontSample::StbFontSample(const CallbackInfo& info) : ObjectWrap<StbFontSample>(info), FontSample() {

}

StbFontSample::~StbFontSample() {

}

void StbFontSample::Init(Napi::Env env) {
    HandleScope scope(env);
    auto zero = Number::New(env, 0);
    auto empty = String::New(env, "");
    auto func = DefineClass(env, "StbFontSample", {
        InstanceValue("family", empty, napi_property_attributes::napi_writable),
        InstanceValue("style", zero, napi_property_attributes::napi_writable),
        InstanceValue("weight", zero, napi_property_attributes::napi_writable),
        InstanceValue("fontSize", zero, napi_property_attributes::napi_writable),
        InstanceValue("status", zero, napi_property_attributes::napi_writable),
    });

    constructor = Persistent(func);
    constructor.SuppressDestruct();
}

Object StbFontSample::New(Napi::Env env, int32_t fontSize, float ascent, float lineHeight,
        std::vector<uint8_t>& pixels, int32_t width, int32_t height,
        std::map<int32_t, CodepointMetrics>& codepointMetrics, std::map<uint32_t, float>& kerningPairs) {
    auto obj = StbFontSample::constructor.New({});
    auto sample = ObjectWrap::Unwrap(obj);

    sample->fontSize = fontSize;
    sample->ascent = ascent;
    sample->lineHeight = lineHeight;
    sample->texturePixels = std::move(pixels);
    sample->textureWidth = width;
    sample->textureHeight = height;
    sample->codepointMetrics = std::move(codepointMetrics);
    sample->kerningPairs = std::move(kerningPairs);

    return obj;
}
