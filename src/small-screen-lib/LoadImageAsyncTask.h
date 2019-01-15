/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef LOADIMAGEASYNCTASK_H
#define LOADIMAGEASYNCTASK_H

#include "AsyncTask.h"
#include <napi-thread-safe-callback.hpp>
#include <string>

#define FORMAT_RGBA 0
#define FORMAT_ARGB 1
#define FORMAT_ABGR 2
#define FORMAT_BGRA 3
#define FORMAT_MIN 1
#define FORMAT_MAX 3

enum SourceType {
    XML,
    BASE64,
    FILENAME,
};

// Loads images (SVG, PNG, JPG, GIF, BMP) from file, SVG XML or Base64 string.
class LoadImageAsyncTask : public AsyncTask {
public:
    LoadImageAsyncTask(std::shared_ptr<ThreadSafeCallback> callback,
                const std::string& source,
                unsigned char *sourceData,
                int sourceDataSize,
                SourceType sourceType,
                int desiredWidth,
                int desiredHeight,
                int desiredFormat);

    bool Run();
    void Dispatch();
    void DispatchError(const std::string& message);

private:
    std::shared_ptr<ThreadSafeCallback> callback;
    unsigned char *data;
    int dataSize;
    std::string source;
    unsigned char *sourceData;
    int sourceDataSize;
    std::string error;
    SourceType sourceType;
    int width;
    int height;
    int desiredWidth;
    int desiredHeight;
    int desiredFormat;

    bool LoadImage(unsigned char *chunk, int chunkLen);
    bool LoadSvg(char *chunk, int chunkLen);
    std::string GetSourceString();
};

#endif