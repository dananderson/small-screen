/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "SDLMixerAudioContext.h"
#include <SDL.h>
#include <SDL_mixer.h>
#include <iostream>
#include <string>
#include <algorithm>
#include "Format.h"

using namespace Napi;

FunctionReference SDLMixerAudioContext::constructor;

Object SDLMixerAudioContext::Init(class Env env, Object exports) {
    HandleScope scope(env);

    auto func = DefineClass(env, "SDLMixerAudioContext", {
        InstanceMethod("play", &SDLMixerAudioContext::Play),
        InstanceMethod("createAudioSample", &SDLMixerAudioContext::CreateAudioSample),
        InstanceMethod("destroyAudioSample", &SDLMixerAudioContext::DestroyAudioSample),
        InstanceMethod("attach", &SDLMixerAudioContext::Attach),
        InstanceMethod("detach", &SDLMixerAudioContext::Detach),
        InstanceMethod("getAudioSampleFormats", &SDLMixerAudioContext::GetAudioSampleFormats),
        InstanceMethod("getAudioStreamFormats", &SDLMixerAudioContext::GetAudioStreamFormats),
    });

    constructor = Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("SDLMixerAudioContext", func);

    return exports;
}

SDLMixerAudioContext::SDLMixerAudioContext(const CallbackInfo& info) : ObjectWrap<SDLMixerAudioContext>(info), isOpen(false) {
    this->InitAudio(info.Env());
}

void SDLMixerAudioContext::InitAudio(Napi::Env env) {
    if (this->isOpen) {
        return;
    }

    if (SDL_WasInit(SDL_INIT_AUDIO) == 0) {
        throw Error::New(env, "SDL Audio must be initialized before creating or attaching an SDLMixerAudioContext.");
    }

    if (Mix_OpenAudio(44100, MIX_DEFAULT_FORMAT, 2, 2048 ) < 0) {
        throw Error::New(env, Format() << "Cannot open mixer. Error: " << Mix_GetError());
    }

    this->isOpen = true;
}

void SDLMixerAudioContext::Play(const CallbackInfo& info) {
    auto chunk = info[0].As<External<Mix_Chunk>>().Data();

    auto result = Mix_PlayChannel(0, chunk, 0);

    if (result == -1) {
        std::cout << "Mix_PlayChannel - Error: " << Mix_GetError() << std::endl;
    }
}

void SDLMixerAudioContext::Attach(const CallbackInfo& info) {
    this->InitAudio(info.Env());
}

void SDLMixerAudioContext::Detach(const CallbackInfo& info) {
    Mix_CloseAudio();
    Mix_Quit();
    this->isOpen = false;
}

Value SDLMixerAudioContext::CreateAudioSample(const CallbackInfo& info) {
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

    auto chunk = Mix_LoadWAV_RW(src, 1);

    if (!chunk) {
        throw Error::New(env, "createAudioSample: Failed to load audio sample from file.");
    }

    return External<Mix_Chunk>::New(env, chunk);
}

void SDLMixerAudioContext::DestroyAudioSample(const CallbackInfo& info) {
    if (info[0].IsEmpty()) {
        return;
    }

    auto chunk = info[0].As<External<Mix_Chunk>>().Data();

    Mix_FreeChunk(chunk);
}

Value SDLMixerAudioContext::GetAudioSampleFormats(const CallbackInfo& info) {
    auto env = info.Env();
    auto numAudioSampleFormats = Mix_GetNumChunkDecoders();
    auto audioSampleFormats = Array::New(env, numAudioSampleFormats);
    std::string format;

    for (auto i = 0; i < numAudioSampleFormats; i++) {
        format = Mix_GetChunkDecoder(i);
        std::transform(format.begin(), format.end(), format.begin(), ::tolower);
        audioSampleFormats[i] = String::New(env, format);
    }

    return audioSampleFormats;
}

Value SDLMixerAudioContext::GetAudioStreamFormats(const CallbackInfo& info) {
    auto env = info.Env();
    auto numAudioStreamFormats = Mix_GetNumChunkDecoders();
    auto audioStreamFormats = Array::New(env, numAudioStreamFormats);
    std::string format;

    for (auto i = 0; i < numAudioStreamFormats; i++) {
        format = Mix_GetChunkDecoder(i);
        std::transform(format.begin(), format.end(), format.begin(), ::tolower);
        audioStreamFormats[i] = String::New(env, format);
    }

    return audioStreamFormats;
}
