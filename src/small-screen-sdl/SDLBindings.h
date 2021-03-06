/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef SDLBINDINGS_H
#define SDLBINDINGS_H

#include "napi.h"

Napi::Object SDLBindingsInit(Napi::Env env, Napi::Object exports);

#endif
