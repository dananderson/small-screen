/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef SDLRENDERINGCONTEXT_H
#define SDLRENDERINGCONTEXT_H

#include "napi.h"
#include "SDLClient.h"
#include "Rectangle.h"
#include <SDL.h>
#include <vector>

class SDLRenderingContext : public Napi::ObjectWrap<SDLRenderingContext> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);
  
    SDLRenderingContext(const Napi::CallbackInfo& info);
    virtual ~SDLRenderingContext() {}

    void PushStyle(const Napi::CallbackInfo& info);
    void PopStyle(const Napi::CallbackInfo& info);
    void SetStyle(const Napi::CallbackInfo& info);
    void Reset(const Napi::CallbackInfo& info);
    void PushClipRect(const Napi::CallbackInfo& info);
    void PopClipRect(const Napi::CallbackInfo& info);
    void SetClipRect(const Napi::CallbackInfo& info);
    void Shift(const Napi::CallbackInfo& info);
    void Unshift(const Napi::CallbackInfo& info);
    void Blit(const Napi::CallbackInfo& info);
    void FillRect(const Napi::CallbackInfo& info);
    void Border(const Napi::CallbackInfo& info);
    void DrawText(const Napi::CallbackInfo& info);
    void FillRectRounded(const Napi::CallbackInfo& info);
    void BorderRounded(const Napi::CallbackInfo& info);
    void Destroy(const Napi::CallbackInfo& info);

private:
    static Napi::FunctionReference constructor;
    
    SDL_Renderer *renderer;
    int32_t wx;
    int32_t wy;
    uint8_t opacity;
    int64_t color, backgroundColor, borderColor, tintColor;
    std::vector<SDL_Rect> clipRectStack;
    std::vector<uint8_t> opacityStack;
    std::vector<int32_t> positionStack;
    SDLClient *client;

    void SetClipRect(const Napi::CallbackInfo& info, bool push);
    void BlitCapInsets(SDL_Texture *texture, const Rectangle& capInsets,
        int32_t x, int32_t y, int32_t width, int32_t height, Napi::Value rotationAngleValue, SDL_Point *rotationPoint);
};

#endif
