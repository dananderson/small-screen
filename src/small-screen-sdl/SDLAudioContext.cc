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
        InstanceMethod("getAudioSampleFormats", &SDLAudioContext::GetAudioSampleFormats),
        InstanceMethod("getAudioStreamFormats", &SDLAudioContext::GetAudioStreamFormats),
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
    
    if (SDL_WasInit(SDL_INIT_AUDIO) == 0) {
        throw Error::New(env, "SDL Audio must be initialized before creating or attaching an SDLAudioContext.");
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
    auto arg = info[0];
    SDL_RWops *src;

    if (arg.IsString()) {
        src = SDL_RWFromFile(arg.ToString().Utf8Value().c_str(), "rb");
    } else if (arg.IsBuffer()) {
        auto buffer = arg.As<Buffer<unsigned char>>();

        src = SDL_RWFromMem(static_cast<void *>(buffer.Data()), static_cast<int>(buffer.Length()));
    } else {
        throw Error::New(env, "createAudioSample: Unexpected argument type.");
    }

    SDL_AudioSpec spec;
    Uint8 *buffer;
    Uint32 bufferLen;

    SDL_memset(&spec, 0, sizeof(spec));

    auto chunk = SDL_LoadWAV_RW(src, 1, &spec, &buffer, &bufferLen);

    if (!chunk) {
        throw Error::New(env, "createAudioSample: Failed to load audio sample from file.");
    }

    return Buffer<Uint8>::New(env, buffer, bufferLen);
}

Value SDLAudioContext::GetAudioSampleFormats(const CallbackInfo& info) {
    auto env = info.Env();
    auto formats = Array::New(env);

    if (this->isOpen) {
        formats[formats.Length()] = String::New(env, "wave");
    }

    return formats;
}

Value SDLAudioContext::GetAudioStreamFormats(const CallbackInfo& info) {
    return Array::New(info.Env());
}

void SDLAudioContext::DestroyAudioSample(const CallbackInfo& info) {
    if (info[0].IsEmpty()) {
        return;
    }

    SDL_FreeWAV(info[0].As<Buffer<Uint8>>().Data());
}
