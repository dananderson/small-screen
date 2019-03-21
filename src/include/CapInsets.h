/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef CAPINSETS_H
#define CAPINSETS_H

#include "napi.h"
#include "Rectangle.h"
#include <cstdint>

class CapInsets : public Napi::ObjectWrap<CapInsets> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    CapInsets(int32_t top, int32_t right, int32_t bottom, int32_t left);
    CapInsets(const Napi::CallbackInfo& info);
    virtual ~CapInsets() {}

    Napi::Value Left(const Napi::CallbackInfo& info) { return Napi::Number::New(info.Env(), this->rect.left); }
    Napi::Value Top(const Napi::CallbackInfo& info) { return Napi::Number::New(info.Env(), this->rect.top); }
    Napi::Value Right(const Napi::CallbackInfo& info) { return Napi::Number::New(info.Env(), this->rect.right); }
    Napi::Value Bottom(const Napi::CallbackInfo& info) { return Napi::Number::New(info.Env(), this->rect.bottom); }

    int32_t GetLeft() const { return this->rect.left; }
    int32_t GetTop() const { return this->rect.top; }
    int32_t GetRight() const { return this->rect.right; }
    int32_t GetBottom() const { return this->rect.bottom; }
    const Rectangle &GetRectangle() const { return this->rect; }


private:
    static Napi::FunctionReference constructor;

    Rectangle rect;
};

#endif
