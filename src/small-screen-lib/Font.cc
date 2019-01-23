/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "Font.h"
#include "Format.h"
#include <exception>

Font::Font(const std::string& fontFamily, FontStyle fontStyle, FontWeight fontWeight)
    : fontFamily(fontFamily), fontStyle(fontStyle), fontWeight(fontWeight) {

}

Font::~Font() {

}

const std::string Font::GetFontFamily() const {
    return this->fontFamily;
}

FontStyle Font::GetFontStyle() const {
    return this->fontStyle;
}

FontWeight Font::GetFontWeight() const {
    return this->fontWeight;
}


FontStyle StringToFontStyle(const std::string fontStyle) {
    if (fontStyle == "normal") {
        return FONT_STYLE_NORMAL;
    } else if (fontStyle == "italic") {
        return FONT_STYLE_ITALIC;
    }

    return FONT_STYLE_UNKNOWN;
}

FontWeight StringToFontWeight(const std::string fontWeight) {
    if (fontWeight == "normal") {
        return FONT_WEIGHT_NORMAL;
    } else if (fontWeight == "bold") {
        return FONT_WEIGHT_BOLD;
    }

    return FONT_WEIGHT_UNKNOWN;
}
