/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "Graphics.h"
#include <cstdio>
#include <SDL.h>
#include <map>
#include <iostream>
#include "FontSample.h"
#include "Util.h"
#include "Format.h"

using namespace Napi;

Value JS_CreateFontTexture(const CallbackInfo& info) {
    auto renderer = info[0].As<External<SDL_Renderer>>().Data();
    auto sample = info[1].As<External<FontSample>>().Data();
    auto format = info[2].As<Number>().Uint32Value();
    auto width = sample->GetTextureWidth();
    auto height = sample->GetTextureHeight();

    auto texture = SDL_CreateTexture(renderer,
                                     format,
                                     SDL_TEXTUREACCESS_STREAMING,
                                     width,
                                     height);

    if (texture == nullptr) {
        throw Error::New(info.Env(), Format() << "Failed to create texture. " << SDL_GetError());
    }

    void *pixels;
    int destPitch;

    auto result = SDL_LockTexture(texture, nullptr, &pixels, &destPitch);

    if (result != 0) {
        SDL_DestroyTexture(texture);
        throw Error::New(info.Env(), Format() << "Failed to lock texture. " << SDL_GetError());
    }


    auto dest = reinterpret_cast<unsigned char *>(pixels);
    auto source = sample->GetTexturePixels();

    if (IsBigEndian()) {
        for (int h = 0; h < height; h++) {
            auto column = &dest[h*destPitch];

            for (int w = 0; w < width; w++) {
                auto alpha = *source++;

                *column++ = alpha;
                *column++ = 255;
                *column++ = 255;
                *column++ = 255;
            }
        }
    } else {
        for (int h = 0; h < height; h++) {
            auto column = &dest[h*destPitch];

            for (int w = 0; w < width; w++) {
                auto alpha = *source++;

                *column++ = 255;
                *column++ = 255;
                *column++ = 255;
                *column++ = alpha;
            }
        }
    }

    SDL_UnlockTexture(texture);

    return External<SDL_Texture>::New(info.Env(), texture);
}

Value JS_CreateTexture(const CallbackInfo& info) {
    auto renderer = info[0].As<External<SDL_Renderer>>().Data();
    auto width = info[1].As<Number>().Int32Value();
    auto height = info[2].As<Number>().Int32Value();
    auto format = info[3].As<Number>().Uint32Value();
    auto source = info[4].As<Buffer<Uint8>>().Data();

    auto texture = SDL_CreateTexture(renderer,
                                     format,
                                     SDL_TEXTUREACCESS_STREAMING,
                                     width,
                                     height);

    if (texture == nullptr) {
        throw Error::New(info.Env(), Format() << "Failed to create texture. " << SDL_GetError());
    }

    void *pixels;
    int pitch;

    auto result = SDL_LockTexture(texture, nullptr, &pixels, &pitch);

    if (result != 0) {
        SDL_DestroyTexture(texture);
        throw Error::New(info.Env(), Format() << "Failed to lock texture. " << SDL_GetError());
    }

    int bpp = SDL_BYTESPERPIXEL(format);

    if (pitch == width * bpp) {
        memcpy(pixels, source, bpp * width * height);
    } else {
        auto dest = reinterpret_cast<unsigned char *>(pixels);
        
        for (int h = 0; h < height; h++) {
            auto column = &dest[h*pitch];

            for (int w = 0; w < width; w++) {
                *column++ = *source++;
                *column++ = *source++;
                *column++ = *source++;
                *column++ = *source++;
            }
        }
    }

    SDL_UnlockTexture(texture);

    return External<SDL_Texture>::New(info.Env(), texture);
}

void JS_DestroyTexture(const CallbackInfo& info) {
    auto texture = info[0].IsExternal() ? info[0].As<External<SDL_Texture>>().Data() : nullptr;

    if (texture) {
        SDL_DestroyTexture(texture);
    }
}

Object GraphicsInit(Env env, Object exports) {
    // XXX: Refactoring from old FFI code. These helper functions are an intermediary until the platform rendering
    //      classes are moved down to native.
    exports["createTexture"] = Function::New(env, JS_CreateTexture, "createTexture");
    exports["createFontTexture"] = Function::New(env, JS_CreateFontTexture, "createFontTexture");
    exports["destroyTexture"] = Function::New(env, JS_DestroyTexture, "destroyTexture");

    return exports;
}
