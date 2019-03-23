/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "SDLClient.h"
#include "Format.h"
#include "Util.h"
#include <cstdio>
#include <sstream>
#include <nanosvg.h>
#include <nanosvgrast.h>

using namespace Napi;

FunctionReference SDLClient::constructor;
static std::vector<unsigned char> sEffectScratch;

char *FormatArc(char *str, int len, const char *arc, int radius);
NSVGimage *CreateRoundedRectangleSVG(const RoundedRectangleEffect &spec);

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

    this->textureFormat = Cast(info[6].As<Number>().Int32Value());
    this->texturePixelFormat = info[7].As<Number>().Uint32Value();

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
        InstanceMethod("createTexture", &SDLClient::CreateTexture),
        InstanceMethod("createFontTexture", &SDLClient::CreateFontTexture),
        InstanceMethod("destroyTexture", &SDLClient::DestroyTexture),
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
    if (this->renderer) {
        for(auto & entry : this->roundedRectangleEffectTextures) {
            this->DestroyTexture(entry.second);
        }

        SDL_DestroyRenderer(this->renderer);
        this->renderer = nullptr;
    }

    if (this->window) {
        SDL_DestroyWindow(this->window);
        this->window = nullptr;
    }

    this->roundedRectangleEffectTextures.clear();
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

Value SDLClient::CreateTexture(const CallbackInfo& info) {
    auto env = info.Env();
    auto width = info[0].As<Number>().Int32Value();
    auto height = info[1].As<Number>().Int32Value();
    auto source = info[2].As<Buffer<Uint8>>();

    auto texture = this->CreateTexture(width, height, source.Data(), source.Length());

    if (texture == nullptr) {
        throw Error::New(env, Format() << "Failed to create texture. " << SDL_GetError());
    }

    return External<SDL_Texture>::New(env, texture);
}

Value SDLClient::CreateFontTexture(const CallbackInfo& info) {
    auto env = info.Env();
    auto sample = info[0].As<External<FontSample>>().Data();

    auto texture = this->CreateFontTexture(sample);

    if (texture == nullptr) {
        throw Error::New(env, Format() << "Failed to create font texture. " << SDL_GetError());
    }

    return External<SDL_Texture>::New(env, texture);
}

void SDLClient::DestroyTexture(const CallbackInfo& info) {
    auto texture = info[0].IsExternal() ? info[0].As<External<SDL_Texture>>().Data() : nullptr;

    this->DestroyTexture(texture);
}

SDL_Texture *SDLClient::CreateTexture(int width, int height, unsigned char *source, int len) {
    auto texture = SDL_CreateTexture(this->renderer,
                                     this->texturePixelFormat,
                                     SDL_TEXTUREACCESS_STREAMING,
                                     width,
                                     height);

    if (texture == nullptr) {
        return nullptr;
    }

    void *pixels;
    int pitch;
    auto result = SDL_LockTexture(texture, nullptr, &pixels, &pitch);

    if (result != 0) {
        SDL_DestroyTexture(texture);
        return nullptr;
    }

    int bpp = SDL_BYTESPERPIXEL(this->texturePixelFormat);

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

    return texture;
}

SDL_Texture *SDLClient::CreateFontTexture(FontSample *sample) {
    auto width = sample->GetTextureWidth();
    auto height = sample->GetTextureHeight();
    auto texture = SDL_CreateTexture(this->renderer,
                                     this->texturePixelFormat,
                                     SDL_TEXTUREACCESS_STREAMING,
                                     width,
                                     height);

    if (texture == nullptr) {
        return nullptr;
    }

    void *pixels;
    int destPitch;
    auto result = SDL_LockTexture(texture, nullptr, &pixels, &destPitch);

    if (result != 0) {
        SDL_DestroyTexture(texture);
        return nullptr;
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

    return texture;
}

SDL_Texture *SDLClient::GetEffectTexture(const RoundedRectangleEffect &spec) {
    auto it = this->roundedRectangleEffectTextures.find(spec);

    if (it != this->roundedRectangleEffectTextures.end()) {
        return it->second;
    }

    // Perf: SVG XML is created and parsed here. A performance improvement can be to create an SVGImage directly to avoid
    // parsing. On a Macbook, parsing takes 30-40% of the time for this operation (though total time is negligible).
    auto svg = CreateRoundedRectangleSVG(spec);

    if (!svg) {
        return (this->roundedRectangleEffectTextures[spec] = nullptr);
    }

    auto rasterizer = nsvgCreateRasterizer();

    if (!rasterizer) {
        nsvgDelete(svg);
        return (this->roundedRectangleEffectTextures[spec] = nullptr);
    }

    auto width = svg->width;
    auto height = svg->height;
    auto len = width * height * 4;

    if (len > sEffectScratch.size()) {
        sEffectScratch.resize(width * height * 4);
    }

    nsvgRasterize(rasterizer, svg, 0, 0, 1, &sEffectScratch[0], width, height, width * 4);

    nsvgDeleteRasterizer(rasterizer);
    nsvgDelete(svg);

    // Perf: Combine this with the copy operation in CreateTexture.
    ConvertToFormat(&sEffectScratch[0], len, this->textureFormat);

    return (this->roundedRectangleEffectTextures[spec] = this->CreateTexture(width, height, &sEffectScratch[0], len));
}

void SDLClient::DestroyTexture(SDL_Texture *texture) {
    if (texture) {
        SDL_DestroyTexture(texture);
    }
}

NSVGimage *CreateRoundedRectangleSVG(const RoundedRectangleEffect &spec) {
    char buff[100];
    auto len = sizeof(buff);
    std::stringstream xml;

    auto radiusTopLeft = spec.radiusTopLeft;
    auto radiusTopRight = spec.radiusTopRight;
    auto radiusBottomRight = spec.radiusBottomRight;
    auto radiusBottomLeft = spec.radiusBottomLeft;

    auto leftWidth = spec.GetLeft();
    auto rightWidth = spec.GetRight();
    auto width = leftWidth + rightWidth + 1;

    auto topHeight = spec.GetTop();
    auto bottomHeight = spec.GetBottom();
    auto height = topHeight + bottomHeight + 1;

    int strokeOverdrawCorrection;

    if (spec.stroke > 0) {
        // The stroke or border is drawn half inside and half outside the path boundaries. If the stroke-width is an
        // odd value, stroke / 2 is drawn outside the path and the rest is inside. With this SVG renderer, using
        // the ceiling of stroke / 2 seems to produce the best results. I suspect a bug in the renderer with respect
        // to drawing strokes, but I have not looked into it.
        strokeOverdrawCorrection = 1 + ((spec.stroke - 1) / 2);
    } else {
        strokeOverdrawCorrection = 0;
    }

    xml << "<svg width=\"" << width + strokeOverdrawCorrection * 2 << "\" height=\"" << height + strokeOverdrawCorrection * 2 << "\">";
    xml << "<path d=\"";

    // start
    xml << "M" << (radiusTopLeft == 0 ? strokeOverdrawCorrection : radiusTopLeft + strokeOverdrawCorrection) << "," << strokeOverdrawCorrection;

    // top line
    xml << " h" << (radiusTopLeft == 0 ? leftWidth : 0) + 1 + (radiusTopRight == 0 ? rightWidth : 0);

    // top right arc
    if (radiusTopRight > 0) {
        xml << FormatArc(buff, len, " a%i,%i 0 0 1 %i,%i", radiusTopRight) << " ";
    }

    // right line
    xml << " v" << (radiusTopRight == 0 ? topHeight : 0) + 1 + (radiusBottomRight == 0 ? bottomHeight : 0);

    // bottom right arc
    if (radiusBottomRight > 0) {
        xml << FormatArc(buff, len, " a%i,%i 0 0 1 -%i,%i", radiusBottomRight);
    }

    // bottom line
    xml << " h-" << (radiusBottomLeft == 0 ? leftWidth : 0) + 1 + (radiusBottomRight == 0 ? rightWidth : 0);

    // bottom left arc
    if (radiusBottomLeft > 0) {
        xml << FormatArc(buff, len, " a%i,%i 0 0 1 -%i,-%i", radiusBottomLeft);
    }

    // left line
    xml << " v-" << (radiusTopLeft == 0 ? topHeight : 0) + 1 + (radiusBottomLeft == 0 ? bottomHeight : 0);

    // top left arc
    if (radiusTopLeft > 0) {
        xml << FormatArc(buff, len, " a%i,%i 0 0 1 %i,-%i", radiusTopLeft);
    }

    // close path
    xml << " z\"";

    if (spec.stroke > 0) {
        xml << " fill=\"none\" stroke=\"white\"" << " stroke-width=\"" << spec.stroke << "\"";
    } else {
        xml << " fill=\"white\"";
    }

    xml << " />";
    xml << "</svg>";

    return nsvgParse(const_cast<char *>(xml.str().c_str()), "px", 96);
}

char *FormatArc(char *str, int len, const char *arc, int radius) {
    snprintf(str, len, arc, radius, radius, radius, radius);

    return str;
}
