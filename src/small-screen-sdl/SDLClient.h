/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */
 
#ifndef SDLCLIENT_H
#define SDLCLIENT_H

#include <napi.h>
#include <SDL.h>
#include <map>
#include "TextureFormat.h"
#include "FontSample.h"
#include "RoundedRectangleEffect.h"

class SDLClient : public Napi::ObjectWrap<SDLClient> {
private:
    static Napi::FunctionReference constructor;
    SDL_Window *window;
    SDL_Renderer *renderer;
    int width;
    int height;
    int screenWidth;
    int screenHeight;
    bool isFullscreen;
    TextureFormat textureFormat;
    uint32_t texturePixelFormat;
    std::map<RoundedRectangleEffect, SDL_Texture *> roundedRectangleEffectTextures;

public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    SDLClient(const Napi::CallbackInfo& info);
    ~SDLClient() {}

    void Present(const Napi::CallbackInfo& info);
    void Destroy(const Napi::CallbackInfo& info);
    Napi::Value GetTitle(const Napi::CallbackInfo& info);
    void SetTitle(const Napi::CallbackInfo& info);
    Napi::Value GetWidth(const Napi::CallbackInfo& info);
    Napi::Value GetHeight(const Napi::CallbackInfo& info);
    Napi::Value GetScreenWidth(const Napi::CallbackInfo& info);
    Napi::Value GetScreenHeight(const Napi::CallbackInfo& info);
    Napi::Value IsFullscreen(const Napi::CallbackInfo& info);
    Napi::Value CreateTexture(const Napi::CallbackInfo& info);
    Napi::Value CreateFontTexture(const Napi::CallbackInfo& info);
    void DestroyTexture(const Napi::CallbackInfo& info);

    SDL_Texture *CreateTexture(int width, int height, unsigned char *source, int len);
    SDL_Texture *CreateFontTexture(FontSample *sample);
    SDL_Texture *GetEffectTexture(const RoundedRectangleEffect &spec);
    void DestroyTexture(SDL_Texture *texture);

    SDL_Window *GetWindow() {
        return this->window;
    }

    SDL_Renderer *GetRenderer() {
        return this->renderer;
    }

    TextureFormat GetTextureFormat() {
        return this->textureFormat;
    }

    uint32_t GetTexturePixelFormat() {
        return this->texturePixelFormat;
    }
};

#endif
