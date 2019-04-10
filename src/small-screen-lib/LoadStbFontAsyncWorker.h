/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <napi.h>
#include <vector>
#include <memory>

class LoadStbFontAsyncWorker : public Napi::AsyncWorker {
public:
    LoadStbFontAsyncWorker(Napi::Env env, const std::string filename);
    virtual ~LoadStbFontAsyncWorker() {}

    Napi::Value Promise();

protected:
    virtual void Execute();
    virtual void OnOK();
    virtual void OnError(const Napi::Error& e);

private:
    Napi::Promise::Deferred promise;
    std::string filename;
    int32_t count;
    std::shared_ptr<uint8_t> ttf;
};
