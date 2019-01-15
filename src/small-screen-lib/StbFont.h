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

class StbFont : public Font {
    public:

    virtual ~StbFont();

    stbtt_fontinfo *GetFontInfo();
    unsigned char *GetTTF();
    FontMetrics *GetFontMetrics(const int size);
    static StbFont *Load(const std::string& filename, const std::string& fontFamily);
    static StbFont *Load( unsigned char *ttf, size_t ttfLen, const std::string& fontFamily);

    private:

    StbFont(const stbtt_fontinfo& info, unsigned char *ttf, const std::string& fontFamily);

    stbtt_fontinfo info;
    unsigned char *ttf;
};

class StbFontMetrics : public FontMetrics {
    public:

    virtual ~StbFontMetrics();

    static StbFontMetrics *Load(StbFont *font, const int fontSize);

    private:

    StbFontMetrics(StbFont *font, const int fontSize,
            unsigned char *surface, int surfaceWidth, int surfaceHeight,
            stbtt_packedchar *charInfo, int charCount);

    unsigned char *surface;
    int surfaceWidth;
    int surfaceHeight;
    stbtt_packedchar *charInfo;
    int charCount;
};

#endif
