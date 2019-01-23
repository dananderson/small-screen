/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef TEXTLAYOUT_H
#define TEXTLAYOUT_H

#include "napi.h"
#include <vector>
#include "FontSample.h"
#include "Util.h"
#include "Quad.h"

#define MEASURE_MODE_UNDEFINED 0
#define MEASURE_MODE_EXACTLY 1
#define MEASURE_MODE_AT_MOST 2

enum TextAlign {
    TEXT_ALIGN_LEFT = 0,
    TEXT_ALIGN_CENTER = 1,
    TEXT_ALIGN_RIGHT = 2
};

class CharacterQuad : public Quad {
public:
    CharacterQuad(bool newLine, float advance = 0) : Quad(), advance(advance), newLine(newLine) {

    }

    CharacterQuad(int sx, int sy, int sw, int sh, float dx, float dy, float dw, float dh, float advance)
        : Quad{sx, sy, sw, sh, dx, dy, dw, dh},
          advance(advance),
          newLine(false) {

    }

    bool IsNewLine() const {
        return this->newLine;
    }

    float GetAdvance() const {
        return this->advance;
    }

    static CharacterQuad NEW_LINE;

private:
    float advance;
    bool newLine;
};

typedef std::vector<CharacterQuad>::iterator CharacterQuadIterator;

class TextLayout : public Napi::ObjectWrap<TextLayout> {
public:
    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    TextLayout(const Napi::CallbackInfo& info);
    ~TextLayout() {}

    Napi::Value Layout(const Napi::CallbackInfo& info);
    void Reset(const Napi::CallbackInfo& info);
    Napi::Value GetWidth(const Napi::CallbackInfo& info);
    Napi::Value GetHeight(const Napi::CallbackInfo& info);

    void Layout(
        const std::string text,
        FontSample *sample,
        int maxLines,
        bool ellipsize,
        int width,
        int widthMeasureMode,
        int height,
        int heightMeasureMode);

    float GetLineAlignmentOffset(int lineIndex, TextAlign textAlign);

    CharacterQuadIterator Begin() {
        return this->quads.begin();
    }

    CharacterQuadIterator End() {
        return this->quads.end();
    }

private:
    static Napi::FunctionReference constructor;

    bool measured;
    int measuredWidth;
    int measuredHeight;

    std::vector<CharacterQuad> quads;
    std::vector<std::vector<float>> lineAlignmentOffset;

    bool IsMeasurementValid(int maxLines, bool ellipsize, int width, int widthMeasureMode, int height, int heightMeasureMode) const;
};

#endif
