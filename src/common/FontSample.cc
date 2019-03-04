/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "FontSample.h"

FontSample::FontSample() {

}

FontSample::~FontSample() {

}

const unsigned char *FontSample::GetTexturePixels() const {
    return this->texturePixels.empty() ? nullptr : &this->texturePixels[0];
}

float FontSample::GetKernAdvance(int codepoint, int nextCodePoint) {
    auto iter = this->kerningPairs.find(((codepoint & 0xFFFF) << 16) | (nextCodePoint & 0xFFFF));

    if (iter != this->kerningPairs.end()) {
        return iter->second;
    }

    return 0;
}
