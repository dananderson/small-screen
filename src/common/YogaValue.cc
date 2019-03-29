/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "YogaValue.h"

using namespace Yoga;

Napi::FunctionReference Value::constructor;

Value::Value(const Napi::CallbackInfo& info) : Napi::ObjectWrap<Value>(info) {
    auto len = info.Length();

    if (len == 0) {
        return;
    }

    auto self = info.This().As<Napi::Object>();

    if (len == 1) {
        self["unit"] = info[0].As<Napi::Number>().Int32Value();
    } else if (len == 2) {
        self["unit"] = info[0].As<Napi::Number>().Int32Value();
        self["value"] = info[1].As<Napi::Number>().DoubleValue();
    }
}

Napi::Object Value::Init(Napi::Env env, Napi::Object exports) {
    Napi::HandleScope scope(env);

    auto func = DefineClass(env, "Value", {
        InstanceValue("value", env.Undefined(), napi_property_attributes::napi_writable),
        InstanceValue("unit", Napi::Number::New(env, YGUnitUndefined), napi_property_attributes::napi_writable),
    });

    constructor = Napi::Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Value", func);

    return exports;
}

Napi::Value Value::New(Napi::Env env, const YGValue& ygValue) {
    if (ygValue.unit == YGUnitUndefined || ygValue.unit == YGUnitAuto) {
        return Value::constructor.New({ Napi::Number::New(env, ygValue.unit) });
    }

    return Value::constructor.New({ Napi::Number::New(env, ygValue.unit), Napi::Number::New(env, ygValue.value) });
}
