/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <napi.h>
#include <stb_truetype.h>
#include <memory>
#include "FontSample.h" // CodepointMetrics

class LoadStbFontSampleAsyncWorker : public Napi::AsyncWorker {
public:
    LoadStbFontSampleAsyncWorker(Napi::Env env, std::shared_ptr<uint8_t> ttf, int32_t index, int32_t fontSize);
    virtual ~LoadStbFontSampleAsyncWorker() {}

    Napi::Value Promise();

protected:
    virtual void Execute();
    virtual void OnOK();
    virtual void OnError(const Napi::Error& e);

private:
    void Render();
    void CalculateFontMetrics(stbtt_fontinfo *fontInfo);

    Napi::Promise::Deferred promise;
    std::shared_ptr<uint8_t> ttf;
    int32_t index;
    int32_t fontSize;
    float ascent;
    float lineHeight;
    int32_t width;
    int32_t height;
    std::vector<uint8_t> pixels;
    std::vector<int32_t> charset;
    std::vector<stbtt_packedchar> charMetrics;
    std::map<int32_t, CodepointMetrics> codepointMetrics;
    std::map<uint32_t, float> kerningPairs;
};
