/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "SDLBindings.h"
#include "SDLRenderingContext.h"
#include "SDLGamepad.h"
#include "SDLAudioContext.h"
#include "SDLClient.h"
#include "napi.h"

using namespace Napi;

Object Init(Env env, Object exports) {
    SDLBindingsInit(env, exports);
    SDLRenderingContext::Init(env, exports);
    SDLGamepad::Init(env, exports);
    SDLAudioContext::Init(env, exports);
    SDLClient::Init(env, exports);

    return exports;
}

NODE_API_MODULE(SmallScreenSDL, Init);
