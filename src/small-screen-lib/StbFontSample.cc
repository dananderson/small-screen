/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "StbFontSample.h"

#include <iostream>
#include <algorithm>

#include "StbFont.h"
#include "FontSample.h"
#include "Util.h"
#include "Format.h"

std::vector<int> sBasicLatinBlock;
std::vector<int> sLatin1SupplementalBlock;
std::vector<int> sSpecialBlock;

std::vector<int>& GetBasicLatinBlock() {
    if (sBasicLatinBlock.empty()) {
        for (int i = 0x20; i <= 0x7F; i++) {
            sBasicLatinBlock.push_back(i);
        }
    }

    return sBasicLatinBlock;
}

std::vector<int>& GetLatin1SupplementalBlock() {
    if (sLatin1SupplementalBlock.empty()) {
        for (int i = 0xA0; i <= 0xFF; i++) {
            sLatin1SupplementalBlock.push_back(i);
        }
    }

    return sLatin1SupplementalBlock;
}

std::vector<int>& GetSpecialBlock() {
    if (sSpecialBlock.empty()) {
        // fallback
        sSpecialBlock.push_back(0xFFFD);
        // ellipsis
        sSpecialBlock.push_back(0x2026);
    }

    return sSpecialBlock;
}

StbFontSample::StbFontSample(std::shared_ptr<Font> &font, int fontSize) {
    auto stbFont = std::static_pointer_cast<StbFont>(font);

    if (!stbFont) {
        throw std::runtime_error("Expected an instance of StbFont.");
    }

    bool packSuccessful = false;
    std::vector<stbtt_packedchar> charMetrics;
    stbtt_pack_range packRange;
    std::vector<int> &charset = GetBasicLatinBlock();

    charset.insert(charset.end(), GetSpecialBlock().begin(), GetSpecialBlock().end());
    charMetrics.resize(charset.size());

    packRange.font_size = fontSize;
    packRange.first_unicode_codepoint_in_range = 0;
    packRange.array_of_unicode_codepoints = &charset[0];
    packRange.num_chars = (int)charset.size();
    packRange.chardata_for_range = &charMetrics[0];

    for (auto i : { 512, 1024 }) {
        stbtt_pack_context context;

        this->texturePixels.resize(i*i);

        if (!stbtt_PackBegin(&context, &(this->texturePixels[0]), i, i, 0, 1, nullptr)) {
            throw std::runtime_error(Format() << "Failed to initialize pack context for font " << font->GetFontFamily());
        }

        if (!stbtt_PackFontRanges(&context, &(stbFont->ttf[0]), 0, &packRange, 1)) {
            stbtt_PackEnd(&context);
            continue;
        }

        stbtt_PackEnd(&context);

        unsigned short ymax = 0;

        for (stbtt_packedchar &p : charMetrics) {
            ymax = std::max(p.y1, ymax);
        }

        this->textureWidth = i;
        this->textureHeight = std::min(ymax + 1, i);
        this->texturePixels.resize(this->textureWidth*this->textureHeight);
        this->texturePixels.shrink_to_fit();

        packSuccessful = true;

        break;
    }

    if (!packSuccessful) {
        throw std::runtime_error(Format() << "Failed to create texture for font " << font->GetFontFamily());
    }

    auto scale = stbtt_ScaleForPixelHeight(&stbFont->fontInfo, fontSize);
    auto size = (int)charset.size();

    for (int i = 0; i < size; i++) {
        for (int j = 0; j < size; j++) {
            auto first = charset[i];
            auto second = charset[j];

            auto value = stbtt_GetCodepointKernAdvance(&stbFont->fontInfo, first, second);

            if (value != 0) {
                this->kerningPairs[((first & 0xFFFF) << 16) | (second & 0xFFFF)] = value * scale;
            }
        }

        auto codepoint = charset[i];
        auto &p = charMetrics[i];
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

    stbtt_GetFontVMetrics(&stbFont->fontInfo, &ascent, &descent, &lineGap);

    this->ascent = ascent * scale;
    this->lineHeight = (ascent - descent + lineGap) * scale;
    this->fontFamily = font->GetFontFamily();
    this->fontStyle = font->GetFontStyle();
    this->fontWeight = font->GetFontWeight();
    this->fontSize = fontSize;
}

StbFontSample::~StbFontSample() {

}

const CodepointMetrics *StbFontSample::GetCodepointMetrics(int codepoint) const {
    auto iter = this->codepointMetrics.find(codepoint);

    if (iter != this->codepointMetrics.end()) {
        return &(iter->second);
    }

    return nullptr;
}
