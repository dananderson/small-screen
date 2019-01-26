/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef SDLAUDIOCONTEXT_H
#define SDLAUDIOCONTEXT_H

#include "napi.h"

class SDLAudioContext : public Napi::ObjectWrap<SDLAudioContext> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    SDLAudioContext(const Napi::CallbackInfo& info);
    ~SDLAudioContext() {}

    void Play(const Napi::CallbackInfo& info);
    void Attach(const Napi::CallbackInfo& info);
    void Detach(const Napi::CallbackInfo& info);
    Napi::Value CreateAudioSample(const Napi::CallbackInfo& info);
    void DestroyAudioSample(const Napi::CallbackInfo& info);

private:
    static Napi::FunctionReference constructor;

    void InitAudio(Napi::Env env);

    bool isOpen;
};

#endif
