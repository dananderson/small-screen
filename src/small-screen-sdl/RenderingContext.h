#ifndef SDLRENDERINGCONTEXT_H
#define SDLRENDERINGCONTEXT_H

#include "napi.h"

class SDLRenderingContext : public Napi::ObjectWrap<SDLRenderingContext> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  JSTextRenderer(const Napi::CallbackInfo& info);

 private:
  static Napi::FunctionReference constructor;

  Napi::Value Method(const Napi::CallbackInfo& info);
};

#endif
