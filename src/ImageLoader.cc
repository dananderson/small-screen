/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "ImageLoader.h"
#include <napi-thread-safe-callback.hpp>
#include <blockingconcurrentqueue.h>
#include <vector>
#include <iostream>
#include <cstdio>
#include <cstring>
#include <cmath>
#include <cstdlib>

#define NANOSVG_ALL_COLOR_KEYWORDS
#define NANOSVG_IMPLEMENTATION
#include <nanosvg.h>

#define NANOSVGRAST_IMPLEMENTATION
#include <nanosvgrast.h>

#define STBI_NO_FAILURE_STRINGS
#define STBI_NO_PSD
#define STBI_NO_PIC
#define STBI_NO_PNM
#define STBI_NO_HDR
#define STBI_NO_TGA
#define STBI_NO_LINEAR
#define STB_IMAGE_IMPLEMENTATION
#include <stb_image.h>

#include <base64.h>

#include "Util.h"

using namespace Napi;

#define NUM_IMAGE_COMPONENTS 4

float ScaleFactor(const int source, const int dest);
void ToFormatLE(unsigned char *bytes, int len, int format);
void ToFormatBE(unsigned char *bytes, int len, int format);

ImageLoader::ImageLoader(std::shared_ptr<ThreadSafeCallback> callback,
            const std::string& source,
            SourceType sourceType,
            int desiredWidth,
            int desiredHeight,
            int desiredFormat)
 : callback(callback),
   data(nullptr),
   dataSize(0),
   source(source),
   sourceType(sourceType),
   desiredWidth(desiredWidth),
   desiredHeight(desiredHeight),
   desiredFormat(desiredFormat) {
   
}

bool ImageLoader::Load() {
    if (this->sourceType == XML) {
        // note: nanosvg modifies the char buffer during parsing.
        if (!this->LoadSvg(const_cast<char *>(this->source.c_str()), this->source.size())) {
            return false;
        }
    } else {
        std::shared_ptr<char> decoded;
        int len = 0;

        // moved decoding out of Load*() functions to share
        if (this->sourceType == BASE64) {
            len = Base64::DecodedLength(this->source);
            decoded.reset(new char[len + 1], std::default_delete<char[]>());

            if (decoded == nullptr) {
                this->error = std::string("Failed to allocate temporary buffer for Base64 decoding: ").append(this->GetSourceString());
                return false;
            }

            Base64::Decode(this->source.c_str(), this->source.size(), decoded.get(), len);
        }

        if (!this->LoadImage(decoded.get(), len) && !this->LoadSvg(decoded.get(), len)) {
            return false;
        }
    }

    // Convert to the desired format so after the graphics texture is created, we can just memcpy to the image to the texture.
    if (this->desiredFormat >= FORMAT_MIN && this->desiredFormat <= FORMAT_MAX) {
       if (IsBigEndian()) {
           ToFormatBE(this->data, this->dataSize, this->desiredFormat);
       } else {
           ToFormatLE(this->data, this->dataSize, this->desiredFormat);
       }
    }

    return true;
}

void ImageLoader::Dispatch() {
    auto data = this->data;
    auto dataSize = this->dataSize;
    auto width = this->width;
    auto height = this->height;
    auto error = this->error;

    callback->call<bool>([data, dataSize, width, height, error](Napi::Env env, std::vector<napi_value>& args) {
        if (data == nullptr) {
            args.push_back(Error::New(env, error).Value());
        } else {
            args.push_back(env.Undefined());
            args.push_back(Buffer<unsigned char>::New(env, data, dataSize));
            args.push_back(Number::New(env, width));
            args.push_back(Number::New(env, height));
        }
    }, [](const Value& val) -> bool {
        return val.As<Boolean>().Value();
    });
}

void ImageLoader::DispatchError(const std::string& message) {
    callback->call<bool>([message](Napi::Env env, std::vector<napi_value>& args) {
        args.push_back(Error::New(env, message).Value());
    }, [](const Value& val) -> bool {
        return val.As<Boolean>().Value();
    });
}

bool ImageLoader::LoadImage(char *chunk, int chunkLen) {
    int components;

    if (chunk != nullptr) {
        this->data = stbi_load_from_memory(
            reinterpret_cast<unsigned char *>(chunk),
            chunkLen,
            &this->width,
            &this->height,
            &components,
            NUM_IMAGE_COMPONENTS);

    } else {
        this->data = stbi_load(this->source.c_str(), &this->width, &this->height, &components, NUM_IMAGE_COMPONENTS);
    }

    if (this->data == nullptr) {
        this->error = std::string("Failed to load image: ").append(this->GetSourceString());
        return false;
    }

    this->dataSize = this->width * this->height * NUM_IMAGE_COMPONENTS;

    return true;
}

bool ImageLoader::LoadSvg(char *chunk, int chunkLen) {
    NSVGimage* svg;

    if (chunkLen != 0) {
        svg = nsvgParse(chunk, "px", 96);
    } else {
        svg = nsvgParseFromFile(this->source.c_str(), "px", 96);
    }

    if (svg == nullptr) {
        this->error = std::string("Failed to load image: ").append(this->GetSourceString());
        return false;
    }

    if ((svg->width == 0 || svg->height == 0) && (desiredWidth == 0 && desiredHeight == 0)) {
        this->error = std::string("SVG has no dimensions: ").append(this->GetSourceString());
        return false;
    }

    auto rast = nsvgCreateRasterizer();

    if (rast == nullptr) {
        this->error = "Failed to create SVG rasterizer.";
        return false;
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
        this->error = std::string("Failed to allocate surface memory for SVG image: ").append(this->GetSourceString());
        return false;
    }

    auto rasterizer = nsvgCreateRasterizer();

    if (rasterizer == nullptr) {
        free(this->data);
        this->data = nullptr;
        nsvgDelete(svg);
        this->error = std::string("Failed to create rasterizer SVG image: ").append(this->GetSourceString());
        return false;
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
    this->error.clear();

    return true;
}

std::string ImageLoader::GetSourceString() {
    auto len = this->source.size();
    auto prefix = std::string();

    if (sourceType == BASE64) {
        prefix = "base64://";
    } else if (sourceType == XML) {
        prefix = "xml://";
    } else {
        return this->source;
    }

    return prefix.append(len > 100 ? this->source.substr(0, 100).append("...") : this->source);
}

float ScaleFactor(const int source, const int dest) {
    return 1.f + (((float)dest - (float)source) / (float)source);
}

void ToFormatLE(unsigned char *bytes, int len, int format) {
    auto i = 0;
    unsigned char r, g, b, a;

    while (i < len) {
        r = bytes[i];
        g = bytes[i + 1];
        b = bytes[i + 2];
        a = bytes[i + 3];

        switch(format) {
            case FORMAT_ABGR:
                bytes[i    ] = r;
                bytes[i + 1] = g;
                bytes[i + 2] = b;
                bytes[i + 3] = a;
                break;
            case FORMAT_ARGB:
                bytes[i    ] = b;
                bytes[i + 1] = g;
                bytes[i + 2] = r;
                bytes[i + 3] = a;
                break;
            case FORMAT_BGRA:
                bytes[i    ] = a;
                bytes[i + 1] = r;
                bytes[i + 2] = g;
                bytes[i + 3] = b;
                break;
            case FORMAT_RGBA:
            default:
                bytes[i    ] = a;
                bytes[i + 1] = b;
                bytes[i + 2] = g;
                bytes[i + 3] = r;
                break;
        }

        i += NUM_IMAGE_COMPONENTS;
    }
}

void ToFormatBE(unsigned char *bytes, int len, int format) {
    auto i = 0;
    unsigned char r, g, b, a;

    while (i < len) {
        r = bytes[i];
        g = bytes[i + 1];
        b = bytes[i + 2];
        a = bytes[i + 3];

        switch(format) {
            case FORMAT_ABGR:
                bytes[i    ] = a;
                bytes[i + 1] = b;
                bytes[i + 2] = g;
                bytes[i + 3] = r;
                break;
            case FORMAT_ARGB:
                bytes[i    ] = a;
                bytes[i + 1] = r;
                bytes[i + 2] = g;
                bytes[i + 3] = b;
                break;
            case FORMAT_BGRA:
                bytes[i    ] = b;
                bytes[i + 1] = g;
                bytes[i + 2] = r;
                bytes[i + 3] = a;
                break;
            case FORMAT_RGBA:
            default:
                bytes[i    ] = r;
                bytes[i + 1] = g;
                bytes[i + 2] = b;
                bytes[i + 3] = a;
                break;
        }

        i += NUM_IMAGE_COMPONENTS;
    }
}
