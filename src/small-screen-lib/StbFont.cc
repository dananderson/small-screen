/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "StbFont.h"

#include <iostream>
#include <exception>
#include "Util.h"
#include "Format.h"
#include "StbFontSample.h"

StbFont::StbFont(const std::string& file, const std::string& fontFamily, FontStyle fontStyle, FontWeight fontWeight)
    : Font(fontFamily, fontStyle, fontWeight) {
    try {
        ReadBytesFromFile(file, this->ttf);
    } catch (const std::exception& e) {
        throw;
    }

    if (!stbtt_InitFont(&this->fontInfo, &ttf[0], stbtt_GetFontOffsetForIndex(&ttf[0], 0))) {
        throw std::runtime_error(Format() << "Failed to parse font file: " << file);
    }
}

StbFont::~StbFont() {

}
