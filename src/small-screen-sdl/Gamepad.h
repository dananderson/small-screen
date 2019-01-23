/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef GAMEPAD_H
#define GAMEPAD_H

#include "napi.h"
#include <SDL.h>
#include <string>

class Gamepad : public Napi::ObjectWrap<Gamepad> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    Gamepad(const Napi::CallbackInfo& info);
    ~Gamepad() {}

    Napi::Value GetId(const Napi::CallbackInfo& info);
    Napi::Value GetGUID(const Napi::CallbackInfo& info);
    Napi::Value GetName(const Napi::CallbackInfo& info);
    Napi::Value GetAxisCount(const Napi::CallbackInfo& info);
    Napi::Value GetButtonCount(const Napi::CallbackInfo& info);
    Napi::Value GetHatCount(const Napi::CallbackInfo& info);
    Napi::Value GetMapping(const Napi::CallbackInfo& info);
    void Close(const Napi::CallbackInfo& info);

    static Napi::Value Count(const Napi::CallbackInfo& info);

private:
    static Napi::FunctionReference constructor;

    SDL_Joystick *joystick;
    int id;
    std::string guid;
    std::string name;
    int axisCount;
    int buttonCount;
    int hatCount;
    std::string mapping;
    
};

#endif
