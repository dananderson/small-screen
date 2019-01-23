/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef LOADIMAGEASYNCTASK_H
#define LOADIMAGEASYNCTASK_H

#include "AsyncTask.h"
#include "TextureFormat.h"
#include "napi.h"
#include <napi-thread-safe-callback.hpp>
#include <string>

class LoadImageAsyncTask : public AsyncTask {
public:
    LoadImageAsyncTask(std::shared_ptr<ThreadSafeCallback> callback,
                Napi::Value source,
                const std::string &sourceType,
                int desiredWidth,
                int desiredHeight,
                TextureFormat desiredFormat);

    void Run();
    void Dispatch();
    void DispatchError(const std::string& message);

private:
    std::shared_ptr<ThreadSafeCallback> callback;
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
    Napi::Reference<Napi::Value> ref;

    void LoadRasterImage(unsigned char *chunk, int chunkLen);
    void LoadSvgImage(char *chunk, int chunkLen);
};

#endif