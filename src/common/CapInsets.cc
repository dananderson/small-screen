/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "CapInsets.h"

using namespace Napi;

FunctionReference CapInsets::constructor;

Object CapInsets::Init(class Env env, Object exports) {
    HandleScope scope(env);

    auto func = DefineClass(env, "CapInsets", {
        InstanceAccessor("left", &CapInsets::Left, nullptr),
        InstanceAccessor("top", &CapInsets::Top, nullptr),
        InstanceAccessor("right", &CapInsets::Right, nullptr),
        InstanceAccessor("bottom", &CapInsets::Bottom, nullptr),
    });

    constructor = Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("CapInsets", func);

    return exports;
}

CapInsets::CapInsets(const CallbackInfo& info) : ObjectWrap<CapInsets>(info) {
    if (info[0].IsNumber()) {
        auto inset = info[0].As<Number>().Int32Value();
        this->rect = { inset, inset, inset, inset };
    } else if (info[0].IsObject()) {
        auto obj = info[0].As<Object>();

        if (!obj.Has("left") || !obj.Has("right") || !obj.Has("top") || !obj.Has("bottom")) {
            throw Error::New(info.Env(), "CapInsets constructor object must contain left, right, top and bottom properties");
        }

        this->rect = {
            obj.Get("top").As<Number>().Int32Value(),
            obj.Get("right").As<Number>().Int32Value(),
            obj.Get("left").As<Number>().Int32Value(),
            obj.Get("bottom").As<Number>().Int32Value(),
        };
    } else {
        throw Error::New(info.Env(), "CapInsets constructor takes a number or an object containing left, right, top and bottom coordinates.");
    }

}
