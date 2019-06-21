/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "SDLGamepad.h"
#include "Format.h"
#include <iostream>

using namespace Napi;

FunctionReference SDLGamepad::constructor;

Object SDLGamepad::Init(Napi::Env env, Object exports) {
  Function func = DefineClass(env, "SDLGamepad", {
    InstanceMethod("getId", &SDLGamepad::GetId),
    InstanceMethod("getGUID", &SDLGamepad::GetGUID),
    InstanceMethod("getName", &SDLGamepad::GetName),
    InstanceMethod("getAxisCount", &SDLGamepad::GetAxisCount),
    InstanceMethod("getButtonCount", &SDLGamepad::GetButtonCount),
    InstanceMethod("getHatCount", &SDLGamepad::GetHatCount),
    InstanceMethod("getGameControllerMapping", &SDLGamepad::GetGameControllerMapping),
    InstanceMethod("close", &SDLGamepad::Close),
    StaticAccessor("length", &SDLGamepad::Length, nullptr),
    StaticMethod("getIdForIndex", &SDLGamepad::GetIdForIndex),
  });

  constructor = Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("SDLGamepad", func);

  return exports;
}

SDLGamepad::SDLGamepad(const CallbackInfo& info) : ObjectWrap<SDLGamepad>(info), joystick(nullptr) {
    auto index = info[0].As<Number>().Int32Value();

    this->joystick = SDL_JoystickOpen(index);

    if (!this->joystick) {
        throw Error::New(info.Env(), Format() << "Failed to open joystick at index " << index << ". " << SDL_GetError());
    }
}

SDL_Joystick *SDLGamepad::GetJoystickOrThrow(Napi::Env env) {
    if (!this->joystick) {
        throw Error::New(env, "Joystick has been closed!");
    }

    return this->joystick;
}

Value SDLGamepad::GetId(const CallbackInfo& info) {
    auto id = SDL_JoystickInstanceID(this->GetJoystickOrThrow(info.Env()));

    return Number::New(info.Env(), id);
}

Value SDLGamepad::GetGUID(const CallbackInfo& info) {
    auto joystickGUID = SDL_JoystickGetGUID(this->GetJoystickOrThrow(info.Env()));
    char guid[33];

    SDL_JoystickGetGUIDString(joystickGUID, guid, 33);

    return String::New(info.Env(), guid);
}

Value SDLGamepad::GetName(const CallbackInfo& info) {
    return String::New(info.Env(), SDL_JoystickName(this->GetJoystickOrThrow(info.Env())));
}

Value SDLGamepad::GetAxisCount(const CallbackInfo& info) {
    return Number::New(info.Env(), SDL_JoystickNumAxes(this->GetJoystickOrThrow(info.Env())));
}

Value SDLGamepad::GetButtonCount(const CallbackInfo& info) {
    return Number::New(info.Env(), SDL_JoystickNumButtons(this->GetJoystickOrThrow(info.Env())));
}

Value SDLGamepad::GetHatCount(const CallbackInfo& info) {
    return Number::New(info.Env(), SDL_JoystickNumHats(this->GetJoystickOrThrow(info.Env())));
}

Value SDLGamepad::GetGameControllerMapping(const CallbackInfo& info) {
    auto env = info.Env();
    auto mapping = SDL_GameControllerMappingForGUID(SDL_JoystickGetGUID(this->GetJoystickOrThrow(env)));

    if (mapping) {
        return String::New(env, mapping);
    }

    return env.Undefined();
}

void SDLGamepad::Close(const CallbackInfo& info) {
    if (this->joystick) {
        SDL_JoystickClose(this->joystick);
        this->joystick = nullptr;
    }
}

Napi::Value SDLGamepad::Length(const Napi::CallbackInfo& info) {
    return Number::New(info.Env(), SDL_NumJoysticks());
}

Napi::Value SDLGamepad::GetIdForIndex(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    auto index = info[0].As<Number>().Int32Value();
    auto joystick = SDL_JoystickOpen(index);

    if (joystick == nullptr) {
        return Number::New(env, -1);
    }

    auto id = SDL_JoystickInstanceID(joystick);

    SDL_JoystickClose(joystick);
    
    return Number::New(env, id);
}
