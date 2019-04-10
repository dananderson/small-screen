/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include <napi.h>
#include <YogaValue.h>
#include <YogaNode.h>
#include <YogaGlobal.h>

#include "TextLayout.h"
#include "CapInsets.h"
#include "Global.h"
#include "StbFont.h"
#include "StbFontSample.h"

using namespace Napi;

Object Init(Env env, Object exports) {
    TextLayout::Init(env, exports);
    CapInsets::Init(env, exports);
    StbFont::Init(env);
    StbFontSample::Init(env);
    Global::Init(env, exports);

    auto yoga = Object::New(env);

    exports["Yoga"] = yoga;
    Yoga::Value::Init(env, yoga);
    Yoga::Node::Init(env, yoga);
    Yoga::Init(env, yoga);

    return exports;
}

NODE_API_MODULE(SmallScreenLib, Init);
