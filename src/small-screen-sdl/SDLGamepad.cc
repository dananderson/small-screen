/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "SDLGamepad.h"
#include "Format.h"

using namespace Napi;

FunctionReference SDLGamepad::constructor;

Object SDLGamepad::Init(Napi::Env env, Object exports) {
  Function func = DefineClass(env, "SDLGamepad", {
    InstanceAccessor("id", &SDLGamepad::GetId, nullptr),
    InstanceAccessor("guid", &SDLGamepad::GetGUID, nullptr),
    InstanceAccessor("name", &SDLGamepad::GetName, nullptr),
    InstanceAccessor("axisCount", &SDLGamepad::GetAxisCount, nullptr),
    InstanceAccessor("buttonCount", &SDLGamepad::GetButtonCount, nullptr),
    InstanceAccessor("hatCount", &SDLGamepad::GetHatCount, nullptr),
    InstanceAccessor("mapping", &SDLGamepad::GetMapping, nullptr),
    InstanceMethod("close", &SDLGamepad::Close),
    StaticMethod("count", &SDLGamepad::Count),

  });

  constructor = Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("SDLGamepad", func);

  return exports;
}

SDLGamepad::SDLGamepad(const CallbackInfo& info)
        : ObjectWrap<SDLGamepad>(info), joystick(nullptr), id(-1), axisCount(0), buttonCount(0), hatCount(0) {
    auto index = info[0].As<Number>().Int32Value();

    this->joystick = SDL_JoystickOpen(index);

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

Value SDLGamepad::Count(const CallbackInfo& info) {
    return Number::New(info.Env(), SDL_NumJoysticks());
}

Value SDLGamepad::GetId(const CallbackInfo& info) {
    return Number::New(info.Env(), this->id);
}

Value SDLGamepad::GetGUID(const CallbackInfo& info) {
    return String::New(info.Env(), this->guid);
}

Value SDLGamepad::GetName(const CallbackInfo& info) {
    return String::New(info.Env(), this->name);
}

Value SDLGamepad::GetAxisCount(const CallbackInfo& info) {
    return Number::New(info.Env(), this->axisCount);
}

Value SDLGamepad::GetButtonCount(const CallbackInfo& info) {
    return Number::New(info.Env(), this->buttonCount);
}

Value SDLGamepad::GetHatCount(const CallbackInfo& info) {
    return Number::New(info.Env(), this->hatCount);
}

Value SDLGamepad::GetMapping(const CallbackInfo& info) {
    return String::New(info.Env(), this->mapping);
}

void SDLGamepad::Close(const CallbackInfo& info) {
    if (this->joystick) {
        SDL_JoystickClose(this->joystick);
        this->joystick = nullptr;
    }
}
    