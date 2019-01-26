/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "SDLMixerAudioContext.h"
#include <SDL.h>
#include <SDL_mixer.h>
#include <iostream>
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

    if (SDL_WasInit(SDL_INIT_AUDIO) == 0 && SDL_Init(SDL_INIT_AUDIO) != 0) {
        throw Error::New(env, Format() << "Cannot initialize audio. SDL_Init(SDL_INIT_AUDIO): " << SDL_GetError());
    }

    auto result = Mix_Init(MIX_INIT_FLAC | MIX_INIT_MOD | MIX_INIT_MP3 | MIX_INIT_OGG | MIX_INIT_MID | MIX_INIT_OPUS);

    if (result == 0) {
        throw Error::New(env, Format() << "Cannot initialize mixer. Mix_Init(): " << Mix_GetError());
    }

    if (Mix_OpenAudio(44100, MIX_DEFAULT_FORMAT, 2, 2048 ) < 0) {
        throw Error::New(env, Format() << "Cannot open mixer. Error: " << Mix_GetError());
    }

    std::cout << "Supported audio sample types: ";

    for (auto i = 0; i < Mix_GetNumChunkDecoders(); i++) {
        std::cout << Mix_GetChunkDecoder(i);
    }

    std::cout << std::endl;

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
    auto file = info[0].As<String>().Utf8Value();

    auto chunk = Mix_LoadWAV(file.c_str());

    if (!chunk) {
        throw Error::New(env, "Failed to load audio sample from file.");
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
