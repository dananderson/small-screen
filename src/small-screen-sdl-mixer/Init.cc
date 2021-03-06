/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "napi.h"
#include "SDLMixerAudioContext.h"

using namespace Napi;

Object Init(Env env, Object exports) {
    SDLMixerAudioContext::Init(env, exports);

    return exports;
}

NODE_API_MODULE(SmallScreenSDLMixer, Init);
