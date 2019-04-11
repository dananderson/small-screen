/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <napi.h>
#include <vector>
#include <memory>

class StbFont : public Napi::ObjectWrap<StbFont> {
public:
    StbFont(const Napi::CallbackInfo& info);
    ~StbFont();

    static void Init(Napi::Env env);
    static Napi::Object New(Napi::Env env, int32_t index, std::shared_ptr<uint8_t> ttf);

    Napi::Value CreateSample(const Napi::CallbackInfo& info);
    Napi::Value GetIndex(const Napi::CallbackInfo& info);

private:
    static Napi::FunctionReference constructor;

    int32_t index;
    std::shared_ptr<uint8_t> ttf;
};
