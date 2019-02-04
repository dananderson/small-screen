/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "SDLBindings.h"
#include <SDL.h>
#include "Util.h"
#include <cstdio>
#include "Format.h"
#include "TextureFormat.h"
#include <vector>
#include <algorithm>
#include <map>
#include <iostream>
#include "FontSample.h"

using namespace Napi;

void JS_Quit(const CallbackInfo& info) {
    SDL_Quit();
}

void JS_Init(const CallbackInfo& info) {
    auto initFlags = info[0].As<Number>().Uint32Value();

    if (SDL_Init(initFlags) != 0) {
        throw Error::New(info.Env(), Format() << "Error initializing SDL Audio: " << SDL_GetError());
    }

    if (initFlags & SDL_INIT_GAMECONTROLLER) {
        SDL_GameControllerEventState(SDL_IGNORE);
    }
}

Value JS_CreateWindow(const CallbackInfo& info) {
    auto title = info[0].As<String>().Utf8Value();
    auto width = info[1].As<Number>().Uint32Value();
    auto height = info[2].As<Number>().Uint32Value();
    auto fullscreen = info[3].As<Boolean>().Value();

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

    auto window = SDL_CreateWindow(title.c_str(), x, y, width, height, windowFlags);

    if (!window) {
        throw Error::New(info.Env(), Format() << "SDL_CreateWindow(): " << SDL_GetError());
    }

    return External<SDL_Window>::New(info.Env(), window);
}

void JS_DestroyWindow(const CallbackInfo& info) {
    auto window = info[0].IsExternal() ? info[0].As<External<SDL_Window>>().Data() : nullptr;

    if (window) {
        SDL_DestroyWindow(window);
    }
}

Value JS_CreateRenderer(const CallbackInfo& info) {
    auto window = info[0].As<External<SDL_Window>>().Data();
    auto vsync = info[1].As<Boolean>().Value();

    auto flags = SDL_RENDERER_TARGETTEXTURE | SDL_RENDERER_ACCELERATED;

    if (vsync) {
        flags |= SDL_RENDERER_PRESENTVSYNC;
    }

    auto renderer = SDL_CreateRenderer(window, 0, flags);

    if (!renderer) {
        throw Error::New(info.Env(), Format() << "SDL_CreateRenderer(): " << SDL_GetError());
    }

    return External<SDL_Renderer>::New(info.Env(), renderer);
}

void JS_DestroyRenderer(const CallbackInfo& info) {
    auto renderer = info[0].IsExternal() ? info[0].As<External<SDL_Renderer>>().Data() : nullptr;

    if (renderer) {
        SDL_DestroyRenderer(renderer);
    }
}

Value JS_GetCreateTextureFormat(const CallbackInfo& info) {
    auto env = info.Env();
    SDL_DisplayMode desktop;
    std::vector<Uint32> compatibleFormats = { SDL_PIXELFORMAT_ARGB8888, SDL_PIXELFORMAT_RGBA8888, SDL_PIXELFORMAT_ABGR8888, SDL_PIXELFORMAT_BGRA8888 };
    Uint32 pixelFormat = 0;

    if (SDL_GetDesktopDisplayMode(0, &desktop) != 0) {
        throw Error::New(env, Format() << "SDL_GetDesktopDisplayMode(): " << SDL_GetError());
    }

    if(std::find(compatibleFormats.begin(), compatibleFormats.end(), desktop.format) != compatibleFormats.end()) {
        pixelFormat = desktop.format;
    } else {
        SDL_RendererInfo rendererInfo;

        if (SDL_GetRenderDriverInfo(0, &rendererInfo) != 0) {
            throw Error::New(env, Format() << "SDL_GetRenderDriverInfo(): " << SDL_GetError());
        }

        for (auto &p : compatibleFormats) {
            for (int i = 0; i < (int)rendererInfo.num_texture_formats; i++) {
                if (p == rendererInfo.texture_formats[i]) {
                    pixelFormat = p;
                    break;
                }
            }
        }
    }

    TextureFormat textureFormat;

    switch (pixelFormat) {
        case SDL_PIXELFORMAT_ARGB8888:
            textureFormat = TEXTURE_FORMAT_ARGB;
            break;
        case SDL_PIXELFORMAT_RGBA8888:
            textureFormat = TEXTURE_FORMAT_RGBA;
            break;
        case SDL_PIXELFORMAT_ABGR8888:
            textureFormat = TEXTURE_FORMAT_ABGR;
            break;
        case SDL_PIXELFORMAT_BGRA8888:
            textureFormat = TEXTURE_FORMAT_BGRA;
            break;
        default:
            throw Error::New(env, "Error: The graphics device does not have a 4 channel, 32-bit texture format.");
    }

    auto ret = Object::New(env);

    ret["pixelFormat"] = Number::New(env, pixelFormat);
    ret["textureFormat"] = Number::New(env, textureFormat);

    return ret;
}

Value JS_GetEvents(const CallbackInfo& info) {
    SDL_PumpEvents();

    auto result = SDL_PeepEvents(info[0].As<Buffer<SDL_Event>>().Data(),
                                 info[1].As<Number>().Int32Value(),
                                 SDL_GETEVENT,
                                 SDL_FIRSTEVENT,
                                 SDL_LASTEVENT);

    return Number::New(info.Env(), result);
}

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

void JS_AddGameControllerMappings(const CallbackInfo& info) {
    int result;

    if (info[0].IsBuffer()) {
        auto buffer = info[0].As<Buffer<unsigned char>>();

        result = SDL_GameControllerAddMappingsFromRW(SDL_RWFromMem(static_cast<void *>(buffer.Data()), buffer.Length()), 1);
    } else if (info[0].IsString()) {
        result = SDL_GameControllerAddMappingsFromFile(info[0].As<String>().Utf8Value().c_str());
    } else {
        throw Error::New(info.Env(), "addGameControllerMappings: Expected string filename or buffer object.");
    }

    if (result == -1) {
        throw Error::New(info.Env(), Format() << "addGameControllerMappings: Failed to load game controller database from file. " << SDL_GetError());
    }
}

Value JS_GetGamepadCount(const CallbackInfo& info) {
    return Number::New(info.Env(), SDL_NumJoysticks());
}





// extern DECLSPEC const char *SDLCALL SDL_GetError(void);
Value JS_SDL_GetError(const CallbackInfo& info) {
    auto message = SDL_GetError();

    return String::New(info.Env(), message);
}

// extern DECLSPEC Uint32 SDLCALL SDL_GetWindowFlags(SDL_Window * window);
Value JS_SDL_GetWindowFlags(const CallbackInfo& info) {
    auto window = info[0].As<External<SDL_Window>>();

    return Number::New(info.Env(), SDL_GetWindowFlags(reinterpret_cast<SDL_Window*>(window.Data())));
}

// extern DECLSPEC int SDLCALL SDL_GetRenderDriverInfo(int index, SDL_RendererInfo * info);
Value JS_SDL_GetRenderDriverInfo(const CallbackInfo& info) {
    auto env = info.Env();
    auto index = info[0].As<Number>().Int32Value();
    SDL_RendererInfo rendererInfo;

    if (SDL_GetRenderDriverInfo(index, &rendererInfo) != 0) {
        return env.Undefined();
    }

    auto textureFormats = Array::New(env, rendererInfo.num_texture_formats);

    for (Uint32 i = 0; i < rendererInfo.num_texture_formats; i++) {
        textureFormats[i] = rendererInfo.texture_formats[i];
    }

    auto result = Object::New(env);

    result["name"] = String::New(env, rendererInfo.name);
    result["flags"] = Number::New(env, rendererInfo.flags);
    result["numTextureFormats"] = Number::New(env, rendererInfo.num_texture_formats);
    result["textureFormats"] = textureFormats;
    result["maxTextureWidth"] = Number::New(env, rendererInfo.max_texture_width);
    result["maxTextureHeight"] = Number::New(env, rendererInfo.max_texture_height);

    return result;
}

// extern DECLSPEC void SDLCALL SDL_RenderPresent(SDL_Renderer * renderer);
void JS_SDL_RenderPresent(const CallbackInfo& info) {
    SDL_RenderPresent(info[0].As<External<SDL_Renderer>>().Data());
}

// extern DECLSPEC int SDLCALL SDL_GetRendererOutputSize(SDL_Renderer * renderer, int *w, int *h);
Value JS_SDL_GetRendererOutputSize(const CallbackInfo& info) {
    int w, h;

    auto result = SDL_GetRendererOutputSize(info[0].As<External<SDL_Renderer>>().Data(), &w, &h);

    if (result != 0) {
        return info.Env().Undefined();
    }

    auto dimensions = Object::New(info.Env());

    dimensions["width"] = w;
    dimensions["height"] = h;

    return dimensions;
}

// extern DECLSPEC Uint32 SDLCALL SDL_GetWindowPixelFormat(SDL_Window * window);
Value JS_SDL_GetWindowPixelFormat(const CallbackInfo& info) {
    auto result = SDL_GetWindowPixelFormat(info[0].As<External<SDL_Window>>().Data());

    return Number::New(info.Env(), result);
}

// extern DECLSPEC int SDLCALL SDL_GetNumDisplayModes(int displayIndex);
Value JS_SDL_GetNumDisplayModes(const CallbackInfo& info) {
    auto result = SDL_GetNumDisplayModes(info[0].As<Number>().Int32Value());

    return Number::New(info.Env(), result);
}

// extern DECLSPEC const char *SDLCALL SDL_GetWindowTitle(SDL_Window * window);
Value JS_SDL_GetWindowTitle(const CallbackInfo& info) {
    auto result = SDL_GetWindowTitle(info[0].As<External<SDL_Window>>().Data());

    return String::New(info.Env(), result);
}

// extern DECLSPEC void SDLCALL SDL_SetWindowTitle(SDL_Window * window, const char *title);
void JS_SDL_SetWindowTitle(const CallbackInfo& info) {
    SDL_SetWindowTitle(info[0].As<External<SDL_Window>>().Data(),
                       info[1].As<String>().Utf8Value().c_str());
}

Value toDisplayMode(const Env env, const SDL_DisplayMode& displayMode) {
    auto result = Object::New(env);

    result["width"] = Number::New(env, displayMode.w);
    result["height"] = Number::New(env, displayMode.h);
    result["format"] = Number::New(env, displayMode.format);
    result["refreshRate"] = Number::New(env, displayMode.refresh_rate);

    return result;
}

// extern DECLSPEC int SDLCALL SDL_GetDisplayMode(int displayIndex, int modeIndex, SDL_DisplayMode * mode);
Value JS_SDL_GetDisplayMode(const CallbackInfo& info) {
    SDL_DisplayMode displayMode;
    auto result = SDL_GetDisplayMode(info[0].As<Number>().Int32Value(),
                                     info[1].As<Number>().Int32Value(),
                                     &displayMode);
    if (result != 0) {
        return info.Env().Undefined();
    }

    return toDisplayMode(info.Env(), displayMode);
}

// extern DECLSPEC int SDLCALL SDL_GetDesktopDisplayMode(int displayIndex, SDL_DisplayMode * mode);
Value JS_SDL_GetDesktopDisplayMode(const CallbackInfo& info) {
    SDL_DisplayMode displayMode;
    auto result = SDL_GetDesktopDisplayMode(info[0].As<Number>().Int32Value(),
                                            &displayMode);
    if (result != 0) {
        return info.Env().Undefined();
    }

    return toDisplayMode(info.Env(), displayMode);
}

// extern DECLSPEC int SDLCALL SDL_GetCurrentDisplayMode(int displayIndex, SDL_DisplayMode * mode);
Value JS_SDL_GetCurrentDisplayMode(const CallbackInfo& info) {
    SDL_DisplayMode displayMode;
    auto result = SDL_GetCurrentDisplayMode(info[0].As<Number>().Int32Value(), &displayMode);
    if (result != 0) {
        return info.Env().Undefined();
    }

    return toDisplayMode(info.Env(), displayMode);
}

// extern DECLSPEC const char* SDLCALL SDL_GetPixelFormatName(Uint32 format);
Value JS_SDL_GetPixelFormatName(const CallbackInfo& info) {
    auto name = SDL_GetPixelFormatName(info[0].As<Number>().Uint32Value());

    return String::New(info.Env(), name);
}

// extern DECLSPEC SDL_JoystickID SDLCALL SDL_JoystickGetDeviceInstanceID(int device_index);
Value JS_SDL_JoystickGetDeviceInstanceID(const CallbackInfo& info) {
    auto index = info[0].As<Number>().Int32Value();
    auto instanceId = SDL_JoystickGetDeviceInstanceID(index);

    return Number::New(info.Env(), instanceId);
}


std::string GetSDLVersion() {
    SDL_version linked;
    SDL_GetVersion(&linked);

    return Format() << (int)linked.major << "." << (int)linked.minor << "." << (int)linked.patch >> Format::to_str;
}

Object SDLBindingsInit(Env env, Object exports) {
    // XXX: Refactoring from old FFI code. These helper functions will be removed when the platform rendering
    //      classes are moved down to native.

    exports["init"] = Function::New(env, JS_Init, "init");
    exports["quit"] = Function::New(env, JS_Quit, "quit");
    exports["createWindow"] = Function::New(env, JS_CreateWindow, "createWindow");
    exports["destroyWindow"] = Function::New(env, JS_DestroyWindow, "destroyWindow");
    exports["createRenderer"] = Function::New(env, JS_CreateRenderer, "createRenderer");
    exports["destroyRenderer"] = Function::New(env, JS_DestroyRenderer, "destroyRenderer");
    exports["getCreateTextureFormat"] = Function::New(env, JS_GetCreateTextureFormat, "getCreateTextureFormat");
    exports["getEvents"] = Function::New(env, JS_GetEvents, "getEvents");
    exports["createTexture"] = Function::New(env, JS_CreateTexture, "createTexture");
    exports["createFontTexture"] = Function::New(env, JS_CreateFontTexture, "createFontTexture");
    exports["destroyTexture"] = Function::New(env, JS_DestroyTexture, "destroyTexture");
    exports["addGameControllerMappings"] = Function::New(env, JS_AddGameControllerMappings, "addGameControllerMappings");
    exports["getGamepadCount"] = Function::New(env, JS_GetGamepadCount, "getGamepadCount");

    exports["SDL_VERSION"] = String::New(env, GetSDLVersion());
    exports["SDL_EVENT_SIZE"] = Number::New(env, sizeof(SDL_Event));




    exports["SDL_GetError"] = Function::New(env, JS_SDL_GetError, "SDL_GetError");
    exports["SDL_GetWindowFlags"] = Function::New(env, JS_SDL_GetWindowFlags, "SDL_GetWindowFlags");
    exports["SDL_GetRenderDriverInfo"] = Function::New(env, JS_SDL_GetRenderDriverInfo, "SDL_GetRenderDriverInfo");
    exports["SDL_RenderPresent"] = Function::New(env, JS_SDL_RenderPresent, "SDL_RenderPresent");
    exports["SDL_GetRendererOutputSize"] = Function::New(env, JS_SDL_GetRendererOutputSize, "SDL_GetRendererOutputSize");
    exports["SDL_GetWindowPixelFormat"] = Function::New(env, JS_SDL_GetWindowPixelFormat, "SDL_GetWindowPixelFormat");
    exports["SDL_GetNumDisplayModes"] = Function::New(env, JS_SDL_GetNumDisplayModes, "SDL_GetNumDisplayModes");
    exports["SDL_GetWindowTitle"] = Function::New(env, JS_SDL_GetWindowTitle, "SDL_GetWindowTitle");
    exports["SDL_SetWindowTitle"] = Function::New(env, JS_SDL_SetWindowTitle, "SDL_SetWindowTitle");
    exports["SDL_GetDisplayMode"] = Function::New(env, JS_SDL_GetDisplayMode, "SDL_GetDisplayMode");
    exports["SDL_GetDesktopDisplayMode"] = Function::New(env, JS_SDL_GetDesktopDisplayMode, "SDL_GetDesktopDisplayMode");
    exports["SDL_GetCurrentDisplayMode"] = Function::New(env, JS_SDL_GetCurrentDisplayMode, "SDL_GetCurrentDisplayMode");
    exports["SDL_GetPixelFormatName"] = Function::New(env, JS_SDL_GetPixelFormatName, "SDL_GetPixelFormatName");
    exports["SDL_JoystickGetDeviceInstanceID"] = Function::New(env, JS_SDL_JoystickGetDeviceInstanceID, "SDL_JoystickGetDeviceInstanceID");

    exports["SDL_INIT_TIMER"] = Number::New(env, SDL_INIT_TIMER);
    exports["SDL_INIT_AUDIO"] = Number::New(env, SDL_INIT_AUDIO);
    exports["SDL_INIT_VIDEO"] = Number::New(env, SDL_INIT_VIDEO);
    exports["SDL_INIT_JOYSTICK"] = Number::New(env, SDL_INIT_JOYSTICK);
    exports["SDL_INIT_HAPTIC"] = Number::New(env, SDL_INIT_HAPTIC);
    exports["SDL_INIT_GAMECONTROLLER"] = Number::New(env, SDL_INIT_GAMECONTROLLER);
    exports["SDL_INIT_EVENTS"] = Number::New(env, SDL_INIT_EVENTS);
    exports["SDL_INIT_NOPARACHUTE"] = Number::New(env, SDL_INIT_NOPARACHUTE);
    exports["SDL_INIT_EVERYTHING"] = Number::New(env, SDL_INIT_EVERYTHING);

    auto renderFlags = Object::New(env);

    exports["SDL_RendererFlags"] = renderFlags;

    renderFlags["SDL_RENDERER_SOFTWARE"] = Number::New(env, SDL_RENDERER_SOFTWARE);
    renderFlags["SDL_RENDERER_ACCELERATED"] = Number::New(env, SDL_RENDERER_ACCELERATED);
    renderFlags["SDL_RENDERER_PRESENTVSYNC"] = Number::New(env, SDL_RENDERER_PRESENTVSYNC);
    renderFlags["SDL_RENDERER_TARGETTEXTURE"] = Number::New(env, SDL_RENDERER_TARGETTEXTURE);

    return exports;
}