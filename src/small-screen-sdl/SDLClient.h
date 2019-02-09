/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */
 
#ifndef SDLCLIENT_H
#define SDLCLIENT_H

#include <napi.h>
#include <SDL.h>

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

    SDL_Window *GetWindow() {
        return this->window;
    }

    SDL_Renderer *GetRenderer() {
        return this->renderer;
    }
};

#endif
