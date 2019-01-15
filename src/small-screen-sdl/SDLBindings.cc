/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "SDLBindings.h"
#include <SDL.h>
#include "Util.h"
#include <cstdio>

using namespace Napi;

// extern DECLSPEC int SDLCALL SDL_Init(Uint32 flags);
Value JS_SDL_Init(const CallbackInfo& info) {
    auto flags = info[0].As<Number>().Uint32Value();

    return Number::New(info.Env(), SDL_Init(flags));
}

// extern DECLSPEC int SDLCALL SDL_InitSubSystem(Uint32 flags);
Value JS_SDL_InitSubSystem(const CallbackInfo& info) {
    auto flags = info[0].As<Number>().Uint32Value();

    return Number::New(info.Env(), SDL_InitSubSystem(flags));
}

Value JS_SDL_WasInit(const CallbackInfo& info) {
    auto flags = info[0].As<Number>().Uint32Value();

    return Number::New(info.Env(), SDL_WasInit(flags));
}

// extern DECLSPEC void SDLCALL SDL_Quit(void);
void JS_SDL_Quit(const CallbackInfo& info) {
    SDL_Quit();
}

// extern DECLSPEC const char *SDLCALL SDL_GetError(void);
Value JS_SDL_GetError(const CallbackInfo& info) {
    auto message = SDL_GetError();

    return String::New(info.Env(), message);
}

// extern DECLSPEC int SDLCALL SDL_GetRenderDriverInfo(int index, SDL_RendererInfo * info);
Value JS_SDL_GetRenderDriverInfo(const CallbackInfo& info) {
    auto env = info.Env();
    auto index = info[0].As<Number>().Int32Value();
    SDL_RendererInfo rendererInfo;

    if (SDL_GetRenderDriverInfo(index, &rendererInfo) != 0) {
        return env.Undefined();
    }

    auto result = Object::New(env);
    auto textureFormats = Array::New(env, rendererInfo.num_texture_formats);

    result["name"] = String::New(env, rendererInfo.name);
    result["flags"] = Number::New(env, rendererInfo.flags);
    result["numTextureFormats"] = Number::New(env, rendererInfo.num_texture_formats);
    result["textureFormats"] = textureFormats;
    result["maxTextureWidth"] = Number::New(env, rendererInfo.max_texture_width);
    result["maxTextureHeight"] = Number::New(env, rendererInfo.max_texture_height);

    for (Uint32 i = 0; i < rendererInfo.num_texture_formats; i++) {
        textureFormats[i] = rendererInfo.texture_formats[i];
    }

    return result;
}

// extern DECLSPEC SDL_Renderer * SDLCALL SDL_CreateRenderer(SDL_Window * window, int index, Uint32 flags);
Value JS_SDL_CreateRenderer(const CallbackInfo& info) {
    auto env = info.Env();
    auto window = info[0].As<External<SDL_Window>>();
    auto index = info[1].As<Number>().Int32Value();
    auto flags = info[2].As<Number>().Uint32Value();

    auto renderer = SDL_CreateRenderer(reinterpret_cast<SDL_Window*>(window.Data()), index, flags);

    if (renderer == nullptr) {
        return env.Undefined();
    }

    return External<SDL_Renderer>::New(env, renderer);
}


// extern DECLSPEC void SDLCALL SDL_DestroyTexture(SDL_Texture * texture);
void JS_SDL_DestroyTexture(const CallbackInfo& info) {
    SDL_DestroyTexture(info[0].As<External<SDL_Texture>>().Data());
}

// extern DECLSPEC void SDLCALL SDL_DestroyRenderer(SDL_Renderer * renderer);
void JS_SDL_DestroyRenderer(const CallbackInfo& info) {
    SDL_DestroyRenderer(info[0].As<External<SDL_Renderer>>().Data());
}

// extern DECLSPEC void SDLCALL SDL_RenderPresent(SDL_Renderer * renderer);
void JS_SDL_RenderPresent(const CallbackInfo& info) {
    SDL_RenderPresent(info[0].As<External<SDL_Renderer>>().Data());
}

// extern DECLSPEC int SDLCALL SDL_RenderFillRect(SDL_Renderer * renderer, const SDL_Rect * rect);
void JS_SDL_RenderFillRect(const CallbackInfo& info) {
    SDL_RenderFillRect(info[0].As<External<SDL_Renderer>>().Data(),
                       info[1].As<Buffer<SDL_Rect>>().Data());
}

// extern DECLSPEC int SDLCALL SDL_RenderFillRects(SDL_Renderer * renderer, const SDL_Rect * rects, int count);
void JS_SDL_RenderFillRects(const CallbackInfo& info) {
    SDL_RenderFillRects(info[0].As<External<SDL_Renderer>>().Data(),
                        info[1].As<Buffer<SDL_Rect>>().Data(),
                        info[2].As<Number>().Int32Value());
}

// extern DECLSPEC int SDLCALL SDL_RenderCopy(SDL_Renderer * renderer, SDL_Texture * texture, const SDL_Rect * srcrect, const SDL_Rect * dstrect);
void JS_SDL_RenderCopy(const CallbackInfo& info) {
    SDL_RenderCopy(info[0].As<External<SDL_Renderer>>().Data(),
                   info[1].As<External<SDL_Texture>>().Data(),
                   info[2].IsBuffer() ? info[2].As<Buffer<SDL_Rect>>().Data() : nullptr,
                   info[3].IsBuffer() ? info[3].As<Buffer<SDL_Rect>>().Data() : nullptr);
}

// extern DECLSPEC int SDLCALL SDL_RenderClear(SDL_Renderer * renderer);
void JS_SDL_RenderClear(const CallbackInfo& info) {
    SDL_RenderClear(info[0].As<External<SDL_Renderer>>().Data());
}

// extern DECLSPEC int SDLCALL SDL_RenderSetClipRect(SDL_Renderer * renderer, const SDL_Rect * rect);
void JS_SDL_RenderSetClipRect(const CallbackInfo& info) {
    SDL_RenderSetClipRect(info[0].As<External<SDL_Renderer>>().Data(),
                          info[1].IsBuffer() ? info[1].As<Buffer<SDL_Rect>>().Data() : nullptr);
}

// extern DECLSPEC int SDLCALL SDL_RenderSetLogicalSize(SDL_Renderer * renderer, int w, int h);
void JS_SDL_RenderSetLogicalSize(const CallbackInfo& info) {
    SDL_RenderSetLogicalSize(info[0].As<External<SDL_Renderer>>().Data(),
                             info[1].As<Number>().Int32Value(),
                             info[2].As<Number>().Int32Value());
}

// extern DECLSPEC int SDLCALL SDL_SetRenderTarget(SDL_Renderer *renderer, SDL_Texture *texture);
void JS_SDL_SetRenderTarget(const CallbackInfo& info) {
    SDL_SetRenderTarget(info[0].As<External<SDL_Renderer>>().Data(),
                        info[1].As<External<SDL_Texture>>().Data());
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

// extern DECLSPEC SDL_Texture * SDLCALL SDL_CreateTexture(SDL_Renderer * renderer, Uint32 format, int access, int w, int h);
Value JS_SDL_CreateTexture(const CallbackInfo& info) {
    auto texture = SDL_CreateTexture(info[0].As<External<SDL_Renderer>>().Data(),
                                     info[1].As<Number>().Uint32Value(),
                                     info[2].As<Number>().Int32Value(),
                                     info[3].As<Number>().Int32Value(),
                                     info[4].As<Number>().Int32Value());
    if (texture == nullptr) {
        return info.Env().Undefined();
    }

    return External<SDL_Texture>::New(info.Env(), texture);
}

// extern DECLSPEC Uint32 SDLCALL SDL_GetWindowPixelFormat(SDL_Window * window);
Value JS_SDL_GetWindowPixelFormat(const CallbackInfo& info) {
    auto result = SDL_GetWindowPixelFormat(info[0].As<External<SDL_Window>>().Data());

    return Number::New(info.Env(), result);
}

// extern DECLSPEC void SDLCALL SDL_UnlockTexture(SDL_Texture * texture);
void JS_SDL_UnlockTexture(const CallbackInfo& info) {
    SDL_UnlockTexture(info[0].As<External<SDL_Texture>>().Data());
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

// extern DECLSPEC SDL_Window * SDLCALL SDL_CreateWindow(const char *title, int x, int y, int w, int h, Uint32 flags);
Value JS_SDL_CreateWindow(const CallbackInfo& info) {
    auto result = SDL_CreateWindow(info[0].As<String>().Utf8Value().c_str(),
                                   info[1].As<Number>().Int32Value(),
                                   info[2].As<Number>().Int32Value(),
                                   info[3].As<Number>().Int32Value(),
                                   info[4].As<Number>().Int32Value(),
                                   info[5].As<Number>().Uint32Value());
    if (result == nullptr) {
        return info.Env().Undefined();
    }

    return External<SDL_Window>::New(info.Env(), result);
}

// extern DECLSPEC void SDLCALL SDL_DestroyWindow(SDL_Window * window);
void JS_SDL_DestroyWindow(const CallbackInfo& info) {
    SDL_DestroyWindow(info[0].As<External<SDL_Window>>().Data());
}

// extern DECLSPEC int SDLCALL SDL_SetTextureAlphaMod(SDL_Texture * texture, Uint8 alpha);
void JS_SDL_SetTextureAlphaMod(const CallbackInfo& info) {
    SDL_SetTextureAlphaMod(info[0].As<External<SDL_Texture>>().Data(),
                           (Uint8)(info[1].As<Number>().Uint32Value() & 0xFF));
}

// extern DECLSPEC int SDLCALL SDL_SetTextureColorMod(SDL_Texture * texture, Uint8 r, Uint8 g, Uint8 b);
void JS_SDL_SetTextureColorMod(const CallbackInfo& info) {
    SDL_SetTextureColorMod(info[0].As<External<SDL_Texture>>().Data(),
                           (Uint8)(info[1].As<Number>().Uint32Value() & 0xFF),
                           (Uint8)(info[2].As<Number>().Uint32Value() & 0xFF),
                           (Uint8)(info[3].As<Number>().Uint32Value() & 0xFF));
}

// extern DECLSPEC int SDLCALL SDL_SetRenderDrawColor(SDL_Renderer * renderer, Uint8 r, Uint8 g, Uint8 b, Uint8 a);
void JS_SDL_SetRenderDrawColor(const CallbackInfo& info) {
    SDL_SetRenderDrawColor(info[0].As<External<SDL_Renderer>>().Data(),
                           (Uint8)(info[1].As<Number>().Uint32Value() & 0xFF),
                           (Uint8)(info[2].As<Number>().Uint32Value() & 0xFF),
                           (Uint8)(info[3].As<Number>().Uint32Value() & 0xFF),
                           (Uint8)(info[4].As<Number>().Uint32Value() & 0xFF));
}

// extern DECLSPEC int SDLCALL SDL_SetTextureBlendMode(SDL_Texture * texture, SDL_BlendMode blendMode);
void JS_SDL_SetTextureBlendMode(const CallbackInfo& info) {
    SDL_SetTextureBlendMode(info[0].As<External<SDL_Texture>>().Data(),
                            static_cast<SDL_BlendMode>(info[1].As<Number>().Uint32Value()));
}

// extern DECLSPEC int SDLCALL SDL_SetRenderDrawBlendMode(SDL_Renderer * renderer, SDL_BlendMode blendMode);
void JS_SDL_SetRenderDrawBlendMode(const CallbackInfo& info) {
    SDL_SetRenderDrawBlendMode(info[0].As<External<SDL_Renderer>>().Data(),
                               static_cast<SDL_BlendMode>(info[1].As<Number>().Uint32Value()));
}

Value toDisplayMode(const Env env, const SDL_DisplayMode& displayMode) {
    auto result = Object::New(env);

    result["width"] = Number::New(env, displayMode.w);
    result["height"] = Number::New(env, displayMode.h);
    result["format"] = Number::New(env, displayMode.format);
    result["refreshRate"] = Number::New(env, displayMode.format);

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

// extern DECLSPEC SDL_bool SDLCALL SDL_RenderGetIntegerScale(SDL_Renderer * renderer);
Value JS_SDL_RenderGetIntegerScale(const CallbackInfo& info) {
    auto result = SDL_RenderGetIntegerScale(info[0].As<External<SDL_Renderer>>().Data());

    return Number::New(info.Env(), result);
}

// extern DECLSPEC int SDLCALL SDL_LockTexture(SDL_Texture * texture, const SDL_Rect * rect, void **pixels, int *pitch);
Value JS_SDL_LockTexture(const CallbackInfo& info) {
    auto env = info.Env();
    auto texture = info[0].As<External<SDL_Texture>>().Data();
    void *pixels = nullptr;
    int pitch = 0;
    Uint32 format;

    auto result = SDL_LockTexture(texture,
                                  info[1].IsBuffer() ? info[1].As<Buffer<SDL_Rect>>().Data() : nullptr,
                                  &pixels,
                                  &pitch);

    if (result != 0) {
        return env.Undefined();
    }

    int width, height;

    SDL_QueryTexture(texture, &format, nullptr, &width, &height);

    auto data = Object::New(env);

    data["pixels"] = Buffer<Uint8>::New(env, reinterpret_cast<Uint8*>(pixels), width * height * SDL_BYTESPERPIXEL(format));
    data["pitch"] = Number::New(env, pitch);

    return data;
}

// extern DECLSPEC const char* SDLCALL SDL_GetPixelFormatName(Uint32 format);
Value JS_SDL_GetPixelFormatName(const CallbackInfo& info) {
    auto name = SDL_GetPixelFormatName(info[0].As<Number>().Uint32Value());

    return String::New(info.Env(), name);
}

// extern DECLSPEC int SDLCALL SDL_ShowCursor(int toggle);
void JS_SDL_ShowCursor(const CallbackInfo& info) {
    if (info[0].IsBoolean()) {
        SDL_ShowCursor(info[0].ToBoolean() ? 1 : 0);
    } else {
        SDL_ShowCursor(info[0].As<Number>().Int32Value());
    }
}

// extern DECLSPEC void SDLCALL SDL_PumpEvents(void);
void JS_SDL_PumpEvents(const CallbackInfo& info) {
    SDL_PumpEvents();
}

// extern DECLSPEC int SDLCALL SDL_PeepEvents(SDL_Event * events, int numevents, SDL_eventaction action, Uint32 minType, Uint32 maxType);
Value JS_SDL_PeepEvents(const CallbackInfo& info) {
    auto result = SDL_PeepEvents(info[0].As<Buffer<SDL_Event>>().Data(),
                                 info[1].As<Number>().Int32Value(),
                                 static_cast<SDL_eventaction>(info[2].As<Number>().Int32Value()),
                                 info[3].As<Number>().Uint32Value(),
                                 info[4].As<Number>().Uint32Value());
    return Number::New(info.Env(), result);
}

// extern DECLSPEC int SDLCALL SDL_OpenAudio(SDL_AudioSpec * desired, SDL_AudioSpec * obtained);
void JS_SDL_OpenAudio(const CallbackInfo& info) {
    SDL_AudioSpec desired;

    SDL_memset(&desired, 0, sizeof(desired));

    SDL_OpenAudio(&desired, nullptr);
}

// extern DECLSPEC void SDLCALL SDL_PauseAudio(int pause_on);
void JS_SDL_PauseAudio(const CallbackInfo& info) {
    SDL_PauseAudio(info[0].As<Number>().Int32Value());
}

// extern DECLSPEC int SDLCALL SDL_QueueAudio(SDL_AudioDeviceID dev, const void *data, Uint32 len);
void JS_SDL_QueueAudio(const CallbackInfo& info) {
    SDL_QueueAudio(info[0].As<Number>().Uint32Value(),
                   info[1].As<Buffer<Uint8>>().Data(),
                   info[2].As<Number>().Uint32Value());
}

// extern DECLSPEC void SDLCALL SDL_CloseAudio(void);
void JS_SDL_CloseAudio(const CallbackInfo& info) {
    SDL_CloseAudio();
}

// extern DECLSPEC void SDLCALL SDL_ClearQueuedAudio(SDL_AudioDeviceID dev);
void JS_SDL_ClearQueuedAudio(const CallbackInfo& info) {
    SDL_ClearQueuedAudio(info[0].As<Number>().Uint32Value());
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

// extern DECLSPEC SDL_GameController *SDLCALL SDL_GameControllerOpen(int joystick_index);
Value JS_SDL_GameControllerOpen(const CallbackInfo& info) {
    auto controller = SDL_GameControllerOpen(info[0].As<Number>().Int32Value());

    return External<SDL_GameController>::New(info.Env(), controller);
}

// extern DECLSPEC void SDLCALL SDL_GameControllerClose(SDL_GameController *gamecontroller);
void JS_SDL_GameControllerClose(const CallbackInfo& info) {
    auto controller = info[0].As<External<SDL_GameController>>().Data();

    SDL_GameControllerClose(controller);
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

// extern DECLSPEC SDL_Joystick *SDLCALL SDL_GameControllerGetJoystick(SDL_GameController *gamecontroller);
Value JS_SDL_GameControllerGetJoystick(const CallbackInfo& info) {
    auto controller = info[0].As<External<SDL_GameController>>().Data();
    auto joystick = SDL_GameControllerGetJoystick(controller);

    return joystick != nullptr ? External<SDL_Joystick>::New(info.Env(), joystick) : info.Env().Undefined();
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

// const char* SDL_GetPlatform(void)
Value JS_SDL_GetPlatform(const CallbackInfo& info) {
    auto platform = SDL_GetPlatform();

    return String::New(info.Env(), platform);
}

Value JS_SDL_GetVersion(const CallbackInfo& info) {
    SDL_version linked;

    SDL_GetVersion(&linked);

    auto version = Object::New(info.Env());

    version["major"] = linked.major;
    version["minor"] = linked.minor;
    version["patch"] = linked.patch;

    return version;
}

Object SDLBindingsInit(Env env, Object exports) {
    // XXX: Refactoring from old FFI code. These helper functions will be removed when the platform rendering
    //      classes are moved down to native.

    exports["SDL_Init"] = Function::New(env, JS_SDL_Init, "SDL_Init");
    exports["SDL_InitSubSystem"] = Function::New(env, JS_SDL_InitSubSystem, "SDL_InitSubSystem");
    exports["SDL_WasInit"] = Function::New(env, JS_SDL_WasInit, "SDL_WasInit");
    exports["SDL_Quit"] = Function::New(env, JS_SDL_Quit, "SDL_Quit");
    exports["SDL_GetError"] = Function::New(env, JS_SDL_GetError, "SDL_GetError");
    exports["SDL_GetRenderDriverInfo"] = Function::New(env, JS_SDL_GetRenderDriverInfo, "SDL_GetRenderDriverInfo");
    exports["SDL_CreateRenderer"] = Function::New(env, JS_SDL_CreateRenderer, "SDL_CreateRenderer");
    exports["SDL_DestroyRenderer"] = Function::New(env, JS_SDL_DestroyRenderer, "SDL_DestroyRenderer");
    exports["SDL_DestroyTexture"] = Function::New(env, JS_SDL_DestroyTexture, "SDL_DestroyTexture");
    exports["SDL_RenderPresent"] = Function::New(env, JS_SDL_RenderPresent, "SDL_RenderPresent");
    exports["SDL_RenderFillRect"] = Function::New(env, JS_SDL_RenderFillRect, "SDL_RenderFillRect");
    exports["SDL_RenderFillRects"] = Function::New(env, JS_SDL_RenderFillRects, "SDL_RenderFillRects");
    exports["SDL_RenderCopy"] = Function::New(env, JS_SDL_RenderCopy, "SDL_RenderCopy");
    exports["SDL_RenderClear"] = Function::New(env, JS_SDL_RenderClear, "SDL_RenderClear");
    exports["SDL_RenderSetClipRect"] = Function::New(env, JS_SDL_RenderSetClipRect, "SDL_RenderSetClipRect");
    exports["SDL_RenderSetLogicalSize"] = Function::New(env, JS_SDL_RenderSetLogicalSize, "SDL_RenderSetLogicalSize");
    exports["SDL_SetRenderTarget"] = Function::New(env, JS_SDL_SetRenderTarget, "SDL_SetRenderTarget");
    exports["SDL_GetRendererOutputSize"] = Function::New(env, JS_SDL_GetRendererOutputSize, "SDL_GetRendererOutputSize");
    exports["SDL_CreateTexture"] = Function::New(env, JS_SDL_CreateTexture, "SDL_CreateTexture");
    exports["SDL_GetWindowPixelFormat"] = Function::New(env, JS_SDL_GetWindowPixelFormat, "SDL_GetWindowPixelFormat");
    exports["SDL_UnlockTexture"] = Function::New(env, JS_SDL_UnlockTexture, "SDL_UnlockTexture");
    exports["SDL_GetNumDisplayModes"] = Function::New(env, JS_SDL_GetNumDisplayModes, "SDL_GetNumDisplayModes");
    exports["SDL_GetWindowTitle"] = Function::New(env, JS_SDL_GetWindowTitle, "SDL_GetWindowTitle");
    exports["SDL_SetWindowTitle"] = Function::New(env, JS_SDL_SetWindowTitle, "SDL_SetWindowTitle");
    exports["SDL_CreateWindow"] = Function::New(env, JS_SDL_CreateWindow, "SDL_CreateWindow");
    exports["SDL_DestroyWindow"] = Function::New(env, JS_SDL_DestroyWindow, "SDL_DestroyWindow");
    exports["SDL_SetTextureColorMod"] = Function::New(env, JS_SDL_SetTextureColorMod, "SDL_SetTextureColorMod");
    exports["SDL_SetTextureAlphaMod"] = Function::New(env, JS_SDL_SetTextureAlphaMod, "SDL_SetTextureAlphaMod");
    exports["SDL_SetRenderDrawColor"] = Function::New(env, JS_SDL_SetRenderDrawColor, "SDL_SetRenderDrawColor");
    exports["SDL_SetTextureBlendMode"] = Function::New(env, JS_SDL_SetTextureBlendMode, "SDL_SetTextureBlendMode");
    exports["SDL_SetRenderDrawBlendMode"] = Function::New(env, JS_SDL_SetRenderDrawBlendMode, "SDL_SetRenderDrawBlendMode");
    exports["SDL_GetDisplayMode"] = Function::New(env, JS_SDL_GetDisplayMode, "SDL_GetDisplayMode");
    exports["SDL_GetDesktopDisplayMode"] = Function::New(env, JS_SDL_GetDesktopDisplayMode, "SDL_GetDesktopDisplayMode");
    exports["SDL_GetCurrentDisplayMode"] = Function::New(env, JS_SDL_GetCurrentDisplayMode, "SDL_GetCurrentDisplayMode");
    exports["SDL_RenderGetIntegerScale"] = Function::New(env, JS_SDL_RenderGetIntegerScale, "SDL_RenderGetIntegerScale");
    exports["SDL_LockTexture"] = Function::New(env, JS_SDL_LockTexture, "SDL_LockTexture");
    exports["SDL_GetPixelFormatName"] = Function::New(env, JS_SDL_GetPixelFormatName, "SDL_GetPixelFormatName");
    exports["SDL_ShowCursor"] = Function::New(env, JS_SDL_ShowCursor, "SDL_ShowCursor");
    exports["SDL_PumpEvents"] = Function::New(env, JS_SDL_PumpEvents, "SDL_PumpEvents");
    exports["SDL_PeepEvents"] = Function::New(env, JS_SDL_PeepEvents, "SDL_PeepEvents");
    exports["SDL_OpenAudio"] = Function::New(env, JS_SDL_OpenAudio, "SDL_OpenAudio");
    exports["SDL_PauseAudio"] = Function::New(env, JS_SDL_PauseAudio, "SDL_PauseAudio");
    exports["SDL_ClearQueuedAudio"] = Function::New(env, JS_SDL_ClearQueuedAudio, "SDL_ClearQueuedAudio");
    exports["SDL_QueueAudio"] = Function::New(env, JS_SDL_QueueAudio, "SDL_QueueAudio");
    exports["SDL_CloseAudio"] = Function::New(env, JS_SDL_CloseAudio, "SDL_CloseAudio");

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

    exports["SDL_GameControllerOpen"] = Function::New(env, JS_SDL_GameControllerOpen, "SDL_GameControllerOpen");
    exports["SDL_GameControllerClose"] = Function::New(env, JS_SDL_GameControllerClose, "SDL_GameControllerClose");
    exports["SDL_IsGameController"] = Function::New(env, JS_SDL_IsGameController, "SDL_IsGameController");
    exports["SDL_GameControllerAddMappingsFromFile"] = Function::New(env, JS_SDL_GameControllerAddMappingsFromFile, "SDL_GameControllerAddMappingsFromFile");
    exports["SDL_JoystickGetDeviceVendor"] = Function::New(env, JS_SDL_JoystickGetDeviceVendor, "SDL_JoystickGetDeviceVendor");
    exports["SDL_JoystickGetDeviceProduct"] = Function::New(env, JS_SDL_JoystickGetDeviceProduct, "SDL_JoystickGetDeviceProduct");
    exports["SDL_JoystickGetDeviceProductVersion"] = Function::New(env, JS_SDL_JoystickGetDeviceProductVersion, "SDL_JoystickGetDeviceProductVersion");
    exports["SDL_JoystickGetDeviceInstanceID"] = Function::New(env, JS_SDL_JoystickGetDeviceInstanceID, "SDL_JoystickGetDeviceInstanceID");
    exports["SDL_GameControllerGetJoystick"] = Function::New(env, JS_SDL_GameControllerGetJoystick, "SDL_GameControllerGetJoystick");
    exports["SDL_GameControllerAddMapping"] = Function::New(env, JS_SDL_GameControllerAddMapping, "SDL_GameControllerAddMapping");
    exports["SDL_GetPlatform"] = Function::New(env, JS_SDL_GetPlatform, "SDL_GetPlatform");
    exports["SDL_GetVersion"] = Function::New(env, JS_SDL_GetVersion, "SDL_GetVersion");

    exports["SDL_LoadWAV"] = Function::New(env, JS_SDL_LoadWAV, "SDL_LoadWAV");
    exports["SDL_FreeWAV"] = Function::New(env, JS_SDL_FreeWAV, "SDL_FreeWAV");

    SDL_version linked;
    char str[32];
    
    SDL_GetVersion(&linked);
    sprintf(str, "%i.%i.%i", linked.major, linked.minor, linked.patch);

    exports["version"] = String::New(env, std::string(str));
    
    exports["SDL_INIT_TIMER"] = Number::New(env, SDL_INIT_TIMER);
    exports["SDL_INIT_AUDIO"] = Number::New(env, SDL_INIT_AUDIO);
    exports["SDL_INIT_VIDEO"] = Number::New(env, SDL_INIT_VIDEO);
    exports["SDL_INIT_JOYSTICK"] = Number::New(env, SDL_INIT_JOYSTICK);
    exports["SDL_INIT_HAPTIC"] = Number::New(env, SDL_INIT_HAPTIC);
    exports["SDL_INIT_GAMECONTROLLER"] = Number::New(env, SDL_INIT_GAMECONTROLLER);
    exports["SDL_INIT_EVENTS"] = Number::New(env, SDL_INIT_EVENTS);
    exports["SDL_INIT_NOPARACHUTE"] = Number::New(env, SDL_INIT_NOPARACHUTE);
    exports["SDL_INIT_EVERYTHING"] = Number::New(env, SDL_INIT_EVERYTHING);

    exports["SDL_WINDOWPOS_UNDEFINED"] = Number::New(env, SDL_INIT_EVERYTHING);
    exports["SDL_WINDOWPOS_CENTERED"] = Number::New(env, SDL_INIT_EVERYTHING);

    auto windowFlags = Object::New(env);
    
    exports["SDL_WindowFlags"] = windowFlags;
    
    windowFlags["SDL_WINDOW_FULLSCREEN"] = Number::New(env, SDL_WINDOW_FULLSCREEN);
    windowFlags["SDL_WINDOW_OPENGL"] = Number::New(env, SDL_WINDOW_OPENGL);
    windowFlags["SDL_WINDOW_SHOWN"] = Number::New(env, SDL_WINDOW_SHOWN);
    windowFlags["SDL_WINDOW_HIDDEN"] = Number::New(env, SDL_WINDOW_HIDDEN);
    windowFlags["SDL_WINDOW_BORDERLESS"] = Number::New(env, SDL_WINDOW_BORDERLESS);
    windowFlags["SDL_WINDOW_RESIZABLE"] = Number::New(env, SDL_WINDOW_RESIZABLE);
    windowFlags["SDL_WINDOW_MINIMIZED"] = Number::New(env, SDL_WINDOW_MINIMIZED);
    windowFlags["SDL_WINDOW_MAXIMIZED"] = Number::New(env, SDL_WINDOW_MAXIMIZED);
    windowFlags["SDL_WINDOW_INPUT_GRABBED"] = Number::New(env, SDL_WINDOW_INPUT_GRABBED);
    windowFlags["SDL_WINDOW_INPUT_FOCUS"] = Number::New(env, SDL_WINDOW_INPUT_FOCUS);
    windowFlags["SDL_WINDOW_MOUSE_FOCUS"] = Number::New(env, SDL_WINDOW_MOUSE_FOCUS);
    windowFlags["SDL_WINDOW_FULLSCREEN_DESKTOP"] = Number::New(env, SDL_WINDOW_FULLSCREEN_DESKTOP);
    windowFlags["SDL_WINDOW_FOREIGN"] = Number::New(env, SDL_WINDOW_FOREIGN);
    windowFlags["SDL_WINDOW_ALLOW_HIGHDPI"] = Number::New(env, SDL_WINDOW_ALLOW_HIGHDPI);
    windowFlags["SDL_WINDOW_MOUSE_CAPTURE"] = Number::New(env, SDL_WINDOW_MOUSE_CAPTURE);

    auto event = Object::New(env);
    
    event["size"] = sizeof(SDL_Event);
    exports["SDL_Event"] = event;

    auto textureAccess = Object::New(env);
        
    exports["SDL_TextureAccess"] = textureAccess;
    
    textureAccess["SDL_TEXTUREACCESS_STATIC"] = Number::New(env, SDL_TEXTUREACCESS_STATIC);
    textureAccess["SDL_TEXTUREACCESS_STREAMING"] = Number::New(env, SDL_TEXTUREACCESS_STREAMING);
    textureAccess["SDL_TEXTUREACCESS_TARGET"] = Number::New(env, SDL_TEXTUREACCESS_TARGET);

    auto renderFlags = Object::New(env);
        
    exports["SDL_RendererFlags"] = renderFlags;

    renderFlags["SDL_RENDERER_SOFTWARE"] = Number::New(env, SDL_RENDERER_SOFTWARE);
    renderFlags["SDL_RENDERER_ACCELERATED"] = Number::New(env, SDL_RENDERER_ACCELERATED);
    renderFlags["SDL_RENDERER_PRESENTVSYNC"] = Number::New(env, SDL_RENDERER_PRESENTVSYNC);
    renderFlags["SDL_RENDERER_TARGETTEXTURE"] = Number::New(env, SDL_RENDERER_TARGETTEXTURE);

    auto blendMode = Object::New(env);
        
    exports["SDL_BlendMode"] = blendMode;

    blendMode["SDL_BLENDMODE_NONE"] = Number::New(env, SDL_BLENDMODE_NONE);
    blendMode["SDL_BLENDMODE_BLEND"] = Number::New(env, SDL_BLENDMODE_BLEND);
    blendMode["SDL_BLENDMODE_ADD"] = Number::New(env, SDL_BLENDMODE_ADD);
    blendMode["SDL_BLENDMODE_MOD"] = Number::New(env, SDL_BLENDMODE_MOD);

    exports["SDL_PIXELTYPE_UNKNOWN"] = Number::New(env, SDL_PIXELTYPE_UNKNOWN);
    exports["SDL_PIXELTYPE_INDEX1"] = Number::New(env, SDL_PIXELTYPE_INDEX1);
    exports["SDL_PIXELTYPE_INDEX4"] = Number::New(env, SDL_PIXELTYPE_INDEX4);
    exports["SDL_PIXELTYPE_INDEX8"] = Number::New(env, SDL_PIXELTYPE_INDEX8);
    exports["SDL_PIXELTYPE_PACKED8"] = Number::New(env, SDL_PIXELTYPE_PACKED8);
    exports["SDL_PIXELTYPE_PACKED16"] = Number::New(env, SDL_PIXELTYPE_PACKED16);
    exports["SDL_PIXELTYPE_PACKED32"] = Number::New(env, SDL_PIXELTYPE_PACKED32);
    exports["SDL_PIXELTYPE_ARRAYU8"] = Number::New(env, SDL_PIXELTYPE_ARRAYU8);
    exports["SDL_PIXELTYPE_ARRAYU16"] = Number::New(env, SDL_PIXELTYPE_ARRAYU16);
    exports["SDL_PIXELTYPE_ARRAYU32"] = Number::New(env, SDL_PIXELTYPE_ARRAYU32);
    exports["SDL_PIXELTYPE_ARRAYF16"] = Number::New(env, SDL_PIXELTYPE_ARRAYF16);
    exports["SDL_PIXELTYPE_ARRAYF32"] = Number::New(env, SDL_PIXELTYPE_ARRAYF32);
    
    exports["SDL_BITMAPORDER_NONE"] = Number::New(env, SDL_BITMAPORDER_NONE);
    exports["SDL_BITMAPORDER_4321"] = Number::New(env, SDL_BITMAPORDER_4321);
    exports["SDL_BITMAPORDER_1234"] = Number::New(env, SDL_BITMAPORDER_1234);
    
    exports["SDL_BITMAPORDER_NONE"] = Number::New(env, SDL_BITMAPORDER_NONE);
    exports["SDL_BITMAPORDER_4321"] = Number::New(env, SDL_BITMAPORDER_4321);
    exports["SDL_BITMAPORDER_1234"] = Number::New(env, SDL_BITMAPORDER_1234);
    
    exports["SDL_PACKEDORDER_NONE"] = Number::New(env, SDL_PACKEDORDER_NONE);
    exports["SDL_PACKEDORDER_XRGB"] = Number::New(env, SDL_PACKEDORDER_XRGB);
    exports["SDL_PACKEDORDER_RGBX"] = Number::New(env, SDL_PACKEDORDER_RGBX);
    exports["SDL_PACKEDORDER_ARGB"] = Number::New(env, SDL_PACKEDORDER_ARGB);
    exports["SDL_PACKEDORDER_RGBA"] = Number::New(env, SDL_PACKEDORDER_RGBA);
    exports["SDL_PACKEDORDER_XBGR"] = Number::New(env, SDL_PACKEDORDER_XBGR);
    exports["SDL_PACKEDORDER_BGRX"] = Number::New(env, SDL_PACKEDORDER_BGRX);
    exports["SDL_PACKEDORDER_ABGR"] = Number::New(env, SDL_PACKEDORDER_ABGR);
    exports["SDL_PACKEDORDER_BGRA"] = Number::New(env, SDL_PACKEDORDER_BGRA);
    
    exports["SDL_ARRAYORDER_NONE"] = Number::New(env, SDL_ARRAYORDER_NONE);
    exports["SDL_ARRAYORDER_RGB"] = Number::New(env, SDL_ARRAYORDER_RGB);
    exports["SDL_ARRAYORDER_RGBA"] = Number::New(env, SDL_ARRAYORDER_RGBA);
    exports["SDL_ARRAYORDER_ARGB"] = Number::New(env, SDL_ARRAYORDER_ARGB);
    exports["SDL_ARRAYORDER_BGR"] = Number::New(env, SDL_ARRAYORDER_BGR);
    exports["SDL_ARRAYORDER_BGRA"] = Number::New(env, SDL_ARRAYORDER_BGRA);
    exports["SDL_ARRAYORDER_ABGR"] = Number::New(env, SDL_ARRAYORDER_ABGR);
    
    exports["SDL_PACKEDLAYOUT_NONE"] = Number::New(env, SDL_PACKEDLAYOUT_NONE);
    exports["SDL_PACKEDLAYOUT_332"] = Number::New(env, SDL_PACKEDLAYOUT_332);
    exports["SDL_PACKEDLAYOUT_4444"] = Number::New(env, SDL_PACKEDLAYOUT_4444);
    exports["SDL_PACKEDLAYOUT_1555"] = Number::New(env, SDL_PACKEDLAYOUT_1555);
    exports["SDL_PACKEDLAYOUT_5551"] = Number::New(env, SDL_PACKEDLAYOUT_5551);
    exports["SDL_PACKEDLAYOUT_565"] = Number::New(env, SDL_PACKEDLAYOUT_565);
    exports["SDL_PACKEDLAYOUT_8888"] = Number::New(env, SDL_PACKEDLAYOUT_8888);
    exports["SDL_PACKEDLAYOUT_2101010"] = Number::New(env, SDL_PACKEDLAYOUT_2101010);
    exports["SDL_PACKEDLAYOUT_1010102"] = Number::New(env, SDL_PACKEDLAYOUT_1010102);
    
    exports["SDL_PIXELFORMAT_UNKNOWN"] = Number::New(env, SDL_PIXELFORMAT_UNKNOWN);
    exports["SDL_PIXELFORMAT_INDEX1LSB"] = Number::New(env, SDL_PIXELFORMAT_INDEX1LSB);
    exports["SDL_PIXELFORMAT_INDEX1MSB"] = Number::New(env, SDL_PIXELFORMAT_INDEX1MSB);
    exports["SDL_PIXELFORMAT_INDEX4LSB"] = Number::New(env, SDL_PIXELFORMAT_INDEX4LSB);
    exports["SDL_PIXELFORMAT_INDEX4MSB"] = Number::New(env, SDL_PIXELFORMAT_INDEX4MSB);
    exports["SDL_PIXELFORMAT_INDEX8"] = Number::New(env, SDL_PIXELFORMAT_INDEX8);
    exports["SDL_PIXELFORMAT_RGB332"] = Number::New(env, SDL_PIXELFORMAT_RGB332);
    exports["SDL_PIXELFORMAT_RGB444"] = Number::New(env, SDL_PIXELFORMAT_RGB444);
    exports["SDL_PIXELFORMAT_RGB555"] = Number::New(env, SDL_PIXELFORMAT_RGB555);
    exports["SDL_PIXELFORMAT_BGR555"] = Number::New(env, SDL_PIXELFORMAT_BGR555);
    exports["SDL_PIXELFORMAT_ARGB4444"] = Number::New(env, SDL_PIXELFORMAT_ARGB4444);
    exports["SDL_PIXELFORMAT_RGBA4444"] = Number::New(env, SDL_PIXELFORMAT_RGBA4444);
    exports["SDL_PIXELFORMAT_ABGR4444"] = Number::New(env, SDL_PIXELFORMAT_ABGR4444);
    exports["SDL_PIXELFORMAT_BGRA4444"] = Number::New(env, SDL_PIXELFORMAT_BGRA4444);
    exports["SDL_PIXELFORMAT_ARGB1555"] = Number::New(env, SDL_PIXELFORMAT_ARGB1555);
    exports["SDL_PIXELFORMAT_RGBA5551"] = Number::New(env, SDL_PIXELFORMAT_RGBA5551);
    exports["SDL_PIXELFORMAT_ABGR1555"] = Number::New(env, SDL_PIXELFORMAT_ABGR1555);
    exports["SDL_PIXELFORMAT_BGRA5551"] = Number::New(env, SDL_PIXELFORMAT_BGRA5551);
    exports["SDL_PIXELFORMAT_RGB565"] = Number::New(env, SDL_PIXELFORMAT_RGB565);
    exports["SDL_PIXELFORMAT_BGR565"] = Number::New(env, SDL_PIXELFORMAT_BGR565);
    exports["SDL_PIXELFORMAT_RGB24"] = Number::New(env, SDL_PIXELFORMAT_RGB24);
    exports["SDL_PIXELFORMAT_BGR24"] = Number::New(env, SDL_PIXELFORMAT_BGR24);
    exports["SDL_PIXELFORMAT_RGB888"] = Number::New(env, SDL_PIXELFORMAT_RGB888);
    exports["SDL_PIXELFORMAT_RGBX8888"] = Number::New(env, SDL_PIXELFORMAT_RGBX8888);
    exports["SDL_PIXELFORMAT_BGR888"] = Number::New(env, SDL_PIXELFORMAT_BGR888);
    exports["SDL_PIXELFORMAT_BGRX8888"] = Number::New(env, SDL_PIXELFORMAT_BGRX8888);
    exports["SDL_PIXELFORMAT_ARGB8888"] = Number::New(env, SDL_PIXELFORMAT_ARGB8888);
    exports["SDL_PIXELFORMAT_RGBA8888"] = Number::New(env, SDL_PIXELFORMAT_RGBA8888);
    exports["SDL_PIXELFORMAT_ABGR8888"] = Number::New(env, SDL_PIXELFORMAT_ABGR8888);
    exports["SDL_PIXELFORMAT_BGRA8888"] = Number::New(env, SDL_PIXELFORMAT_BGRA8888);
    exports["SDL_PIXELFORMAT_ARGB2101010"] = Number::New(env, SDL_PIXELFORMAT_ARGB2101010);
    
    exports["SDL_PIXELFORMAT_YV12"] = Number::New(env, SDL_PIXELFORMAT_YV12);
    exports["SDL_PIXELFORMAT_IYUV"] = Number::New(env, SDL_PIXELFORMAT_IYUV);
    exports["SDL_PIXELFORMAT_YUY2"] = Number::New(env, SDL_PIXELFORMAT_YUY2);
    exports["SDL_PIXELFORMAT_UYVY"] = Number::New(env, SDL_PIXELFORMAT_UYVY);
    exports["SDL_PIXELFORMAT_YVYU"] = Number::New(env, SDL_PIXELFORMAT_YVYU);
    exports["SDL_PIXELFORMAT_NV12"] = Number::New(env, SDL_PIXELFORMAT_NV12);
    exports["SDL_PIXELFORMAT_NV21"] = Number::New(env, SDL_PIXELFORMAT_NV21);
    exports["SDL_PIXELFORMAT_EXTERNAL_OES"] = Number::New(env, SDL_PIXELFORMAT_EXTERNAL_OES);

    if (IsBigEndian()) {
        exports["SDL_PIXELFORMAT_RGBA32"] = Number::New(env, SDL_PIXELFORMAT_RGBA8888);
        exports["SDL_PIXELFORMAT_ARGB32"] = Number::New(env, SDL_PIXELFORMAT_ARGB8888);
        exports["SDL_PIXELFORMAT_BGRA32"] = Number::New(env, SDL_PIXELFORMAT_BGRA8888);
        exports["SDL_PIXELFORMAT_ABGR32"] = Number::New(env, SDL_PIXELFORMAT_ABGR8888);
    } else {
        exports["SDL_PIXELFORMAT_RGBA32"] = Number::New(env, SDL_PIXELFORMAT_ABGR8888);
        exports["SDL_PIXELFORMAT_ARGB32"] = Number::New(env, SDL_PIXELFORMAT_BGRA8888);
        exports["SDL_PIXELFORMAT_BGRA32"] = Number::New(env, SDL_PIXELFORMAT_ARGB8888);
        exports["SDL_PIXELFORMAT_ABGR32"] = Number::New(env, SDL_PIXELFORMAT_RGBA8888);
    }

    return exports;
}