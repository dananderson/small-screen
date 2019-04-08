/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "SDLRenderingContext.h"
#include "Util.h"
#include "FontSample.h"
#include "TextLayout.h"
#include "CapInsets.h"
#include "SDLClient.h"
#include <iostream>
#include <chrono>
#include <memory>

using namespace Napi;
using namespace std::chrono;

inline void SetTextureTintColor(SDL_Texture *texture, const int64_t& color, uint8_t opacity);
inline void SetRenderDrawColor(SDL_Renderer *renderer, const int64_t& color, uint8_t opacity);
inline void RenderCopy(SDL_Renderer *renderer, SDL_Texture *texture, const SDL_Rect *srcrect, const SDL_Rect * dstrect,
    Value rotationAngle, const SDL_Point *rotationPoint);

FunctionReference SDLRenderingContext::constructor;
static const int64_t COLOR32 = 0xFFFFFFFF;

Object SDLRenderingContext::Init(Napi::Env env, Object exports) {
  Function func = DefineClass(env, "SDLRenderingContext", {
    InstanceMethod("pushStyle", &SDLRenderingContext::PushStyle),
    InstanceMethod("setStyle", &SDLRenderingContext::SetStyle),
    InstanceMethod("popStyle", &SDLRenderingContext::PopStyle),
    InstanceMethod("_reset", &SDLRenderingContext::Reset),
    InstanceMethod("pushClipRect", &SDLRenderingContext::PushClipRect),
    InstanceMethod("setClipRect", &SDLRenderingContext::PushClipRect),
    InstanceMethod("popClipRect", &SDLRenderingContext::PopClipRect),
    InstanceMethod("blit", &SDLRenderingContext::Blit),
    InstanceMethod("shift", &SDLRenderingContext::Shift),
    InstanceMethod("unshift", &SDLRenderingContext::Unshift),
    InstanceMethod("border", &SDLRenderingContext::Border),
    InstanceMethod("fillRect", &SDLRenderingContext::FillRect),
    InstanceMethod("drawText", &SDLRenderingContext::DrawText),
    InstanceMethod("fillRectRounded", &SDLRenderingContext::FillRectRounded),
    InstanceMethod("borderRounded", &SDLRenderingContext::BorderRounded),
    InstanceMethod("destroy", &SDLRenderingContext::Destroy),
  });

  constructor = Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("SDLRenderingContext", func);
  
  return exports;
}

SDLRenderingContext::SDLRenderingContext(const CallbackInfo& info)
    : ObjectWrap<SDLRenderingContext>(info), wx(0), wy(0), opacity(255),
      color(-1), backgroundColor(-1), borderColor(-1), tintColor(-1) {
    this->client = ObjectWrap<SDLClient>::Unwrap(info[0].As<Object>());
    this->renderer = client->GetRenderer();
}

void SDLRenderingContext::Destroy(const Napi::CallbackInfo& info) {

}

void SDLRenderingContext::PushStyle(const CallbackInfo& info) {
    this->opacityStack.push_back(this->opacity);

    this->SetStyle(info);
}

void SDLRenderingContext::SetStyle(const CallbackInfo& info) {
    HandleScope scope(info.Env());
    auto style = info[0].As<Object>();
    Napi::Value value;

    value = style.Get("opacity");

    if (value.IsNumber()) {
        auto newOpacity = static_cast<uint8_t>(value.As<Number>().Int32Value());

        this->opacity = static_cast<uint8_t>(this->opacity * newOpacity / 255.f);
    }

    value = style.Get("color");
    this->color = value.IsNumber() ? value.As<Number>().Int64Value() : 0L;

    value = style.Get("backgroundColor");
    this->backgroundColor = value.IsNumber() ? value.As<Number>().Int64Value() : 0L;

    value = style.Get("borderColor");
    this->borderColor = value.IsNumber() ? value.As<Number>().Int64Value() : 0L;

    value = style.Get("tintColor");
    this->tintColor = value.IsNumber() ? value.As<Number>().Int64Value() : 0xFFFFFFL;
}

void SDLRenderingContext::PopStyle(const CallbackInfo& info) {
    if (this->opacityStack.empty()) {
        throw Error::New(info.Env(), "SDLRenderingContext.ClearStyle(): Opacity stack should not be empty!");
    }

    this->opacity = this->opacityStack.back();
    this->opacityStack.pop_back();
}

void SDLRenderingContext::Reset(const CallbackInfo& info) {
    this->opacity = 255;
    this->wx = this->wy = 0;
    this->color = this->backgroundColor = this->borderColor = this->tintColor = -1;

    clipRectStack.clear();
    opacityStack.clear();
    positionStack.clear();

    SDL_RenderSetClipRect(renderer, nullptr);
    SDL_SetRenderDrawBlendMode(renderer, SDL_BLENDMODE_BLEND);
}

void SDLRenderingContext::PushClipRect(const CallbackInfo& info) {
    this->SetClipRect(info, true);
}

void SDLRenderingContext::SetClipRect(const CallbackInfo& info) {
    this->SetClipRect(info, false);
}

void SDLRenderingContext::SetClipRect(const CallbackInfo& info, bool push) {
    SDL_Rect rect = {
        info[0].As<Number>().Int32Value() + this->wx,
        info[1].As<Number>().Int32Value() + this->wy,
        info[2].As<Number>().Int32Value(),
        info[3].As<Number>().Int32Value()
    };
    SDL_Rect intersect;
    SDL_Rect *clipRect;

    if (!this->clipRectStack.empty()) {
        auto back = &this->clipRectStack.back();

        clipRect = (SDL_TRUE == SDL_IntersectRect(back, &rect, &intersect)) ? &intersect : back;
    } else {
        clipRect = &rect;
    }

    if (push) {
        this->clipRectStack.push_back(*clipRect);
    }
    
    SDL_RenderSetClipRect(this->renderer, clipRect);
}

void SDLRenderingContext::PopClipRect(const CallbackInfo& info) {
    if (this->clipRectStack.empty()) {
        throw Error::New(info.Env(), "SDLRenderingContext.PopClipRect(): Clip rect stack should not be empty!");
    }

    this->clipRectStack.pop_back();

    SDL_RenderSetClipRect(this->renderer, this->clipRectStack.empty() ? nullptr : &this->clipRectStack.back());
}

void SDLRenderingContext::Shift(const CallbackInfo& info) {
    this->positionStack.push_back(this->wx);
    this->positionStack.push_back(this->wy);

    this->wx += info[0].As<Number>().Int32Value();
    this->wy += info[1].As<Number>().Int32Value();
}

void SDLRenderingContext::Unshift(const CallbackInfo& info) {
    if (this->positionStack.size() < 2) {
        throw Error::New(info.Env(), "SDLRenderingContext.Unshift(): Position stack should not be empty!");
        return;
    }

    this->wy = this->positionStack.back();
    this->positionStack.pop_back();
    this->wx = this->positionStack.back();
    this->positionStack.pop_back();
}

void SDLRenderingContext::FillRect(const CallbackInfo& info) {
    SDL_Rect rect = {
        info[0].As<Number>().Int32Value() + this->wx,
        info[1].As<Number>().Int32Value() + this->wy,
        info[2].As<Number>().Int32Value(),
        info[3].As<Number>().Int32Value()
    };

    SetRenderDrawColor(this->renderer, this->backgroundColor, this->opacity);
    SDL_RenderFillRect(this->renderer, &rect);
}

void SDLRenderingContext::Border(const CallbackInfo& info) {
    SDL_Rect rect[4];
    SDL_Rect *ptr;
    auto count = 0;

    auto x = info[0].As<Number>().Int32Value() + this->wx;
    auto y = info[1].As<Number>().Int32Value() + this->wy;
    auto w = info[2].As<Number>().Int32Value();
    auto h = info[3].As<Number>().Int32Value();

    auto borderTop = info[4].As<Number>().Int32Value();
    auto borderRight = info[5].As<Number>().Int32Value();
    auto borderBottom = info[6].As<Number>().Int32Value();
    auto borderLeft = info[7].As<Number>().Int32Value();

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
        SetRenderDrawColor(this->renderer, this->borderColor, this->opacity);
        SDL_RenderFillRects(this->renderer, &rect[0], count);
    }
}

void SDLRenderingContext::DrawText(const CallbackInfo& info) {
    HandleScope scope(info.Env());

    auto text = info[0].As<String>().Utf8Value();
    auto x = info[1].As<Number>().Int32Value() + this->wx;
    auto y = info[2].As<Number>().Int32Value() + this->wy;
    auto width = info[3].As<Number>().Int32Value();
    auto height = info[4].As<Number>().Int32Value();
    auto imageResource = info[5].As<Object>();
    auto sample = imageResource.Get("font").As<External<FontSample>>().Data();
    auto texture = imageResource.Get("texture").As<External<SDL_Texture>>().Data();
    // TODO: These args should get to the native layer through pushStyle(). Need to refactor to make style info available to native layer.
    auto textLayout = ObjectWrap<TextLayout>::Unwrap(info[6].As<Object>());
    auto textAlign = (TextAlign)(info[7].IsNumber() ? info[7].As<Number>().Int32Value() : TEXT_ALIGN_LEFT);
    auto maxLines = info[8].IsNumber() ? info[8].As<Number>().Int32Value() : 0;
    auto ellipsize = info[9].ToBoolean().Value();
    auto rotationAngleValue = info[10];
    auto rotationPointX = this->wx + width / 2;
    auto rotationPointY = this->wy + height / 2;

    // Layout will only be calculated if necessary (no text, no style, no bounds changes).
    textLayout->Layout(text, sample, maxLines, ellipsize, width, MEASURE_MODE_EXACTLY, height, MEASURE_MODE_EXACTLY);

    auto line = 0;
    auto lineHeight = sample->GetLineHeight();
    auto dx = textLayout->GetLineAlignmentOffset(line++, textAlign);
    auto dy = 0.f;
    auto hasRotation = rotationAngleValue.IsNumber();
    const SDL_Rect *destRect;
    SDL_Point rotationPoint = { 0, 0 };

    SetTextureTintColor(texture, this->color, this->opacity);

    // RenderCopy for each glyph is SLOW. Since SDL does not have a batch API for textured quads, OpenGL will have to
    // be used directly to improve performance.
    for (auto iter = textLayout->Begin(); iter != textLayout->End(); iter++) {
        if (iter->HasTexture()) {
            destRect = reinterpret_cast<const SDL_Rect *>(iter->GetDestRect(dx + x, dy + y));

            if (hasRotation) {
                rotationPoint.x = rotationPointX - destRect->x;
                rotationPoint.y = rotationPointY - destRect->y;
            }

            RenderCopy(this->renderer,
                       texture,
                       reinterpret_cast<const SDL_Rect *>(iter->GetSourceRect()),
                       destRect,
                       rotationAngleValue,
                       &rotationPoint);
        } else if (iter->IsNewLine()) {
            dx = textLayout->GetLineAlignmentOffset(line++, textAlign);
            dy += lineHeight;
        }

        dx += iter->GetAdvance();
    }
}

void SDLRenderingContext::Blit(const CallbackInfo& info) {
    auto texture = info[0].As<External<SDL_Texture>>().Data();
    auto capInsetsValue = info[1];
    auto rotationAngleValue = info[2];
    auto rotationPointX = info[3].As<Number>().Int32Value();
    auto rotationPointY = info[4].As<Number>().Int32Value();
    auto x = info[5].As<Number>().Int32Value() + this->wx;
    auto y = info[6].As<Number>().Int32Value() + this->wy;
    auto width = info[7].As<Number>().Int32Value();
    auto height = info[8].As<Number>().Int32Value();

    SetTextureTintColor(texture, this->tintColor, this->opacity);

    SDL_Point rotationPoint = { rotationPointX, rotationPointY };

    if (!capInsetsValue.IsObject()) {
        SDL_Rect rect = { x, y, width, height };

        RenderCopy(this->renderer, texture, nullptr, &rect, rotationAngleValue, &rotationPoint);
    } else {
        auto capInsets = ObjectWrap<CapInsets>::Unwrap(capInsetsValue.As<Object>());

        this->BlitCapInsets(texture, capInsets->GetRectangle(), x, y, width, height, rotationAngleValue, &rotationPoint);
    }
}

void SDLRenderingContext::FillRectRounded(const Napi::CallbackInfo& info) {
    RoundedRectangleEffect roundedRectangleEffect = {
        // border radius
        info[4].As<Number>().Int32Value(),
        info[5].As<Number>().Int32Value(),
        info[6].As<Number>().Int32Value(),
        info[7].As<Number>().Int32Value(),
        // stroke
        0
    };

    auto texture = this->client->GetEffectTexture(roundedRectangleEffect);

    if (texture) {
        SetTextureTintColor(texture, this->backgroundColor, this->opacity);
        this->BlitCapInsets(
            texture,
            roundedRectangleEffect.GetCapInsets(),
            info[0].As<Number>().Int32Value() + this->wx,
            info[1].As<Number>().Int32Value() + this->wy,
            info[2].As<Number>().Int32Value(),
            info[3].As<Number>().Int32Value(),
            info.Env().Undefined(),
            nullptr);
    }
}

void SDLRenderingContext::BorderRounded(const Napi::CallbackInfo& info) {
    RoundedRectangleEffect roundedRectangleEffect = {
        // border radius
        info[5].As<Number>().Int32Value(),
        info[6].As<Number>().Int32Value(),
        info[7].As<Number>().Int32Value(),
        info[8].As<Number>().Int32Value(),
        // stroke
        info[4].As<Number>().Int32Value()
    };

    auto texture = this->client->GetEffectTexture(roundedRectangleEffect);

    if (texture != nullptr) {
        SetTextureTintColor(texture, this->borderColor, this->opacity);
        this->BlitCapInsets(
            texture,
            roundedRectangleEffect.GetCapInsets(),
            info[0].As<Number>().Int32Value() + this->wx,
            info[1].As<Number>().Int32Value() + this->wy,
            info[2].As<Number>().Int32Value(),
            info[3].As<Number>().Int32Value(),
            info.Env().Undefined(),
            nullptr);
    }
}

void SDLRenderingContext::BlitCapInsets(SDL_Texture *texture, const Rectangle& capInsets,
        int32_t x, int32_t y, int32_t width, int32_t height, Napi::Value rotationAngleValue, SDL_Point *rotationPoint) {
    auto left = capInsets.left;
    auto top = capInsets.top;
    auto right = capInsets.right;
    auto bottom = capInsets.bottom;

    int32_t textureWidth;
    int32_t textureHeight;

    // TODO: cache src rects and dest rects in CapInsets class as a "mesh", similar to how text is drawn.
    SDL_Rect srcRect;
    SDL_Rect destRect;

    SDL_QueryTexture(texture, nullptr, nullptr, &textureWidth, &textureHeight);

    // Top row

    srcRect.x = 0;
    srcRect.y = 0;
    srcRect.w = left;
    srcRect.h = top;

    destRect.x = x;
    destRect.y = y;
    destRect.w = left;
    destRect.h = top;

    RenderCopy(this->renderer, texture, &srcRect, &destRect, rotationAngleValue, rotationPoint);

    srcRect.x = left;
    srcRect.y = 0;
    srcRect.w = textureWidth - left - right;
    srcRect.h = top;

    destRect.x = x + left;
    destRect.y = y;
    destRect.w = width - left - right;
    destRect.h = top;

    RenderCopy(this->renderer, texture, &srcRect, &destRect, rotationAngleValue, rotationPoint);

    srcRect.x = textureWidth - right;
    srcRect.y = 0;
    srcRect.w = right;
    srcRect.h = top;

    destRect.x = x + width - right;
    destRect.y = y;
    destRect.w = right;
    destRect.h = top;

    RenderCopy(this->renderer, texture, &srcRect, &destRect, rotationAngleValue, rotationPoint);

    // Middle row

    srcRect.x = 0;
    srcRect.y = top;
    srcRect.w = left;
    srcRect.h = textureHeight - top - bottom;

    destRect.x = x;
    destRect.y = y + top;
    destRect.w = left;
    destRect.h = height - top - bottom;

    RenderCopy(this->renderer, texture, &srcRect, &destRect, rotationAngleValue, rotationPoint);

    srcRect.x = left;
    srcRect.y = top;
    srcRect.w = textureWidth - left - right;
    srcRect.h = textureHeight - top - bottom;

    destRect.x = x + left;
    destRect.y = y + top;
    destRect.w = width - left - right;
    destRect.h = height - top - bottom;

    RenderCopy(this->renderer, texture, &srcRect, &destRect, rotationAngleValue, rotationPoint);

    srcRect.x = textureWidth - right;
    srcRect.y = top;
    srcRect.w = right;
    srcRect.h = textureHeight - top - bottom;

    destRect.x = x + width - right;
    destRect.y = y + top;
    destRect.w = right;
    destRect.h = height - top - bottom;

    RenderCopy(this->renderer, texture, &srcRect, &destRect, rotationAngleValue, rotationPoint);

    // Bottom row

    srcRect.x = 0;
    srcRect.y = textureHeight - bottom;
    srcRect.w = left;
    srcRect.h = bottom;

    destRect.x = x;
    destRect.y = y + height - bottom;
    destRect.w = left;
    destRect.h = bottom;

    RenderCopy(this->renderer, texture, &srcRect, &destRect, rotationAngleValue, rotationPoint);

    srcRect.x = left;
    srcRect.y = textureHeight - bottom;
    srcRect.w = textureWidth - left - right;
    srcRect.h = bottom;

    destRect.x = x + left;
    destRect.y = y + height - bottom;
    destRect.w = width - left - right;
    destRect.h = bottom;

    RenderCopy(this->renderer, texture, &srcRect, &destRect, rotationAngleValue, rotationPoint);

    srcRect.x = textureWidth - right;
    srcRect.y = textureHeight - bottom;
    srcRect.w = right;
    srcRect.h = bottom;

    destRect.x = x + width - right;
    destRect.y = y + height - bottom;
    destRect.w = right;
    destRect.h = bottom;

    RenderCopy(this->renderer, texture, &srcRect, &destRect, rotationAngleValue, rotationPoint);
}

inline void SetTextureTintColor(SDL_Texture *texture, const int64_t& color, uint8_t opacity) {
    SDL_SetTextureBlendMode(texture, SDL_BLENDMODE_BLEND);

    if (IsBigEndian()) {
        SDL_SetTextureColorMod(texture, (color & 0xFF00) >> 8, (color & 0xFF0000) >> 16, (color & 0xFF000000) >> 24);
        SDL_SetTextureAlphaMod(texture, color > COLOR32 ? static_cast<uint8_t>(color & 0xFF) : opacity);
    } else {
        SDL_SetTextureColorMod(texture, (color & 0xFF0000) >> 16, (color & 0xFF00) >> 8, color & 0xFF);
        SDL_SetTextureAlphaMod(texture, color > COLOR32 ? static_cast<uint8_t>((color & 0xFF000000) >> 24) : opacity);
    }
}

inline void SetRenderDrawColor(SDL_Renderer *renderer, const int64_t& color, uint8_t opacity) {
    if (IsBigEndian()) {
        SDL_SetRenderDrawColor(
            renderer,
            (color & 0xFF00) >> 8,
            (color & 0xFF0000) >> 16,
            (color & 0xFF000000) >> 24,
            color > COLOR32 ? static_cast<uint8_t>(color & 0xFF) : opacity
        );
    } else {
        SDL_SetRenderDrawColor(
            renderer,
            (color & 0xFF0000) >> 16,
            (color & 0xFF00) >> 8,
            color & 0xFF,
            color > COLOR32 ? static_cast<uint8_t>((color & 0xFF000000) >> 24) : opacity
        );
    }
}

inline void RenderCopy(SDL_Renderer *renderer,
        SDL_Texture *texture,
        const SDL_Rect *srcrect,
        const SDL_Rect *dstrect,
        Value rotationAngle,
        const SDL_Point *rotationPoint) {
    if (rotationAngle.IsNumber()) {
        SDL_RenderCopyEx(renderer, texture, srcrect, dstrect, rotationAngle.As<Number>().DoubleValue(), rotationPoint, SDL_FLIP_NONE);
    } else {
        SDL_RenderCopy(renderer, texture, srcrect, dstrect);
    }
}