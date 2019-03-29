/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "YogaGlobal.h"
#include "YogaNode.h"

using namespace Napi;

Object Yoga::Init(Env env, Object exports) {
    exports["getInstanceCount"] = Function::New(env, GetInstanceCount, "getInstanceCount");

    return exports;
}

Value Yoga::GetInstanceCount(const CallbackInfo& info) {
    return Number::New(info.Env(), Yoga::Node::GetInstanceCount());
}
