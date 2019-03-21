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
#include <dirent.h>
#include "Util.h"

using namespace Napi;

#define NUM_IMAGE_COMPONENTS 4

inline float ScaleFactor(const int source, const int dest) {
    return 1.f + ((dest - source) / (float)source);
}

LoadImageAsyncTask::LoadImageAsyncTask(std::shared_ptr<ThreadSafeCallback> callback,
            Value source,
            const std::string &sourceType,
            int desiredWidth,
            int desiredHeight,
            TextureFormat desiredFormat,
            bool basename)
     : callback(callback),
       data(nullptr),
       dataSize(0),
       source(),
       sourceData(nullptr),
       sourceDataSize(0),
       sourceType(sourceType),
       desiredWidth(desiredWidth),
       desiredHeight(desiredHeight),
       desiredFormat(desiredFormat),
       basename(basename) {

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
        if (this->sourceData == nullptr && this->basename) {
            auto directory = GetDirectory(this->source);
            auto filename = GetBasename(this->source);
            auto search = filename.c_str();

            DIR *dir;
            struct dirent *ent;
            if ((dir = opendir(directory.c_str())) != nullptr) {
              while ((ent = readdir(dir)) != NULL) {
                auto name = ent->d_name;

                if (strstr(name, search) == name) {
                    this->source = directory + "/" + std::string(name);
                    break;
                }
              }
              closedir(dir);
            }
        }

        try {
            this->LoadRasterImage(this->sourceData, this->sourceDataSize);
        } catch (std::exception e) {
            this->LoadSvgImage(reinterpret_cast<char *>(this->sourceData), this->sourceDataSize);
        }
    }

    ConvertToFormat(this->data, this->dataSize, this->desiredFormat);
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
        throw std::runtime_error("Failed to parse image.");
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
