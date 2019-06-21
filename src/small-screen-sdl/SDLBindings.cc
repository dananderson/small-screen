/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "SDLBindings.h"
#include <SDL.h>
#include "Util.h"
#include <cstdio>
#include <cstdlib>
#include "Format.h"
#include "TextureFormat.h"
#include <set>
#include <vector>
#include <algorithm>
#include <map>
#include <iostream>
#include "FontSample.h"
#include "SDLClient.h"

using namespace Napi;

Value toResolution(const Env env, int width, int height);
Uint32 getTexturePixelFormat(const SDL_DisplayMode& screen, const SDL_RendererInfo& renderInfo);
TextureFormat getTextureFormat(Uint32 pixelFormat);
std::string getTextureFormatName(TextureFormat textureFormat);
void AddGameControllerMappings();
void LoadGameControllerMappings();

static const std::vector<Uint32> TEXTURE_PIXEL_FORMATS = {
    SDL_PIXELFORMAT_ARGB8888,
    SDL_PIXELFORMAT_RGBA8888,
    SDL_PIXELFORMAT_ABGR8888,
    SDL_PIXELFORMAT_BGRA8888
};

static std::vector<unsigned char> sGameControllerMappings;
static bool sGameControllerMappingsTried = false;

struct Resolution {
    int width;
    int height;

    Resolution() : width(0), height(0) {

    }

    Resolution(int width, int height) : width(width), height(height) {

    }

    bool Equals(int width, int height) {
        return width == this->width && height == this->height;
    }

    bool operator<(const Resolution &rhs) const {
        return std::tie(this->width, this->height) < std::tie(rhs.width, rhs.height);
    }
};

void Init() {
    SDL_Init(SDL_INIT_JOYSTICK | SDL_INIT_GAMECONTROLLER | SDL_INIT_VIDEO | SDL_INIT_AUDIO);

    if (SDL_WasInit(SDL_INIT_VIDEO) != 0) {
        SDL_SetHint("SDL_HINT_RENDER_SCALE_QUALITY", "linear");
    }

    if (SDL_WasInit(SDL_INIT_JOYSTICK | SDL_INIT_GAMECONTROLLER) != 0) {
        SDL_GameControllerEventState(SDL_IGNORE);
        AddGameControllerMappings();
    }
}

void JS_Attach(const CallbackInfo& info) {
    Init();

    if (SDL_WasInit(SDL_INIT_VIDEO) == 0) {
        throw Error::New(info.Env(), Format() << "SDL_Init(SDL_INIT_VIDEO): " << SDL_GetError());
    }

    if (SDL_WasInit(SDL_INIT_JOYSTICK | SDL_INIT_GAMECONTROLLER) == 0) {
        throw Error::New(info.Env(), Format() << "SDL_Init(SDL_INIT_JOYSTICK | SDL_INIT_GAMECONTROLLER): " << SDL_GetError());
    }
}

void JS_Detach(const CallbackInfo& info) {
    SDL_Quit();
}

Object JS_GetCapabilities(const CallbackInfo& info) {
    auto env = info.Env();
    auto caps = Object::New(env);

    caps["hasGraphics"] = SDL_WasInit(SDL_INIT_VIDEO) != 0;
    caps["hasGamepad"] = SDL_WasInit(SDL_INIT_JOYSTICK | SDL_INIT_GAMECONTROLLER) != 0;
    caps["hasAudio"] = SDL_WasInit(SDL_INIT_AUDIO) != 0;

    SDL_DisplayMode screenDisplayMode = {};
    SDL_Rect usableBounds = {};
    SDL_RendererInfo rendererInfo = {};

    SDL_GetRenderDriverInfo(0, &rendererInfo);
    SDL_GetDesktopDisplayMode(0, &screenDisplayMode);
    SDL_GetDisplayBounds(0, &usableBounds);

    auto windowManagerBounds = Object::New(env);

    windowManagerBounds["x"] = usableBounds.x;
    windowManagerBounds["y"] = usableBounds.y;
    windowManagerBounds["width"] = usableBounds.w;
    windowManagerBounds["height"] = usableBounds.h;

    SDL_DisplayMode displayMode = {};
    auto numDisplayModes = SDL_GetNumDisplayModes(0);
    std::set<Resolution> resolutionSet;

    for (auto i = 0; i < numDisplayModes; i++) {
        if (SDL_GetDisplayMode(0, i, &displayMode) == 0) {
            resolutionSet.insert(Resolution(displayMode.w, displayMode.h));
        }
    }

    auto resolutions = Array::New(env);

    for (auto& p : resolutionSet) {
        resolutions[resolutions.Length()] = toResolution(env, p.width, p.height);
    }

    auto texturePixelFormat = getTexturePixelFormat(screenDisplayMode, rendererInfo);
    auto textureFormat = getTextureFormat(texturePixelFormat);

    caps["driverName"] = String::New(env, rendererInfo.name);
    caps["defaultResolution"] = toResolution(env, screenDisplayMode.w, screenDisplayMode.h);
    caps["windowManagerBounds"] = windowManagerBounds;
    caps["texturePixelFormat"] = Number::New(env, texturePixelFormat);
    caps["texturePixelFormatName"] = String::New(env, SDL_GetPixelFormatName(texturePixelFormat));
    caps["textureFormat"] = Number::New(env, textureFormat);
    caps["textureFormatName"] = String::New(env, getTextureFormatName(textureFormat));
    caps["availableResolutions"] = resolutions;
    caps["vsync"] = Boolean::New(env, (rendererInfo.flags & SDL_RENDERER_PRESENTVSYNC) != 0);

    return caps;
}

void LoadGameControllerMappings() {
    auto GAME_CONTROLLER_MAPPINGS = std::getenv("GAME_CONTROLLER_MAPPINGS");

    if (GAME_CONTROLLER_MAPPINGS != nullptr) {
        auto file = std::string(GAME_CONTROLLER_MAPPINGS);

        if (!file.empty() && file[0] == '~') {
            auto HOME = std::getenv("HOME");

            if (HOME != nullptr) {
                file.replace(0, 1, HOME);
            }
        }

        if (!file.empty()) {
            try {
                sGameControllerMappings.clear();
                ReadBytesFromFile(file, sGameControllerMappings);
                if (!sGameControllerMappings.empty()) {
                    std::cout << "Loaded GAME_CONTROLLER_MAPPINGS=\"" << GAME_CONTROLLER_MAPPINGS << "\"" << std::endl;
                }
            } catch (...) {
                std::cout << "Failed to read GAME_CONTROLLER_MAPPINGS=\"" << GAME_CONTROLLER_MAPPINGS << "\"" << std::endl;
            }
        }
    }
}

void AddGameControllerMappings() {
    if (!sGameControllerMappingsTried) {
        LoadGameControllerMappings();
        sGameControllerMappingsTried = true;
    }

    if (!sGameControllerMappings.empty()) {
        auto result = SDL_GameControllerAddMappingsFromRW(
            SDL_RWFromMem(static_cast<void *>(&sGameControllerMappings[0]), sGameControllerMappings.size()), 1);

        if (result == -1) {
            std::cout << "SDL_GameControllerAddMappings: Error: " << SDL_GetError() << std::endl;
        }
    }
}

Uint32 getTexturePixelFormat(const SDL_DisplayMode& screen, const SDL_RendererInfo& rendererInfo) {
    Uint32 pixelFormat = SDL_PIXELFORMAT_UNKNOWN;

    if(std::find(TEXTURE_PIXEL_FORMATS.begin(), TEXTURE_PIXEL_FORMATS.end(), screen.format) != TEXTURE_PIXEL_FORMATS.end()) {
        pixelFormat = screen.format;
    } else {
        for (auto &p : TEXTURE_PIXEL_FORMATS) {
            for (int i = 0; i < (int)rendererInfo.num_texture_formats; i++) {
                if (p == rendererInfo.texture_formats[i]) {
                    pixelFormat = p;
                    break;
                }
            }
        }
    }

    return pixelFormat;
}

TextureFormat getTextureFormat(Uint32 pixelFormat) {
    switch (pixelFormat) {
        case SDL_PIXELFORMAT_ARGB8888:
            return TEXTURE_FORMAT_ARGB;
        case SDL_PIXELFORMAT_RGBA8888:
            return TEXTURE_FORMAT_RGBA;
        case SDL_PIXELFORMAT_ABGR8888:
            return TEXTURE_FORMAT_ABGR;
        case SDL_PIXELFORMAT_BGRA8888:
            return TEXTURE_FORMAT_BGRA;
        default:
            return TEXTURE_FORMAT_NONE;
    }
}

std::string getTextureFormatName(TextureFormat textureFormat) {
    switch (textureFormat) {
        case TEXTURE_FORMAT_RGBA:
            return "rgba";
        case TEXTURE_FORMAT_ARGB:
            return "argb";
        case TEXTURE_FORMAT_ABGR:
            return "abgr";
        case TEXTURE_FORMAT_BGRA:
            return "bgra";
        default:
            return "none";
    }
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

Value toResolution(const Env env, int width, int height) {
    auto result = Object::New(env);

    result["width"] = Number::New(env, width);
    result["height"] = Number::New(env, height);

    return result;
}

std::string GetSDLVersion() {
    SDL_version linked;
    SDL_GetVersion(&linked);

    return Format() << (int)linked.major << "." << (int)linked.minor << "." << (int)linked.patch >> Format::to_str;
}

Object SDLBindingsInit(Env env, Object exports) {
    exports["attach"] = Function::New(env, JS_Attach, "attach");
    exports["detach"] = Function::New(env, JS_Detach, "detach");
    exports["capabilities"] = Function::New(env, JS_GetCapabilities, "capabilties");
    exports["version"] = String::New(env, GetSDLVersion());
    exports["eventSize"] = Number::New(env, sizeof(SDL_Event));

    // TODO: refactor these free floating functions to a class
    exports["getEvents"] = Function::New(env, JS_GetEvents, "getEvents");

    return exports;
}