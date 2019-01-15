/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "FontSample.h"

FontSample::FontSample(const int fontSize, unsigned char *texturePixels, int textureWidth, int textureHeight)
    : fontSize(fontSize), texturePixels(texturePixels), textureWidth(textureWidth), textureHeight(textureHeight) {

}

FontSample::~FontSample() {

}
