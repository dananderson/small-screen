/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "SDLClient.h"
#include "Format.h"

using namespace Napi;

FunctionReference SDLClient::constructor;

SDLClient::SDLClient(const CallbackInfo& info) : ObjectWrap<SDLClient>(info) {
    auto env = info.Env();

    if (SDL_WasInit(SDL_INIT_VIDEO) == 0) {
        throw Error::New(env, "SDL Video must be initialized before creating SDLClient instances.");
    }

    auto width = info[0].As<Number>().Uint32Value();
    auto height = info[1].As<Number>().Uint32Value();
    auto screenWidth = info[2].As<Number>().Uint32Value();
    auto screenHeight = info[3].As<Number>().Uint32Value();
    auto fullscreen = info[4].As<Boolean>().Value();
    auto vsync = info[5].As<Boolean>().Value();

    Uint32 windowFlags;
    int x;
    int y;

    if (fullscreen) {
        SDL_ShowCursor(0);
        x = y = SDL_WINDOWPOS_UNDEFINED;
        windowFlags = SDL_WINDOW_FULLSCREEN;
    } else {
        x = y = SDL_WINDOWPOS_CENTERED;
        windowFlags = 0;
    }

    this->window = SDL_CreateWindow("", x, y, screenWidth, screenHeight, windowFlags);

    if (!this->window) {
        throw Error::New(env, Format() << "SDL_CreateWindow(): " << SDL_GetError());
    }

    auto flags = SDL_RENDERER_TARGETTEXTURE | SDL_RENDERER_ACCELERATED;

    if (vsync) {
        flags |= SDL_RENDERER_PRESENTVSYNC;
    }

    this->renderer = SDL_CreateRenderer(window, 0, flags);

    if (!this->renderer) {
        SDL_DestroyWindow(this->window);
        this->window = nullptr;
        throw Error::New(env, Format() << "SDL_CreateRenderer(): " << SDL_GetError());
    }

    SDL_GetRendererOutputSize(this->renderer, &this->screenWidth, &this->screenHeight);

    if (width != (Uint32)this->screenWidth || height != (Uint32)this->screenHeight) {
        SDL_RenderSetLogicalSize(this->renderer, width, height);
    }

    this->width = width;
    this->height = height;
    this->isFullscreen = (SDL_GetWindowFlags(this->window) & (SDL_WINDOW_FULLSCREEN | SDL_WINDOW_FULLSCREEN_DESKTOP)) != 0;
}

Object SDLClient::Init(Napi::Env env, Object exports) {
    Function func = DefineClass(env, "SDLClient", {
        InstanceMethod("present", &SDLClient::Present),
        InstanceMethod("destroy", &SDLClient::Destroy),
        InstanceMethod("getTitle", &SDLClient::GetTitle),
        InstanceMethod("setTitle", &SDLClient::SetTitle),
        InstanceMethod("getWidth", &SDLClient::GetWidth),
        InstanceMethod("getHeight", &SDLClient::GetHeight),
        InstanceMethod("getScreenWidth", &SDLClient::GetScreenWidth),
        InstanceMethod("getScreenHeight", &SDLClient::GetScreenHeight),
        InstanceMethod("isFullscreen", &SDLClient::IsFullscreen),
    });

    constructor = Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("SDLClient", func);

    return exports;
}

void SDLClient::Present(const CallbackInfo& info) {
    if (this->renderer) {
        SDL_RenderPresent(this->renderer);
    }
}

void SDLClient::Destroy(const CallbackInfo& info) {
    if (this->window) {
        SDL_DestroyWindow(this->window);
        this->window = nullptr;
    }

    if (this->renderer) {
        SDL_DestroyRenderer(this->renderer);
        this->renderer = nullptr;
    }

    this->width = this->height = 0;
    this->isFullscreen = false;
}

Value SDLClient::GetTitle(const CallbackInfo& info) {
    const char *title = "";

    if (this->window) {
        title = SDL_GetWindowTitle(this->window);
    }

    return String::New(info.Env(), title);
}

void SDLClient::SetTitle(const CallbackInfo& info) {
    if (this->window) {
        SDL_SetWindowTitle(this->window, info[0].IsString() ? info[0].ToString().Utf8Value().c_str() : "");
    }
}

Value SDLClient::GetWidth(const CallbackInfo& info) {
    return Number::New(info.Env(), this->width);
}

Value SDLClient::GetHeight(const CallbackInfo& info) {
    return Number::New(info.Env(), this->height);
}

Value SDLClient::GetScreenWidth(const CallbackInfo& info) {
    return Number::New(info.Env(), this->screenWidth);
}

Value SDLClient::GetScreenHeight(const CallbackInfo& info) {
    return Number::New(info.Env(), this->screenHeight);
}

Value SDLClient::IsFullscreen(const CallbackInfo& info) {
    return Boolean::New(info.Env(), this->isFullscreen);
}
