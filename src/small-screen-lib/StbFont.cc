/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "StbFont.h"

#include "../common/Util.h"
#define STB_RECT_PACK_IMPLEMENTATION
#include <stb_rect_pack.h>

#define STB_TRUETYPE_IMPLEMENTATION
#include <stb_truetype.h>

StbFont::~StbFont() {
    if (this->ttf) {
        delete [] this->ttf;
    }
}

stbtt_fontinfo *StbFont::GetFontInfo() {
    return &this->info;
}

unsigned char *StbFont::GetTTF() {
    return this->ttf;
}

StbFont *StbFont::Load(const std::string& filename, const std::string& fontFamily) {
    unsigned char *data;
    size_t dataSize;

    if (!ReadFileContents(filename, &data, &dataSize)) {
        fprintf(stdout, "Failed to load font file %s\n", filename.c_str());
        return nullptr;
    }

    return Load(data, dataSize, fontFamily);
}

StbFont *StbFont::Load( unsigned char *ttf, size_t ttfLen, const std::string& fontFamily) {
    stbtt_fontinfo info;

    if (!stbtt_InitFont(&info, ttf, stbtt_GetFontOffsetForIndex(ttf, 0))) {
        fprintf(stdout, "Failed to initialize font.\n");

        return nullptr;
    }

    return new StbFont(info, ttf, fontFamily);
}

FontMetrics *StbFont::GetFontMetrics(const int size) {
    return StbFontMetrics::Load(this, size);
}

StbFont::StbFont(const stbtt_fontinfo& info, unsigned char *ttf, const std::string& fontFamily)
    : Font(fontFamily), info(info), ttf(ttf) {

}

StbFontMetrics::~StbFontMetrics() {
    if (this->surface) {
        delete [] this->surface;
        this->surface = nullptr;
    }

    if (this->charInfo) {
        delete [] this->charInfo;
        this->charInfo = nullptr;
    }
}

StbFontMetrics *StbFontMetrics::Load(StbFont *font, const int fontSize) {
    stbtt_pack_context context;
    int w = 512;
    int h = 512;
    unsigned char* pixels = new unsigned char[w * h];

    if (!pixels) {
        return nullptr;
    }

    if (!stbtt_PackBegin(&context, pixels, w, h, 0, 1, nullptr)) {
        fprintf(stdout, "Failed to start font pack.\n");
        delete [] pixels;
        return nullptr;
    }

    stbtt_PackSetOversampling(&context, 2, 2);

    int firstChar = 32;
    int numChars = 126 - 32;
    auto charInfo = new stbtt_packedchar[numChars];

    if (!stbtt_PackFontRange(&context, font->GetTTF(), 0, 36, firstChar, numChars, charInfo)) {
        stbtt_PackEnd(&context);
        delete [] pixels;
        delete [] charInfo;
        fprintf(stdout, "Failed to font pack range.\n");
        return nullptr;
    }

    stbtt_PackEnd(&context);
}

StbFontMetrics::StbFontMetrics(StbFont *font, const int fontSize,
        unsigned char *surface, int surfaceWidth, int surfaceHeight,
        stbtt_packedchar *charInfo, int charCount)
    : FontMetrics(fontSize), surface(surface), surfaceWidth(surfaceWidth), surfaceHeight(surfaceHeight), charInfo(charInfo), charCount(charCount) {

}
