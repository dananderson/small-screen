/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef FONTSTORE_H
#define FONTSTORE_H

#include "napi.h"

namespace FontStore {
    Napi::Object Init(Napi::Env env, Napi::Object exports);

    void Install(const Napi::CallbackInfo& info);
    void Uninstall(const Napi::CallbackInfo& info);
    Napi::Value Sample(const Napi::CallbackInfo& info);
};

#endif
