/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "SDLAudioContext.h"
#include <SDL.h>
#include <iostream>
#include "Format.h"

using namespace Napi;

FunctionReference SDLAudioContext::constructor;

Object SDLAudioContext::Init(class Env env, Object exports) {
    HandleScope scope(env);

    auto func = DefineClass(env, "SDLAudioContext", {
        InstanceMethod("play", &SDLAudioContext::Play),
        InstanceMethod("createAudioSample", &SDLAudioContext::CreateAudioSample),
        InstanceMethod("destroyAudioSample", &SDLAudioContext::DestroyAudioSample),
        InstanceMethod("attach", &SDLAudioContext::Attach),
        InstanceMethod("detach", &SDLAudioContext::Detach),
    });

    constructor = Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("SDLAudioContext", func);

    return exports;
}

SDLAudioContext::SDLAudioContext(const CallbackInfo& info) : ObjectWrap<SDLAudioContext>(info), isOpen(false) {
    this->InitAudio(info.Env());
}

void SDLAudioContext::InitAudio(Napi::Env env) {
    if (this->isOpen) {
        return;
    }
    
    if (SDL_WasInit(SDL_INIT_AUDIO) == 0 && SDL_Init(SDL_INIT_AUDIO) != 0) {
        throw Error::New(env, Format() << "Cannot initialize audio. SDL_Init(SDL_INIT_AUDIO): " << SDL_GetError());
    }

    SDL_AudioSpec desired;

    SDL_memset(&desired, 0, sizeof(desired));

    if (SDL_OpenAudio(&desired, nullptr) != 0) {
        throw Error::New(env, Format() << "Cannot open audio. SDL_OpenAudio: " << SDL_GetError());
    }

    SDL_PauseAudio(0);

    this->isOpen = true;
}

void SDLAudioContext::Play(const CallbackInfo& info) {
    auto sample = info[0].As<Buffer<Uint8>>();

    SDL_ClearQueuedAudio(1);
    SDL_QueueAudio(1, sample.Data(), sample.Length());
}

void SDLAudioContext::Attach(const CallbackInfo& info) {
    this->InitAudio(info.Env());
}

void SDLAudioContext::Detach(const CallbackInfo& info) {
    SDL_CloseAudio();
    this->isOpen = false;
}

Value SDLAudioContext::CreateAudioSample(const CallbackInfo& info) {
    auto env = info.Env();
    auto file = info[0].As<String>().Utf8Value();

    SDL_AudioSpec spec;
    Uint8 *buffer;
    Uint32 bufferLen;

    SDL_memset(&spec, 0, sizeof(spec));

    auto chunk = SDL_LoadWAV(file.c_str(), 1, &spec, &buffer, &bufferLen);

    if (!chunk) {
        throw Error::New(env, "Failed to load audio sample from file.");
    }

    return Buffer<Uint8>::New(env, buffer, bufferLen);
}

void SDLAudioContext::DestroyAudioSample(const CallbackInfo& info) {
    if (info[0].IsEmpty()) {
        return;
    }

    SDL_FreeWAV(info[0].As<Buffer<Uint8>>().Data());
}
