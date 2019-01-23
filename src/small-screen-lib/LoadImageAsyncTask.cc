/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "LoadImageAsyncTask.h"
#include <napi-thread-safe-callback.hpp>
#include <vector>
#include <iostream>
#include <cstdio>
#include <cstring>
#include <cmath>
#include <cstdlib>
#include <exception>
#include <nanosvg.h>
#include <nanosvgrast.h>
#include <stb_image.h>
#include "Util.h"

using namespace Napi;

#define NUM_IMAGE_COMPONENTS 4

void ToFormatLE(unsigned char *bytes, int len, TextureFormat format);
void ToFormatBE(unsigned char *bytes, int len, TextureFormat format);

inline float ScaleFactor(const int source, const int dest) {
    return 1.f + ((dest - source) / (float)source);
}

LoadImageAsyncTask::LoadImageAsyncTask(std::shared_ptr<ThreadSafeCallback> callback,
            Value source,
            const std::string &sourceType,
            int desiredWidth,
            int desiredHeight,
            TextureFormat desiredFormat)
     : callback(callback),
       data(nullptr),
       dataSize(0),
       source(),
       sourceData(nullptr),
       sourceDataSize(0),
       sourceType(sourceType),
       desiredWidth(desiredWidth),
       desiredHeight(desiredHeight),
       desiredFormat(desiredFormat) {

    if (source.IsBuffer()) {
        auto buffer = source.As<Buffer<unsigned char>>();

        sourceData = buffer.Data();
        sourceDataSize = buffer.Length();

        this->ref = Persistent(source);
    } else {
        this->source = source.As<String>().Utf8Value();
    }
}

void LoadImageAsyncTask::Run() {
    if (this->sourceType == "utf8") {
        // note: nanosvg modifies the char buffer during parsing.
        this->LoadSvgImage(const_cast<char *>(this->source.c_str()), this->source.size());
    } else {
        try {
            this->LoadRasterImage(this->sourceData, this->sourceDataSize);
        } catch (std::exception e) {
            this->LoadSvgImage(reinterpret_cast<char *>(this->sourceData), this->sourceDataSize);
        }
    }

    if (IsBigEndian()) {
       ToFormatBE(this->data, this->dataSize, this->desiredFormat);
    } else {
       ToFormatLE(this->data, this->dataSize, this->desiredFormat);
    }
}

void LoadImageAsyncTask::Dispatch() {
    auto data = this->data;
    auto dataSize = this->dataSize;
    auto width = this->width;
    auto height = this->height;

    callback->call<bool>([data, dataSize, width, height](Napi::Env env, std::vector<napi_value>& args) {
        if (data != nullptr) {
            args.push_back(env.Undefined());
            // TODO: free happens in release()
            args.push_back(Buffer<unsigned char>::New(env, data, dataSize));
            args.push_back(Number::New(env, width));
            args.push_back(Number::New(env, height));
        } else {
            std::cerr << "Image data is null!" << std::endl;
        }
    }, [](const Value& val) -> bool {
        return val.As<Boolean>().Value();
    });
}

void LoadImageAsyncTask::DispatchError(const std::string& message) {
    callback->call<bool>([message](Napi::Env env, std::vector<napi_value>& args) {
        args.push_back(Error::New(env, message).Value());
    }, [](const Value& val) -> bool {
        return val.As<Boolean>().Value();
    });
}

void LoadImageAsyncTask::LoadRasterImage(unsigned char *chunk, int chunkLen) {
    int components;

    if (chunk != nullptr) {
        this->data = stbi_load_from_memory(
            chunk,
            chunkLen,
            &this->width,
            &this->height,
            &components,
            NUM_IMAGE_COMPONENTS
        );

    } else {
        this->data = stbi_load(
            this->source.c_str(),
            &this->width,
            &this->height,
            &components,
            NUM_IMAGE_COMPONENTS
        );
    }

    if (this->data == nullptr) {
        throw std::runtime_error("stbi_load failed.");
    }

    this->dataSize = this->width * this->height * NUM_IMAGE_COMPONENTS;
}

void LoadImageAsyncTask::LoadSvgImage(char *chunk, int chunkLen) {
    NSVGimage* svg;

    if (chunk != nullptr) {
        svg = nsvgParse(chunk, "px", 96);
    } else {
        svg = nsvgParseFromFile(this->source.c_str(), "px", 96);
    }

    if (svg == nullptr) {
        throw std::runtime_error("Failed to parse SVG.");
    }

    if ((svg->width == 0 || svg->height == 0) && (desiredWidth == 0 && desiredHeight == 0)) {
        nsvgDelete(svg);
        throw std::runtime_error("SVG contains no dimensions.");
    }

    float scaleX;
    float scaleY;

    if (desiredWidth > 0 && desiredHeight > 0) {
        this->width = desiredWidth;
        this->height = desiredHeight;
        scaleX = ScaleFactor(svg->width, desiredWidth);
        scaleY = ScaleFactor(svg->height, desiredHeight);
    } else {
        this->width = svg->width;
        this->height = svg->height;
        scaleX = 1.0f;
        scaleY = 1.0f;
    }

    this->dataSize = width * height * NUM_IMAGE_COMPONENTS;
    this->data = (unsigned char *)malloc(this->dataSize);

    if (this->data == nullptr) {
        nsvgDelete(svg);
        throw std::runtime_error("Failed to allocate surface memory for SVG image.");
    }

    auto rasterizer = nsvgCreateRasterizer();

    if (rasterizer == nullptr) {
        free(this->data);
        this->data = nullptr;
        nsvgDelete(svg);
        throw std::runtime_error("Failed to create rasterizer SVG image.");
    }

    nsvgRasterizeFull(rasterizer,
                      svg,
                      0,
                      0,
                      scaleX,
                      scaleY,
                      this->data,
                      this->width,
                      this->height,
                      this->width * NUM_IMAGE_COMPONENTS);

    nsvgDeleteRasterizer(rasterizer);
    nsvgDelete(svg);
}

inline void swap(unsigned char *bytes, int a, int b) {
    unsigned char t = bytes[a];

    bytes[a] = bytes[b];
    bytes[b] = t;
}

#define R 0
#define G 1
#define B 2
#define A 3

void ToFormatLE(unsigned char *bytes, int len, TextureFormat format) {
    auto i = 0;
    unsigned char r, g, b, a;

    switch(format) {
        case TEXTURE_FORMAT_ARGB:
            while (i < len) {
                swap(bytes, i + R, i + B);
                i += NUM_IMAGE_COMPONENTS;
            }
            break;
        case TEXTURE_FORMAT_BGRA:
            while (i < len) {
                r = bytes[i + R];
                g = bytes[i + G];
                b = bytes[i + B];
                a = bytes[i + A];

                bytes[i    ] = a;
                bytes[i + 1] = r;
                bytes[i + 2] = g;
                bytes[i + 3] = b;

                i += NUM_IMAGE_COMPONENTS;
            }
            break;
        case TEXTURE_FORMAT_RGBA:
            while (i < len) {
                swap(bytes, i + R, i + A);
                swap(bytes, i + G, i + B);

                i += NUM_IMAGE_COMPONENTS;
            }
            break;
        default:
            // TEXTURE_FORMAT_ABGR - no op in LE
            break;
    }

}

void ToFormatBE(unsigned char *bytes, int len, TextureFormat format) {
    auto i = 0;
    unsigned char r, g, b, a;

    switch(format) {
        case TEXTURE_FORMAT_ABGR:
            while (i < len) {
                swap(bytes, i + A, i + R);
                swap(bytes, i + G, i + B);
                i += NUM_IMAGE_COMPONENTS;
            }
            break;
        case TEXTURE_FORMAT_ARGB:
            while (i < len) {
                r = bytes[i + R];
                g = bytes[i + G];
                b = bytes[i + B];
                a = bytes[i + A];

                bytes[i    ] = a;
                bytes[i + 1] = r;
                bytes[i + 2] = g;
                bytes[i + 3] = b;

                i += NUM_IMAGE_COMPONENTS;
            }
            break;
        case TEXTURE_FORMAT_BGRA:
            while (i < len) {
                swap(bytes, i + R, i + B);
                i += NUM_IMAGE_COMPONENTS;
            }
            break;
        case TEXTURE_FORMAT_RGBA:
        default:
            // TEXTURE_FORMAT_RGBA - noop in BE
            break;
    }
}
