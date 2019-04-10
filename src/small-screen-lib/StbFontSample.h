/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <napi.h>
#include <vector>
#include <map>
#include "FontSample.h"

class StbFontSample : public Napi::ObjectWrap<StbFontSample>, public FontSample {
public:
    StbFontSample(const Napi::CallbackInfo& info);
    ~StbFontSample();

    static void Init(Napi::Env env);
    static Napi::Object New(
        Napi::Env env,
        int32_t fontSize,
        float ascent,
        float lineHeight,
        std::vector<uint8_t>& pixels,
        int32_t width,
        int32_t height,
        std::map<int32_t, CodepointMetrics>& codepointMetrics,
        std::map<uint32_t, float>& kerningPairs
    );

private:
    static Napi::FunctionReference constructor;
};
