/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "Gamepad.h"
#include "Format.h"

using namespace Napi;

FunctionReference Gamepad::constructor;

Object Gamepad::Init(Napi::Env env, Object exports) {
  Function func = DefineClass(env, "Gamepad", {
    InstanceAccessor("id", &Gamepad::GetId, nullptr),
    InstanceAccessor("guid", &Gamepad::GetGUID, nullptr),
    InstanceAccessor("name", &Gamepad::GetName, nullptr),
    InstanceAccessor("axisCount", &Gamepad::GetAxisCount, nullptr),
    InstanceAccessor("buttonCount", &Gamepad::GetButtonCount, nullptr),
    InstanceAccessor("hatCount", &Gamepad::GetHatCount, nullptr),
    InstanceAccessor("mapping", &Gamepad::GetMapping, nullptr),
    InstanceMethod("close", &Gamepad::Close),
    StaticMethod("count", &Gamepad::Count),

  });

  constructor = Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("Gamepad", func);

  return exports;
}

Gamepad::Gamepad(const CallbackInfo& info)
        : ObjectWrap<Gamepad>(info), joystick(nullptr), id(-1), axisCount(0), buttonCount(0), hatCount(0) {
    this->joystick = SDL_JoystickOpen(info[0].As<Number>().Int32Value());

    if (!this->joystick) {
        throw Error::New(info.Env(), Format() << "Failed to open joystick at index " << index << ". " << SDL_GetError());
    }

    this->id = SDL_JoystickInstanceID(joystick);

    auto guid = SDL_JoystickGetGUID(this->joystick);
    char guidStr[33];

    SDL_JoystickGetGUIDString(guid, guidStr, 33);

    this->guid = guidStr;
    this->name = SDL_JoystickName(joystick);
    this->axisCount = SDL_JoystickNumAxes(joystick);
    this->buttonCount = SDL_JoystickNumButtons(joystick);
    this->hatCount = SDL_JoystickNumHats(joystick);
    this->mapping = SDL_GameControllerMappingForGUID(guid);
}

Value Gamepad::Count(const CallbackInfo& info) {
    return Number::New(info.Env(), SDL_NumJoysticks());
}

Value Gamepad::GetId(const CallbackInfo& info) {
    return Number::New(info.Env(), this->id);
}

Value Gamepad::GetGUID(const CallbackInfo& info) {
    return String::New(info.Env(), this->guid);
}

Value Gamepad::GetName(const CallbackInfo& info) {
    return String::New(info.Env(), this->name);
}

Value Gamepad::GetAxisCount(const CallbackInfo& info) {
    return Number::New(info.Env(), this->axisCount);
}

Value Gamepad::GetButtonCount(const CallbackInfo& info) {
    return Number::New(info.Env(), this->buttonCount);
}

Value Gamepad::GetHatCount(const CallbackInfo& info) {
    return Number::New(info.Env(), this->hatCount);
}

Value Gamepad::GetMapping(const CallbackInfo& info) {
    return String::New(info.Env(), this->mapping);
}

void Gamepad::Close(const CallbackInfo& info) {
    if (this->joystick) {
        SDL_JoystickClose(this->joystick);
        this->joystick = nullptr;
    }
}
    