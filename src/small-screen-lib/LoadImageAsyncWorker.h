/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#pragma once

#include "TextureFormat.h"
#include "napi.h"
#include <string>

class LoadImageAsyncWorker : public Napi::AsyncWorker {
public:
    LoadImageAsyncWorker(const Napi::Function& callback,
                         const Napi::Value& source,
                         const std::string &sourceType,
                         int desiredWidth,
                         int desiredHeight,
                         TextureFormat desiredFormat,
                         bool basename);
    virtual ~LoadImageAsyncWorker() {}

protected:
    virtual void Execute();
    virtual void OnOK();
        
private:
    unsigned char *data;
    int dataSize;
    std::string source;
    unsigned char *sourceData;
    int sourceDataSize;
    std::string sourceType;
    int width;
    int height;
    int desiredWidth;
    int desiredHeight;
    TextureFormat desiredFormat;
    bool basename;
    Napi::Reference<Napi::Value> ref;

    void LoadRasterImage(unsigned char *chunk, int chunkLen);
    void LoadSvgImage(char *chunk, int chunkLen);
};
