/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <napi.h>
#include <YGValue.h>

namespace Yoga {

class Value : public Napi::ObjectWrap<Value> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static Napi::Value New(Napi::Env env, const YGValue& value);

    Value(const Napi::CallbackInfo& info);
    virtual ~Value() {}

private:
    static Napi::FunctionReference constructor;
};

}
