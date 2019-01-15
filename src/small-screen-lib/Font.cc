/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "Font.h"

Font::Font(const std::string& fontFamily)
    : fontFamily(fontFamily), fontStyle(FONT_STYLE_NORMAL), fontWeight(FONT_WEIGHT_NORMAL) {

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
