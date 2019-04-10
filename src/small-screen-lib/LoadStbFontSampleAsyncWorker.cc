/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "LoadStbFontSampleAsyncWorker.h"
#include "StbFontSample.h"
#include "Format.h"
#include <iostream>

using namespace Napi;

void AppendBasicLatinBlock(std::vector<int32_t>& charset);
void AppendLatin1SupplementalBlock(std::vector<int32_t>& charset);
void AppendSpecialBlock(std::vector<int32_t>& charset);

LoadStbFontSampleAsyncWorker::LoadStbFontSampleAsyncWorker(Napi::Env env, std::shared_ptr<uint8_t> ttf, int32_t index, int32_t fontSize)
    : AsyncWorker(Function::New(env, [](const CallbackInfo& info){})),
      promise(Promise::Deferred::New(env)),
      ttf(ttf),
      index(index),
      fontSize(fontSize),
      ascent(0),
      lineHeight(0),
      width(0),
      height(0) {

}

void LoadStbFontSampleAsyncWorker::Execute() {
    auto buffer = this->ttf.get();
    stbtt_fontinfo fontInfo;

    if (!stbtt_InitFont(&fontInfo, buffer, stbtt_GetFontOffsetForIndex(buffer, this->index))) {
        throw std::runtime_error(Format() << "Failed to parse font.");
    }

    AppendBasicLatinBlock(this->charset);
    AppendSpecialBlock(this->charset);

    this->charMetrics.resize(this->charset.size());

    this->Render();
    this->CalculateFontMetrics(&fontInfo);
}

void LoadStbFontSampleAsyncWorker::OnOK() {
    this->promise.Resolve(StbFontSample::New(
        this->Env(),
        this->fontSize,
        this->ascent,
        this->lineHeight,
        this->pixels,
        this->width,
        this->height,
        this->codepointMetrics,
        this->kerningPairs
    ));
}

Value LoadStbFontSampleAsyncWorker::Promise() {
    return this->promise.Promise();
}

void LoadStbFontSampleAsyncWorker::OnError(const Error& e) {
    this->promise.Reject(e.Value());
}

void LoadStbFontSampleAsyncWorker::Render() {
    auto packSuccessful = false;
    stbtt_pack_range packRange;

    packRange.font_size = this->fontSize;
    packRange.first_unicode_codepoint_in_range = 0;
    packRange.array_of_unicode_codepoints = &charset[0];
    packRange.num_chars = (int)this->charset.size();
    packRange.chardata_for_range = &this->charMetrics[0];

    auto buffer = this->ttf.get();

    for (auto i : { 512, 1024 }) {
        stbtt_pack_context context;

        this->pixels.resize(i*i);

        if (!stbtt_PackBegin(&context, &(this->pixels[0]), i, i, 0, 1, nullptr)) {
            throw std::runtime_error(Format() << "Failed to pack font glyphs.");
        }

        if (!stbtt_PackFontRanges(&context, buffer, this->index, &packRange, 1)) {
            stbtt_PackEnd(&context);
            continue;
        }

        stbtt_PackEnd(&context);

        unsigned short ymax = 0;

        for (stbtt_packedchar &p : this->charMetrics) {
            ymax = std::max(p.y1, ymax);
        }

        this->width = i;
        this->height = std::min(ymax + 1, i);
        this->pixels.resize(this->width*this->height);
        this->pixels.shrink_to_fit();

        packSuccessful = true;

        break;
    }

    if (!packSuccessful) {
        throw std::runtime_error(Format() << "Font characters could not fit in video memory. Reduce font size.");
    }
}

void LoadStbFontSampleAsyncWorker::CalculateFontMetrics(stbtt_fontinfo *fontInfo) {
    auto scale = stbtt_ScaleForPixelHeight(fontInfo, this->fontSize);
    auto size = (int)this->charset.size();

    for (int i = 0; i < size; i++) {
        for (int j = 0; j < size; j++) {
            auto first = this->charset[i];
            auto second = this->charset[j];

            auto value = stbtt_GetCodepointKernAdvance(fontInfo, first, second);

            if (value != 0) {
                this->kerningPairs[((first & 0xFFFF) << 16) | (second & 0xFFFF)] = value * scale;
            }
        }

        auto codepoint = this->charset[i];
        auto &p = this->charMetrics[i];
        CodepointMetrics metrics;

        metrics.sourceX = p.x0;
        metrics.sourceY = p.y0;
        metrics.sourceWidth = p.x1 - p.x0;
        metrics.sourceHeight = p.y1 - p.y0;

        metrics.destX = p.xoff;
        metrics.destY = p.yoff;
        metrics.destWidth = p.xoff2 - p.xoff;
        metrics.destHeight = p.yoff2 - p.yoff;

        metrics.xOffset = p.xoff;
        metrics.yOffset = p.yoff;

        metrics.xAdvance = p.xadvance;

        this->codepointMetrics[codepoint] = metrics;
    }

    int ascent = 0;
    int descent = 0;
    int lineGap = 0;

    stbtt_GetFontVMetrics(fontInfo, &ascent, &descent, &lineGap);

    this->ascent = ascent * scale;
    this->lineHeight = (ascent - descent + lineGap) * scale;
}

void AppendBasicLatinBlock(std::vector<int32_t>& charset) {
    for (int32_t i = 0x20; i <= 0x7F; i++) {
        charset.push_back(i);
    }
}

void AppendLatin1SupplementalBlock(std::vector<int32_t>& charset) {
    for (int32_t i = 0xA0; i <= 0xFF; i++) {
        charset.push_back(i);
    }
}

void AppendSpecialBlock(std::vector<int32_t>& charset) {
    // fallback
    charset.push_back(0xFFFD);
    // ellipsis
    charset.push_back(0x2026);
    // nbsp
    charset.push_back(0x00A0);
}
