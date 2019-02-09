/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef SDLMIXERAUDIOCONTEXT_H
#define SDLMIXERAUDIOCONTEXT_H

#include "napi.h"

class SDLMixerAudioContext : public Napi::ObjectWrap<SDLMixerAudioContext> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    SDLMixerAudioContext(const Napi::CallbackInfo& info);
    ~SDLMixerAudioContext() {}

    void Play(const Napi::CallbackInfo& info);
    void Attach(const Napi::CallbackInfo& info);
    void Detach(const Napi::CallbackInfo& info);
    Napi::Value CreateAudioSample(const Napi::CallbackInfo& info);
    void DestroyAudioSample(const Napi::CallbackInfo& info);
    Napi::Value GetAudioSampleFormats(const Napi::CallbackInfo& info);
    Napi::Value GetAudioStreamFormats(const Napi::CallbackInfo& info);
    
private:
    static Napi::FunctionReference constructor;
    bool isOpen;
    
    void InitAudio(Napi::Env env);
    
};

#endif
