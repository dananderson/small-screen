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

using namespace Napi;

void JS_Quit(const CallbackInfo& info) {
    SDL_Quit();
}

void JS_Init(const CallbackInfo& info) {
    if (SDL_Init(info[0].As<Number>().Uint32Value()) != 0) {
        throw Error::New(info.Env(), Format() << "Error initializing SDL Audio: " << SDL_GetError());
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

// extern DECLSPEC int SDLCALL SDL_NumJoysticks(void);
Value JS_SDL_NumJoysticks(const CallbackInfo& info) {
    auto result = SDL_NumJoysticks();

    return Number::New(info.Env(), result);
}

// extern DECLSPEC SDL_Joystick *SDLCALL SDL_JoystickOpen(int device_index);
Value JS_SDL_JoystickOpen(const CallbackInfo& info) {
    auto result = SDL_JoystickOpen(info[0].As<Number>().Int32Value());

    return External<SDL_Joystick>::New(info.Env(), result);
}

// extern DECLSPEC const char *SDLCALL SDL_JoystickName(SDL_Joystick * joystick);
Value JS_SDL_JoystickName(const CallbackInfo& info) {
    auto result = SDL_JoystickName(info[0].As<External<SDL_Joystick>>().Data());

    return String::New(info.Env(), result);
}

// extern DECLSPEC const char *SDLCALL SDL_JoystickNameForIndex(int device_index);
Value JS_SDL_JoystickNameForIndex(const CallbackInfo& info) {
    auto result = SDL_JoystickNameForIndex(info[0].As<Number>().Int32Value());

    return String::New(info.Env(), result);
}

// extern DECLSPEC void SDLCALL SDL_JoystickClose(SDL_Joystick * joystick);
void JS_SDL_JoystickClose(const CallbackInfo& info) {
    SDL_JoystickClose(info[0].As<External<SDL_Joystick>>().Data());
}

// extern DECLSPEC SDL_JoystickID SDLCALL SDL_JoystickInstanceID(SDL_Joystick * joystick);
Value JS_SDL_JoystickInstanceID(const CallbackInfo& info) {
    auto result = SDL_JoystickInstanceID(info[0].As<External<SDL_Joystick>>().Data());

    return Number::New(info.Env(), result);
}

// extern DECLSPEC SDL_JoystickGUID SDLCALL SDL_JoystickGetGUID(SDL_Joystick * joystick);
// extern DECLSPEC void SDLCALL SDL_JoystickGetGUIDString(SDL_JoystickGUID guid, char *pszGUID, int cbGUID);
Value JS_SDL_JoystickGetGUID(const CallbackInfo& info) {
    auto guid = SDL_JoystickGetGUID(info[0].As<External<SDL_Joystick>>().Data());
    char guidStr[33];

    SDL_JoystickGetGUIDString(guid, guidStr, 33);

    return String::New(info.Env(), guidStr);
}

// extern DECLSPEC SDL_JoystickGUID SDLCALL SDL_JoystickGetDeviceGUID(int device_index);
Value JS_SDL_JoystickGetDeviceGUID(const CallbackInfo& info) {
    auto guid = SDL_JoystickGetDeviceGUID(info[0].As<Number>().Int32Value());
    char guidStr[33];

    SDL_JoystickGetGUIDString(guid, guidStr, 33);

    return String::New(info.Env(), guidStr);
}

//extern DECLSPEC int SDLCALL SDL_JoystickNumAxes(SDL_Joystick * joystick);
Value JS_SDL_JoystickNumAxes(const CallbackInfo& info) {
    auto result = SDL_JoystickNumAxes(info[0].As<External<SDL_Joystick>>().Data());

    return Number::New(info.Env(), result);
}

//extern DECLSPEC int SDLCALL SDL_JoystickNumBalls(SDL_Joystick * joystick);
Value JS_SDL_JoystickNumBalls(const CallbackInfo& info) {
    auto result = SDL_JoystickNumBalls(info[0].As<External<SDL_Joystick>>().Data());

    return Number::New(info.Env(), result);
}

//extern DECLSPEC int SDLCALL SDL_JoystickNumHats(SDL_Joystick * joystick);
Value JS_SDL_JoystickNumHats(const CallbackInfo& info) {
    auto result = SDL_JoystickNumHats(info[0].As<External<SDL_Joystick>>().Data());

    return Number::New(info.Env(), result);
}

//extern DECLSPEC int SDLCALL SDL_JoystickNumButtons(SDL_Joystick * joystick);
Value JS_SDL_JoystickNumButtons(const CallbackInfo& info) {
    auto result = SDL_JoystickNumButtons(info[0].As<External<SDL_Joystick>>().Data());

    return Number::New(info.Env(), result);
}

//#define SDL_LoadWAV(file, spec, audio_buf, audio_len) \
//    SDL_LoadWAV_RW(SDL_RWFromFile(file, "rb"),1, spec,audio_buf,audio_len)
Value JS_SDL_LoadWAV(const CallbackInfo& info) {
    auto file = info[0].As<String>().Utf8Value();
    SDL_AudioSpec spec;
    Uint8 *buffer;
    Uint32 bufferLen;

    SDL_memset(&spec, 0, sizeof(spec));

    auto result = SDL_LoadWAV_RW(SDL_RWFromFile(file.c_str(), "rb"), 1, &spec, &buffer, &bufferLen);

    if (result == nullptr) {
        return info.Env().Undefined();
    }

    return Buffer<Uint8>::New(info.Env(), buffer, bufferLen);
}

// extern DECLSPEC void SDLCALL SDL_FreeWAV(Uint8 * audio_buf);
void JS_SDL_FreeWAV(const CallbackInfo& info) {
    SDL_FreeWAV(info[0].As<Buffer<Uint8>>().Data());
}

// extern DECLSPEC SDL_bool SDLCALL SDL_IsGameController(int joystick_index);
Value JS_SDL_IsGameController(const CallbackInfo& info) {
    auto index = info[0].As<Number>().Int32Value();

    return Boolean::New(info.Env(), SDL_IsGameController(index) == SDL_TRUE);
}

// #define SDL_GameControllerAddMappingsFromFile(file)   SDL_GameControllerAddMappingsFromRW(SDL_RWFromFile(file, "rb"), 1)
void JS_SDL_GameControllerAddMappingsFromFile(const CallbackInfo& info) {
    SDL_GameControllerAddMappingsFromRW(SDL_RWFromFile(info[0].As<String>().Utf8Value().c_str(), "rb"), 1);
}

// extern DECLSPEC Uint16 SDLCALL SDL_JoystickGetDeviceVendor(int device_index);
Value JS_SDL_JoystickGetDeviceVendor(const CallbackInfo& info) {
    auto index = info[0].As<Number>().Int32Value();
    auto vendor = SDL_JoystickGetDeviceVendor(index);

    return Number::New(info.Env(), vendor);
}

// extern DECLSPEC Uint16 SDLCALL SDL_JoystickGetDeviceProduct(int device_index);
Value JS_SDL_JoystickGetDeviceProduct(const CallbackInfo& info) {
    auto index = info[0].As<Number>().Int32Value();
    auto product = SDL_JoystickGetDeviceProduct(index);

    return Number::New(info.Env(), product);
}

// extern DECLSPEC Uint16 SDLCALL SDL_JoystickGetDeviceProductVersion(int device_index);
Value JS_SDL_JoystickGetDeviceProductVersion(const CallbackInfo& info) {
    auto index = info[0].As<Number>().Int32Value();
    auto productVersion = SDL_JoystickGetDeviceProductVersion(index);

    return Number::New(info.Env(), productVersion); 
}

// extern DECLSPEC SDL_JoystickID SDLCALL SDL_JoystickGetDeviceInstanceID(int device_index);
Value JS_SDL_JoystickGetDeviceInstanceID(const CallbackInfo& info) {
    auto index = info[0].As<Number>().Int32Value();
    auto instanceId = SDL_JoystickGetDeviceInstanceID(index);

    return Number::New(info.Env(), instanceId);
}

// extern DECLSPEC int SDLCALL SDL_GameControllerAddMapping(const char* mappingString);
Value JS_SDL_GameControllerAddMapping(const CallbackInfo& info) {
    auto mappingString = info[0].IsString() ? info[0].ToString().Utf8Value() : std::string();
    auto result = SDL_GameControllerAddMapping(mappingString.c_str());

    return Boolean::New(info.Env(), result == 0);
}

Value JS_SDL_GameControllerMappingForGUID(const CallbackInfo& info) {
    auto guid = SDL_JoystickGetGUID(info[0].As<External<SDL_Joystick>>().Data());
    auto mapping = SDL_GameControllerMappingForGUID(guid);

    if (mapping) {
        return String::New(info.Env(), mapping);
    } else {
        return info.Env().Undefined();
    }
}

// const char* SDL_GetPlatform(void)
Value JS_SDL_GetPlatform(const CallbackInfo& info) {
    auto platform = SDL_GetPlatform();

    return String::New(info.Env(), platform);
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

    exports["SDL_JoystickOpen"] = Function::New(env, JS_SDL_JoystickOpen, "SDL_JoystickOpen");
    exports["SDL_JoystickName"] = Function::New(env, JS_SDL_JoystickName, "SDL_JoystickName");
    exports["SDL_JoystickNameForIndex"] = Function::New(env, JS_SDL_JoystickNameForIndex, "SDL_JoystickNameForIndex");
    exports["SDL_JoystickClose"] = Function::New(env, JS_SDL_JoystickClose, "SDL_JoystickClose");
    exports["SDL_JoystickInstanceID"] = Function::New(env, JS_SDL_JoystickInstanceID, "SDL_JoystickInstanceID");
    exports["SDL_JoystickGetGUID"] = Function::New(env, JS_SDL_JoystickGetGUID, "SDL_JoystickGetGUID");
    exports["SDL_JoystickGetDeviceGUID"] = Function::New(env, JS_SDL_JoystickGetDeviceGUID, "SDL_JoystickGetDeviceGUID");
    exports["SDL_JoystickNumAxes"] = Function::New(env, JS_SDL_JoystickNumAxes, "SDL_JoystickNumAxes");
    exports["SDL_JoystickNumBalls"] = Function::New(env, JS_SDL_JoystickNumBalls, "SDL_JoystickNumBalls");
    exports["SDL_JoystickNumHats"] = Function::New(env, JS_SDL_JoystickNumHats, "SDL_JoystickNumHats");
    exports["SDL_JoystickNumButtons"] = Function::New(env, JS_SDL_JoystickNumButtons, "SDL_JoystickNumButtons");
    exports["SDL_NumJoysticks"] = Function::New(env, JS_SDL_NumJoysticks, "SDL_NumJoysticks");

    exports["SDL_IsGameController"] = Function::New(env, JS_SDL_IsGameController, "SDL_IsGameController");
    exports["SDL_GameControllerAddMappingsFromFile"] = Function::New(env, JS_SDL_GameControllerAddMappingsFromFile, "SDL_GameControllerAddMappingsFromFile");
    exports["SDL_JoystickGetDeviceVendor"] = Function::New(env, JS_SDL_JoystickGetDeviceVendor, "SDL_JoystickGetDeviceVendor");
    exports["SDL_JoystickGetDeviceProduct"] = Function::New(env, JS_SDL_JoystickGetDeviceProduct, "SDL_JoystickGetDeviceProduct");
    exports["SDL_JoystickGetDeviceProductVersion"] = Function::New(env, JS_SDL_JoystickGetDeviceProductVersion, "SDL_JoystickGetDeviceProductVersion");
    exports["SDL_JoystickGetDeviceInstanceID"] = Function::New(env, JS_SDL_JoystickGetDeviceInstanceID, "SDL_JoystickGetDeviceInstanceID");
    exports["SDL_GameControllerAddMapping"] = Function::New(env, JS_SDL_GameControllerAddMapping, "SDL_GameControllerAddMapping");
    exports["SDL_GameControllerMappingForGUID"] = Function::New(env, JS_SDL_GameControllerMappingForGUID, "SDL_GameControllerMappingForGUID");
    exports["SDL_GetPlatform"] = Function::New(env, JS_SDL_GetPlatform, "SDL_GetPlatform");

    exports["SDL_LoadWAV"] = Function::New(env, JS_SDL_LoadWAV, "SDL_LoadWAV");
    exports["SDL_FreeWAV"] = Function::New(env, JS_SDL_FreeWAV, "SDL_FreeWAV");



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