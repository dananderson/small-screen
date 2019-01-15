#include "SDLRenderingContext.h"

using namespace Napi;

FunctionReference SDLRenderingContext::constructor;

Object SDLRenderingContext::Init(Napi::Env env, Object exports) {
  HandleScope scope(env);

  Function func = DefineClass(env, "SDLRenderingContext", {
    InstanceMethod("method", &SDLRenderingContext::Method)
  });

  constructor = Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("SDLRenderingContext", func);
  
  return exports;
}

SDLRenderingContext::SDLRenderingContext(const CallbackInfo& info) : ObjectWrap<SDLRenderingContext>(info)  {

}

Value SDLRenderingContext::Method(const CallbackInfo& info) {
  return info.Env().Undefined();
}
