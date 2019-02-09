/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef SDLGAMEPAD_H
#define SDLGAMEPAD_H

#include "napi.h"
#include <SDL.h>
#include <string>

class SDLGamepad : public Napi::ObjectWrap<SDLGamepad> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    SDLGamepad(const Napi::CallbackInfo& info);
    ~SDLGamepad() {}

    Napi::Value GetId(const Napi::CallbackInfo& info);
    Napi::Value GetGUID(const Napi::CallbackInfo& info);
    Napi::Value GetName(const Napi::CallbackInfo& info);
    Napi::Value GetAxisCount(const Napi::CallbackInfo& info);
    Napi::Value GetButtonCount(const Napi::CallbackInfo& info);
    Napi::Value GetHatCount(const Napi::CallbackInfo& info);
    Napi::Value GetGameControllerMapping(const Napi::CallbackInfo& info);
    void Close(const Napi::CallbackInfo& info);

    static Napi::Value Length(const Napi::CallbackInfo& info);
    static Napi::Value GetIdForIndex(const Napi::CallbackInfo& info);

private:
    static Napi::FunctionReference constructor;
    SDL_Joystick *joystick;

    SDL_Joystick *GetJoystickOrThrow(Napi::Env env);
};

#endif
