/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "SDLBindings.h"
#include "Graphics.h"
#include "Image.h"

#include "napi.h"

using namespace Napi;

Object Init(Env env, Object exports) {
    SDLBindingsInit(env, exports);
    GraphicsInit(env, exports);
    ImageInit(env, exports);
    
    return exports;
}

NODE_API_MODULE(internal, Init);
