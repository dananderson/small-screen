/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef FONTSAMPLE_H
#define FONTSAMPLE_H

//struct CodepointMetrics {
//    int codepoint;
//
//};

class FontSample {
    public:

    FontSample(const int fontSize, unsigned char *texturePixels, int textureWidth, int textureHeight);
    virtual ~FontSample();

    int GetFontSize() const { return this->fontSize; }
    int GetTextureWidth() const { return this->textureWidth; }
    int GetTextureHeight() const { return this->textureHeight; }
    unsigned char *GetTexturePixels() const { return this->texturePixels; }


    virtual bool GetSourceRect(int codepoint, int *x, int *y, int *width, int *height) = 0;
    virtual int GetKernAdvance(int codepoint, int nextCodePoint) = 0;
    virtual int GetAdvance(int codepoint) = 0;
    virtual int GetYOffset(int codepoint) = 0;
    virtual int GetAscent() = 0;
    virtual int GetLineHeight() = 0;

    private:

    int fontSize;
    int textureWidth;
    int textureHeight;
    unsigned char *texturePixels;
};

#endif
