/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef FONTSTORE_H
#define FONTSTORE_H

#include "napi.h"
#include <vector>

class Font;

class FontStore : public Napi::ObjectWrap<FontStore> {
public:

    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    FontStore(const Napi::CallbackInfo& info);

    Napi::Value InstallFont(const Napi::CallbackInfo& info);
    Napi::Value CreateFontSample(const Napi::CallbackInfo& info);

private:

    static Napi::FunctionReference constructor;
    std::vector<Font *> fonts;
};

#endif
