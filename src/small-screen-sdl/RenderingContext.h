/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef RENDERINGCONTEXT_H
#define RENDERINGCONTEXT_H

#include "napi.h"
#include <SDL.h>
#include <vector>

class RenderingContext : public Napi::ObjectWrap<RenderingContext> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
  
    RenderingContext(const Napi::CallbackInfo& info);
    virtual ~RenderingContext() {}
    
    void PushStyle(const Napi::CallbackInfo& info);
    void PopStyle(const Napi::CallbackInfo& info);
    Napi::Value Reset(const Napi::CallbackInfo& info);
    void PushClipRect(const Napi::CallbackInfo& info);
    void PopClipRect(const Napi::CallbackInfo& info);
    void Shift(const Napi::CallbackInfo& info);
    void Unshift(const Napi::CallbackInfo& info);
    void Blit(const Napi::CallbackInfo& info);
    void FillRect(const Napi::CallbackInfo& info);
    void Border(const Napi::CallbackInfo& info);
    void DrawText(const Napi::CallbackInfo& info);
    void BlitCapInsets(const Napi::CallbackInfo& info);

private:
    static Napi::FunctionReference constructor;
    
    SDL_Renderer *renderer;
    int wx;
    int wy;
    int opacity;
    unsigned int color, backgroundColor, borderColor, tintColor;
    std::vector<SDL_Rect> clipRectStack;
    std::vector<int> opacityStack;
    std::vector<int> positionStack;
};

#endif
