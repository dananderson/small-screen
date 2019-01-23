/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "TextLayout.h"

#include <utf8.h>
#include <iostream>
#include "Util.h"

using namespace Napi;

#define UNICODE_SPACE 0x20
#define UNICODE_DOT 0x2E
#define UNICODE_FALLBACK 0xFFFD
#define UNICODE_QUESTION 0x3F
#define UNICODE_NEW_LINE 0x0A
#define UNICODE_ELLIPSIS 0x2026

CharacterQuad CharacterQuad::NEW_LINE(true);
FunctionReference TextLayout::constructor;

inline bool CanAdvanceY(float y, float lineHeight, float heightLimit, int current, int maxLines) {
    return (maxLines == 0 || current + 1 < maxLines) && (heightLimit == 0 || y + lineHeight <= heightLimit);
}

inline void AppendCharacterQuad(std::vector<CharacterQuad> &quads, const CodepointMetrics *metrics, float ascent, float xadvance) {
   quads.push_back(CharacterQuad(
       metrics->sourceX, metrics->sourceY, metrics->sourceWidth, metrics->sourceHeight,
       metrics->xOffset, ascent + metrics->yOffset, metrics->destWidth, metrics->destHeight,
       xadvance
   ));
}

inline float Ellipsize(bool ellipsize, const CodepointMetrics *ellipsis, int ellipsisRepeat, float ascent, std::vector<CharacterQuad> &quads, int ellipsisIndex, float ellipsisCursor) {
    auto result = 0.f;

    if (ellipsize && ellipsisIndex != -1) {
        quads.erase(quads.end() - (quads.size() - ellipsisIndex), quads.end());

        for (int i = 0; i < ellipsisRepeat; i++) {
            AppendCharacterQuad(quads, ellipsis, ascent, ellipsis->xAdvance);
        }

        result = ellipsis->xAdvance * ellipsisRepeat;
    }

    return ellipsisCursor + result;
}

inline void AddLineAlignmentOffset(std::vector<std::vector<float>> &target, float width, float lineWidth) {
    target.push_back({0.f, (width - lineWidth) / 2.f, width - lineWidth});
}

Value NewDimensions(Env env, int width, int height) {
    auto dimensions = Object::New(env);

    dimensions["width"] = Number::New(env, width);
    dimensions["height"] = Number::New(env, height);

    return dimensions;
}

Object TextLayout::Init(class Env env, Object exports) {
    HandleScope scope(env);

    auto func = DefineClass(env, "TextLayout", {
        InstanceMethod("layout", &TextLayout::Layout),
        InstanceMethod("reset", &TextLayout::Reset),
        InstanceMethod("getWidth", &TextLayout::GetWidth),
        InstanceMethod("getHeight", &TextLayout::GetHeight),
    });

    constructor = Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("TextLayout", func);

    return exports;
}

TextLayout::TextLayout(const CallbackInfo& info)
    : ObjectWrap<TextLayout>(info), measured(false), measuredWidth(0), measuredHeight(0)  {

}

float TextLayout::GetLineAlignmentOffset(int lineIndex, TextAlign textAlign) {
    if (lineIndex < 0 || lineIndex >= (int)this->lineAlignmentOffset.size()) {
        return 0;
    }

    return this->lineAlignmentOffset[lineIndex][textAlign];
}

void TextLayout::Layout(
        const std::string text,
        FontSample *sample,
        int maxLines,
        bool ellipsize,
        int width,
        int widthMeasureMode,
        int height,
        int heightMeasureMode) {
    if (this->measured && this->IsMeasurementValid(maxLines, ellipsize, width, widthMeasureMode, height, heightMeasureMode)) {
        return;
    }

    auto lineHeight = sample->GetLineHeight();
    auto ascent = sample->GetAscent();
    auto fallback = sample->GetCodepointMetrics(UNICODE_FALLBACK);

    if (!fallback) {
        fallback = sample->GetCodepointMetrics(UNICODE_QUESTION);
    }

    auto ellipsis = sample->GetCodepointMetrics(UNICODE_ELLIPSIS);
    auto ellipsisRepeat = 1;

    if (!ellipsis) {
        ellipsis = sample->GetCodepointMetrics(UNICODE_DOT);
        ellipsisRepeat = 3;
    }

    auto space = sample->GetCodepointMetrics(UNICODE_SPACE);
    auto spaceCharacterQuad = CharacterQuad(false, space->xAdvance);
    auto ellipsisLength = ellipsis->xAdvance * ellipsisRepeat;

    auto cursor = 0.f;
    auto y = 0;
    auto codepoint = -1;
    auto previousCodepoint = -1;
    auto lastSpaceIndex = -1;
    auto lastSpaceCursor = 0.f;
    auto ellipsisIndex = -1;
    auto ellipsisCursor = 0.f;
    auto maxWidth = 0.f;
    auto end = text.end();

    this->quads.clear();
    this->lineAlignmentOffset.clear();
    this->measured = false;

    for (auto iter = text.begin(); iter != end; ) {
        previousCodepoint = codepoint;
        codepoint = utf8::unchecked::next(iter);

        // Process explicit new lines.
        if (codepoint == UNICODE_NEW_LINE) {
            if (CanAdvanceY(y, lineHeight, height, (int)this->lineAlignmentOffset.size(), maxLines)) {
                AddLineAlignmentOffset(this->lineAlignmentOffset, width, cursor);
                maxWidth = std::max(cursor, maxWidth);
                lastSpaceIndex = -1;
                ellipsisIndex = -1;
                cursor = 0;
                y += lineHeight;
                this->quads.push_back(CharacterQuad::NEW_LINE);
                continue;
            } else {
                cursor = Ellipsize(ellipsize, ellipsis, ellipsisRepeat, ascent, this->quads, ellipsisIndex, ellipsisCursor);
                break;
            }
        }

        auto metrics = sample->GetCodepointMetrics(codepoint);

        // Codepoint was not loaded for this font, so use the fallback character.
        if (metrics == nullptr) {
            metrics = fallback;
        }

        auto xadvance = metrics->xAdvance;

        // Process spaces.
        if (codepoint == UNICODE_SPACE) {
            if (cursor == 0 || previousCodepoint == UNICODE_SPACE) {
                // Skip leading spaces and consecutive spaces.
            } else if (width != 0 && cursor + xadvance >= width) {
                // No more space on this line.
                if (CanAdvanceY(y, lineHeight, height, (int)this->lineAlignmentOffset.size(), maxLines)) {
                    AddLineAlignmentOffset(this->lineAlignmentOffset, width, cursor);
                    maxWidth = std::max(cursor, maxWidth);
                    lastSpaceIndex = -1;
                    ellipsisIndex = -1;
                    cursor = 0;
                    y += lineHeight;
                    // Write a new line instead of a space, so the line has no trailing spaces.
                    this->quads.push_back(CharacterQuad::NEW_LINE);
                } else {
                    cursor = Ellipsize(ellipsize, ellipsis, ellipsisRepeat, ascent, this->quads, ellipsisIndex, ellipsisCursor);
                    break;
                }
            } else {
                // Note the space position, as this is a possible place to break the line.
                lastSpaceIndex = this->quads.size();
                lastSpaceCursor = cursor;
                this->quads.push_back(spaceCharacterQuad);
                cursor += xadvance;
            }

            continue;
        }

        // Note this non-space character as a possible place to add ellipsis.
        if (cursor > 0 && cursor + ellipsisLength <= width) {
            ellipsisIndex = (int)this->quads.size() - 1;
            ellipsisCursor = cursor;
        }

        // Process all other characters.
        if (width != 0 && cursor + xadvance >= width) {
            if (CanAdvanceY(y, lineHeight, height, (int)this->lineAlignmentOffset.size(), maxLines)) {
                if (lastSpaceIndex != -1) {
                    // Break on the last space encountered. Move characters after the space to the next line.
                    AddLineAlignmentOffset(this->lineAlignmentOffset, width, lastSpaceCursor);
                    maxWidth = std::max(lastSpaceCursor, maxWidth);
                    cursor = cursor - lastSpaceCursor - space->xAdvance;
                    this->quads[lastSpaceIndex] = CharacterQuad::NEW_LINE;

                    // Adjust the ellipsis position for the new line.
                    if (cursor > 0 && cursor + ellipsisLength <= width) {
                        ellipsisIndex = (int)this->quads.size() - 1;
                        ellipsisCursor = cursor;
                    } else {
                        ellipsisIndex = -1;
                    }

                    lastSpaceIndex = -1;
                } else {
                    // No space on this line. Break right here in the middle of a word.
                    AddLineAlignmentOffset(this->lineAlignmentOffset, width, cursor);
                    maxWidth = std::max(cursor, maxWidth);
                    cursor = 0;
                    this->quads.push_back(CharacterQuad::NEW_LINE);
                }

                y += lineHeight;
            } else {
                cursor = Ellipsize(ellipsize, ellipsis, ellipsisRepeat, ascent, this->quads, ellipsisIndex, ellipsisCursor);
                break;
            }
        }

        xadvance += (iter != end) ? sample->GetKernAdvance(codepoint, (int)utf8::unchecked::peek_next(iter)) : 0;
        cursor += xadvance;

        AppendCharacterQuad(this->quads, metrics, ascent, xadvance);
    }

    if (cursor > 0) {
        AddLineAlignmentOffset(this->lineAlignmentOffset, width, cursor);
        maxWidth = std::max(cursor, maxWidth);
        y += lineHeight;
    }

    this->measured = true;
    this->measuredWidth = clamp(maxWidth);
    this->measuredHeight = clamp(y);
}

Value TextLayout::Layout(const CallbackInfo& info) {
    auto text = info[0].As<String>().Utf8Value();
    auto sample = info[1].As<External<FontSample>>().Data();
    auto maxLines = info[2].IsNumber() ? info[2].As<Number>().Int32Value() : 0;
    auto ellipsize = info[3].As<Boolean>();
    auto width = info[4].As<Number>().Int32Value();
    auto widthMeasureMode = info[5].As<Number>().Int32Value();
    auto height = info[6].As<Number>().Int32Value();
    auto heightMeasureMode = info[7].As<Number>().Int32Value();

    this->Layout(text, sample, maxLines, ellipsize, width, widthMeasureMode, height, heightMeasureMode);

    return NewDimensions(info.Env(), this->measuredWidth, this->measuredHeight);
}

bool TextLayout::IsMeasurementValid(int maxLines, bool ellipsize, int width, int widthMeasureMode, int height, int heightMeasureMode) const {
    return (this->measuredWidth == width || this->measuredHeight == height);
}

void TextLayout::Reset(const Napi::CallbackInfo& info) {
    this->measured = false;
}

Value TextLayout::GetWidth(const CallbackInfo& info) {
    return Number::New(info.Env(), this->measuredWidth);
}

Value TextLayout::GetHeight(const CallbackInfo& info) {
    return Number::New(info.Env(), this->measuredHeight);
}
