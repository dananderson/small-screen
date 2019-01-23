/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef FONTSAMPLE_H
#define FONTSAMPLE_H

#include "Font.h"
#include <string>
#include <map>
#include <vector>
#include <cstdint>

struct CodepointMetrics {
    int sourceX, sourceY, sourceWidth, sourceHeight;
    float destX, destY, destWidth, destHeight;
    float xOffset, yOffset;
    float xAdvance;
};

class FontSample {
public:
    FontSample();
    virtual ~FontSample();

    const std::string GetFontFamily() const { return this->fontFamily; }
    FontStyle GetFontStyle() const { return this->fontStyle; }
    FontWeight GetFontWeight() const { return this->fontWeight; }
    int GetFontSize() const { return this->fontSize; }

    int GetTextureWidth() const { return this->textureWidth; }
    int GetTextureHeight() const { return this->textureHeight; }
    const unsigned char *GetTexturePixels() const;

    float GetAscent() { return this->ascent; }
    float GetLineHeight() { return this->lineHeight; }
    float GetKernAdvance(int codepoint, int nextCodePoint);

    virtual const CodepointMetrics *GetCodepointMetrics(int codepoint) const = 0;

protected:
    std::string fontFamily;
    FontStyle fontStyle;
    FontWeight fontWeight;
    int fontSize;

    float ascent;
    float lineHeight;

    std::vector<unsigned char> texturePixels;
    int textureWidth;
    int textureHeight;

    std::map<int, CodepointMetrics> codepointMetrics;
    std::map<uint32_t, float> kerningPairs;
};

#endif
