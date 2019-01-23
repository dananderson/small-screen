/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef CAPINSETS_H
#define CAPINSETS_H

#include "napi.h"
#include <cstdint>

class CapInsets : public Napi::ObjectWrap<CapInsets> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    CapInsets(const Napi::CallbackInfo& info);
    ~CapInsets() {}

    Napi::Value Left(const Napi::CallbackInfo& info) { return Napi::Number::New(info.Env(), this->left); }
    Napi::Value Top(const Napi::CallbackInfo& info) { return Napi::Number::New(info.Env(), this->top); }
    Napi::Value Right(const Napi::CallbackInfo& info) { return Napi::Number::New(info.Env(), this->right); }
    Napi::Value Bottom(const Napi::CallbackInfo& info) { return Napi::Number::New(info.Env(), this->bottom); }

    int32_t GetLeft() const { return this->left; }
    int32_t GetTop() const { return this->top; }
    int32_t GetRight() const { return this->right; }
    int32_t GetBottom() const { return this->bottom; }

private:
    static Napi::FunctionReference constructor;

    int32_t left;
    int32_t top;
    int32_t right;
    int32_t bottom;
};

#endif
