/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "Graphics.h"
#include <iostream>
#include <SDL.h>
#include <vector>
#include <map>
#include "Util.h"

using namespace Napi;

static auto sIsBigEndian = IsBigEndian();
static auto sClipRectStack = std::vector<SDL_Rect>();
static auto sRenderDrawColor = 0xFF000000;
static auto sTextureColors = std::map<SDL_Texture*, Uint32>();

inline void SetRenderDrawColor(SDL_Renderer *renderer, Uint32 color) {
    if (color != sRenderDrawColor) {
        if (sIsBigEndian) {
            SDL_SetRenderDrawColor(renderer, (color & 0xFF00) >> 8, (color & 0xFF0000) >> 16, (color & 0xFF000000) >> 24, color & 0xFF);
        } else {
            SDL_SetRenderDrawColor(renderer, (color & 0xFF0000) >> 16, (color & 0xFF00) >> 8, color & 0xFF, (color & 0xFF000000) >> 24);
        }

        sRenderDrawColor = color;
    }
}

inline void SetTextureTintColor(SDL_Texture *texture, Uint32 color) {
    if (sTextureColors[texture] != color) {
        if (sIsBigEndian) {
            SDL_SetTextureColorMod(texture, (color & 0xFF00) >> 8, (color & 0xFF0000) >> 16, (color & 0xFF000000) >> 24);
            SDL_SetTextureAlphaMod(texture, color & 0xFF);
        } else {
            SDL_SetTextureColorMod(texture, (color & 0xFF0000) >> 16, (color & 0xFF00) >> 8, color & 0xFF);
            SDL_SetTextureAlphaMod(texture, (color & 0xFF000000) >> 24);
        }
    }
}

void JS_Blit(const CallbackInfo& info) {
    auto texture = info[1].As<External<SDL_Texture>>().Data();
    auto color = info[2].As<Number>().Uint32Value();
    SDL_Rect rect = {
        info[3].As<Number>().Int32Value(),
        info[4].As<Number>().Int32Value(),
        info[5].As<Number>().Int32Value(),
        info[6].As<Number>().Int32Value()
    };

    SetTextureTintColor(texture, color);

    SDL_RenderCopy(info[0].As<External<SDL_Renderer>>().Data(),
                   texture,
                   nullptr,
                   &rect);
}

void JS_BlitCapInsets(const CallbackInfo& info) {
    auto renderer = info[0].As<External<SDL_Renderer>>().Data();
    auto texture = info[1].As<External<SDL_Texture>>().Data();
    auto color = info[2].As<Number>().Uint32Value();

    auto x = info[3].As<Number>().Int32Value();
    auto y = info[4].As<Number>().Int32Value();
    auto width = info[5].As<Number>().Int32Value();
    auto height = info[6].As<Number>().Int32Value();

    auto left = info[7].As<Number>().Int32Value();
    auto top = info[8].As<Number>().Int32Value();
    auto right = info[9].As<Number>().Int32Value();
    auto bottom = info[10].As<Number>().Int32Value();

    int textureWidth;
    int textureHeight;

    SDL_Rect srcRect;
    SDL_Rect destRect;

    SDL_QueryTexture(texture, nullptr, nullptr, &textureWidth, &textureHeight);

    SetTextureTintColor(texture, color);

    // Top row

    srcRect.x = 0;
    srcRect.y = 0;
    srcRect.w = left;
    srcRect.h = top;

    destRect.x = x;
    destRect.y = y;
    destRect.w = left;
    destRect.h = top;

    SDL_RenderCopy(renderer, texture, &srcRect, &destRect);

    srcRect.x = left;
    srcRect.y = 0;
    srcRect.w = textureWidth - left - right;
    srcRect.h = top;

    destRect.x = x + left;
    destRect.y = y;
    destRect.w = width - left - right;
    destRect.h = top;

    SDL_RenderCopy(renderer, texture, &srcRect, &destRect);

    srcRect.x = textureWidth - right;
    srcRect.y = 0;
    srcRect.w = right;
    srcRect.h = top;

    destRect.x = x + width - right;
    destRect.y = y;
    destRect.w = right;
    destRect.h = top;

    SDL_RenderCopy(renderer, texture, &srcRect, &destRect);

    // Middle row

    srcRect.x = 0;
    srcRect.y = top;
    srcRect.w = left;
    srcRect.h = textureHeight - top - bottom;

    destRect.x = x;
    destRect.y = y + top;
    destRect.w = left;
    destRect.h = height - top - bottom;

    SDL_RenderCopy(renderer, texture, &srcRect, &destRect);

    srcRect.x = left;
    srcRect.y = top;
    srcRect.w = textureWidth - left - right;
    srcRect.h = textureHeight - top - bottom;

    destRect.x = x + left;
    destRect.y = y + top;
    destRect.w = width - left - right;
    destRect.h = height - top - bottom;

    SDL_RenderCopy(renderer, texture, &srcRect, &destRect);

    srcRect.x = textureWidth - right;
    srcRect.y = top;
    srcRect.w = right;
    srcRect.h = textureHeight - top - bottom;

    destRect.x = x + width - right;
    destRect.y = y + top;
    destRect.w = right;
    destRect.h = height - top - bottom;

    SDL_RenderCopy(renderer, texture, &srcRect, &destRect);

    // Bottom row

    srcRect.x = 0;
    srcRect.y = textureHeight - bottom;
    srcRect.w = left;
    srcRect.h = bottom;

    destRect.x = x;
    destRect.y = y + height - bottom;
    destRect.w = left;
    destRect.h = bottom;

    SDL_RenderCopy(renderer, texture, &srcRect, &destRect);

    srcRect.x = left;
    srcRect.y = textureHeight - bottom;
    srcRect.w = textureWidth - left - right;
    srcRect.h = bottom;

    destRect.x = x + left;
    destRect.y = y + height - bottom;
    destRect.w = width - left - right;
    destRect.h = bottom;

    SDL_RenderCopy(renderer, texture, &srcRect, &destRect);

    srcRect.x = textureWidth - right;
    srcRect.y = textureHeight - bottom;
    srcRect.w = right;
    srcRect.h = bottom;

    destRect.x = x + width - right;
    destRect.y = y + height - bottom;
    destRect.w = right;
    destRect.h = bottom;

    SDL_RenderCopy(renderer, texture, &srcRect, &destRect);
}

void JS_BlitSubImage(const CallbackInfo& info) {
    auto texture = info[1].As<External<SDL_Texture>>().Data();
    auto srcRect = reinterpret_cast<SDL_Rect*>(info[2].As<Buffer<Uint8>>().Data());

    SDL_Rect destRect = {
        info[3].As<Number>().Int32Value(),
        info[4].As<Number>().Int32Value(),
        info[5].As<Number>().Int32Value(),
        info[6].As<Number>().Int32Value()
    };

    SDL_RenderCopy(info[0].As<External<SDL_Renderer>>().Data(),
                   texture,
                   srcRect,
                   &destRect);
}

void JS_FillRect(const CallbackInfo& info) {
    auto renderer = info[0].As<External<SDL_Renderer>>().Data();
    auto color = info[1].As<Number>().Uint32Value();
    SDL_Rect rect = {
        info[2].As<Number>().Int32Value(),
        info[3].As<Number>().Int32Value(),
        info[4].As<Number>().Int32Value(),
        info[5].As<Number>().Int32Value()
    };

    SetRenderDrawColor(renderer, color);
    SDL_RenderFillRect(renderer, &rect);
}

void JS_Rect(const CallbackInfo& info) {
    SDL_Rect rect[4];
    SDL_Rect *ptr;
    auto count = 0;

    auto x = info[2].As<Number>().Int32Value();
    auto y = info[3].As<Number>().Int32Value();
    auto w = info[4].As<Number>().Int32Value();
    auto h = info[5].As<Number>().Int32Value();

    auto borderLeft = info[6].As<Number>().Int32Value();
    auto borderTop = info[7].As<Number>().Int32Value();
    auto borderRight = info[8].As<Number>().Int32Value();
    auto borderBottom = info[9].As<Number>().Int32Value();

    if (borderTop != 0) {
        ptr = &rect[count++];
        ptr->x = x;
        ptr->y = y;
        ptr->w = w;
        ptr->h = borderTop;
    }

    if (borderBottom != 0) {
        ptr = &rect[count++];
        ptr->x = x;
        ptr->y = y + h - borderBottom;
        ptr->w = w;
        ptr->h = borderBottom;
    }

    if (borderLeft != 0) {
        ptr = &rect[count++];
        ptr->x = x;
        ptr->y = y + borderTop;
        ptr->w = borderLeft;
        ptr->h = h - borderTop - borderBottom;
    }

    if (borderRight != 0) {
        ptr = &rect[count++];
        ptr->x = x + w - borderRight;
        ptr->y = y + borderTop;
        ptr->w = borderRight;
        ptr->h = h - borderTop - borderBottom;
    }

    if (count > 0) {
        auto renderer = info[0].As<External<SDL_Renderer>>().Data();
        auto color = info[1].As<Number>().Uint32Value();

        SetRenderDrawColor(renderer, color);
        SDL_RenderFillRects(renderer, &rect[0], count);
    }
}

void JS_PushClipRect(const CallbackInfo& info) {
    auto renderer = info[0].As<External<SDL_Renderer>>().Data();
    SDL_Rect rect = {
        info[1].As<Number>().Int32Value(),
        info[2].As<Number>().Int32Value(),
        info[3].As<Number>().Int32Value(),
        info[4].As<Number>().Int32Value()
    };
    auto clipRect = &rect;

    if (!sClipRectStack.empty()) {
        SDL_Rect intersect;
        auto back = &sClipRectStack[sClipRectStack.size() - 1];

        if (SDL_TRUE == SDL_IntersectRect(&sClipRectStack[sClipRectStack.size() - 1], &rect, &intersect)) {
            clipRect = &intersect;
        } else {
            clipRect = back;
        }
    }

    sClipRectStack.push_back(*clipRect);
    SDL_RenderSetClipRect(renderer, clipRect);
}

void JS_PopClipRect(const CallbackInfo& info) {
    if (!sClipRectStack.empty()) {
        auto renderer = info[0].As<External<SDL_Renderer>>().Data();
        SDL_Rect *clipRect;

        sClipRectStack.pop_back();

        if (!sClipRectStack.empty()) {
            clipRect = &sClipRectStack[sClipRectStack.size() - 1];
        } else {
            clipRect = nullptr;
        }

        SDL_RenderSetClipRect(renderer, clipRect);
    }
}

void JS_PrepareFrame(const CallbackInfo& info) {
    auto renderer = info[0].As<External<SDL_Renderer>>().Data();

    SDL_SetRenderDrawBlendMode(renderer, SDL_BLENDMODE_BLEND);
    SetRenderDrawColor(renderer, 0xFF000000);

    sClipRectStack.clear();
    SDL_RenderSetClipRect(renderer, nullptr);
}

Value JS_CreateTexture(const CallbackInfo& info) {
    auto renderer = info[0].As<External<SDL_Renderer>>().Data();
    auto width = info[1].As<Number>().Int32Value();
    auto height = info[2].As<Number>().Int32Value();
    auto format = info[3].As<Number>().Uint32Value();
    auto source = info[4].As<Buffer<Uint8>>();

    auto texture = SDL_CreateTexture(renderer,
                                     format,
                                     SDL_TEXTUREACCESS_STREAMING,
                                     width,
                                     height);

    if (texture == nullptr) {
        std::cout << "Failed to create texture." << std::endl;
        return info.Env().Undefined();
    }

    void *pixels;
    int pitch;

    auto result = SDL_LockTexture(texture, nullptr, &pixels, &pitch);

    if (result != 0) {
        std::cout << "Failed to lock texture." << std::endl;
        SDL_DestroyTexture(texture);
        return info.Env().Undefined();
    }

    memcpy(pixels, source.Data(), SDL_BYTESPERPIXEL(format) * width * height);

    SDL_UnlockTexture(texture);
    SDL_SetTextureBlendMode(texture, SDL_BLENDMODE_BLEND);
    SDL_SetTextureAlphaMod(texture, 255);
    SDL_SetTextureColorMod(texture, 255, 255, 255);

    sTextureColors[texture] = 0xFFFFFFFF;

    return External<SDL_Texture>::New(info.Env(), texture);
}

void JS_DestroyTexture(const CallbackInfo& info) {
    auto texture = info[0].As<External<SDL_Texture>>().Data();

    sTextureColors.erase(texture);

    SDL_DestroyTexture(texture);
}

void JS_SetTextureTintColor(const CallbackInfo& info) {
    auto texture = info[0].As<External<SDL_Texture>>().Data();
    auto color = info[1].As<Number>().Uint32Value();

    SetTextureTintColor(texture, color);
}

Object GraphicsInit(Env env, Object exports) {
    // XXX: Refactoring from old FFI code. These helper functions are an intermediary until the platform rendering
    //      classes are moved down to native.
    exports["blit"] = Function::New(env, JS_Blit, "blit");
    exports["blitCapInsets"] = Function::New(env, JS_BlitCapInsets, "blitCapInsets");
    exports["blitSubImage"] = Function::New(env, JS_BlitSubImage, "blitSubImage");
    exports["fillRect"] = Function::New(env, JS_FillRect, "fillRect");
    exports["rect"] = Function::New(env, JS_Rect, "rect");
    exports["pushClipRect"] = Function::New(env, JS_PushClipRect, "pushClipRect");
    exports["popClipRect"] = Function::New(env, JS_PopClipRect, "popClipRect");
    exports["prepareFrame"] = Function::New(env, JS_PrepareFrame, "prepareFrame");
    exports["createTexture"] = Function::New(env, JS_CreateTexture, "createTexture");
    exports["destroyTexture"] = Function::New(env, JS_DestroyTexture, "destroyTexture");
    exports["setTextureTintColor"] = Function::New(env, JS_SetTextureTintColor, "setTextureTintColor");

    return exports;
}
