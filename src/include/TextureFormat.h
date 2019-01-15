/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef TEXTUREFORMAT_H
#define TEXTUREFORMAT_H

#include <string>
#include <exception>
#include "Format.h"

enum TextureFormat {
    TEXTURE_FORMAT_RGBA = 0,
    TEXTURE_FORMAT_ARGB = 1,
    TEXTURE_FORMAT_ABGR = 2,
    TEXTURE_FORMAT_BGRA = 3,
    TEXTURE_FORMAT_ALPHA = 100,
};

inline TextureFormat Cast(int textureFormat) {
    switch (textureFormat) {
        case TEXTURE_FORMAT_RGBA: return TEXTURE_FORMAT_RGBA;
        case TEXTURE_FORMAT_ARGB: return TEXTURE_FORMAT_ARGB;
        case TEXTURE_FORMAT_ABGR: return TEXTURE_FORMAT_ABGR;
        case TEXTURE_FORMAT_BGRA: return TEXTURE_FORMAT_BGRA;
        case TEXTURE_FORMAT_ALPHA: return TEXTURE_FORMAT_ALPHA;
    }

    throw std::invalid_argument(Format() << "Cast: Unknown texture format: " << textureFormat >> Format::to_str);
}

#endif
