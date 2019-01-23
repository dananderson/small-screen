/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef STBFONT_H
#define STBFONT_H

#include "Font.h"
#include <stb_truetype.h>
#include <string>
#include <vector>

class StbFontSample;

class StbFont : public Font {
public:
    StbFont(const std::string& file, const std::string& fontFamily, FontStyle fontStyle, FontWeight fontWeight);
    virtual ~StbFont();

private:
    stbtt_fontinfo fontInfo;
    std::vector<unsigned char> ttf;

    friend StbFontSample;
};

#endif
