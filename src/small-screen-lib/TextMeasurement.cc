/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "TextMeasurement.h"
#include "../common/FontSample.h"

#include <utf8.h>

using namespace Napi;

#define MEASURE_MODE_UNDEFINED 0
#define MEASURE_MODE_EXACTLY 1
#define MEASURE_MODE_AT_MOST 2

FunctionReference TextMeasurement::constructor;

Object TextMeasurement::Init(class Env env, Object exports) {
    HandleScope scope(env);

    auto func = DefineClass(env, "TextMeasurement", {
        InstanceMethod("measure", &TextMeasurement::Measure),
        InstanceMethod("getWidth", &TextMeasurement::GetWidth),
        InstanceMethod("getHeight", &TextMeasurement::GetHeight),
    });

    constructor = Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("TextMeasurement", func);

    return exports;
}

TextMeasurement::TextMeasurement(const CallbackInfo& info)
    : ObjectWrap<TextMeasurement>(info), measuredWidth(0), measuredHeight(0)  {

}

    // MEASURE_MODE_UNDEFINED: 0,
    // MEASURE_MODE_EXACTLY: 1,
    // MEASURE_MODE_AT_MOST: 2,

    // TODO: consider style.lineHeight
    // TODO: measure assumes a width of 'exactly' and a height of 'at most' or 'undefined', which is the common case.
    // TODO: this implementation assumes width === exactly and height === undefined / at most. this covers the
    //       gallery use cases, but the css style spec is not fully supported

    // TODO: font refactor..

Value TextMeasurement::Measure(const CallbackInfo& info) {
    auto env = info.Env();
    auto text = info[0].As<String>().Utf8Value();
    auto sample = info[1].As<External<FontSample>>().Data();
    auto maxLines = info[2].IsNumber() ? info[2].As<Number>().Int32Value() : 0;
    auto ellipsize = info[3].As<Boolean>();
    auto lineHeight = info[4].IsNumber() ? info[4].As<Number>() : sample->GetLineHeight();
    auto width = info[5].As<Number>().Int32Value();
    auto widthMeasureMode = info[6].As<Number>().Int32Value();
    auto height = info[7].As<Number>().Int32Value();
    auto heightMeasureMode = info[8].As<Number>().Int32Value();

    int x, y, w, h;
    int cursor = 0;

    auto iter = text.begin();
    auto end = text.end();

    this->characterStream.clear();

    Character character;

    while (iter != end) {
        int codepoint = (int)utf8::unchecked::next(iter);

        if (!sample->GetSourceRect(codepoint, &x, &y, &w, &h)) {
            continue;
        }

        int xadvance = sample->GetAdvance(codepoint);

        if ((cursor + xadvance) > width) {
            break;
        }

        if (iter != end) {
            int nextCodepoint = (int)utf8::unchecked::peek_next(iter);

            xadvance += sample->GetKernAdvance(codepoint, nextCodepoint);
        }

        character.codepoint = codepoint;
        character.xadvance = xadvance;

        this->characterStream.push_back(character);
        cursor += xadvance;
    }

    this->measuredWidth = widthMeasureMode == MEASURE_MODE_EXACTLY ? width : cursor;
    this->measuredHeight = heightMeasureMode == MEASURE_MODE_EXACTLY ? height : sample->GetLineHeight();

//    const lineOffset = []
//    const stream = []
//    let prevC = 0
//    let cursor = 0
//    let xadvance, glyph
//    let maxWidth = 0
//    let charCode
//
//    for (const char of this._text) {
//      charCode = char.charCodeAt(0)
//      glyph = metrics.glyph[charCode] || metrics.glyph[63] /* ? */
//      xadvance = glyph.xadvance + (metrics.kerning[prevC << 8 | charCode] || 0)
//
//      if (cursor + xadvance > width) {
//        const lineNum = lineOffset.length + 1
//
//        // TODO: consider the height constraint..
//
//        if (lineNum < maxNumberOfLines) {
//          const result = this._insertLineBreak(stream, cursor)
//
//          cursor = result.cursor
//          maxWidth = max(result.lastCursor, maxWidth)
//          this._pushLineOffset(lineOffset, width - result.lastCursor)
//        } else {
//          cursor = this._ellipsize(stream, cursor, metrics, width)
//          break
//        }
//      }
//
//      stream.push(glyph.id)
//      stream.push(xadvance)
//
//      cursor += xadvance
//      prevC = charCode
//    }

    auto obj = Object::New(env);

    obj["width"] = Number::New(env, this->measuredWidth);
    obj["height"] = Number::New(env, this->measuredHeight);

    return obj;
}

Value TextMeasurement::GetWidth(const CallbackInfo& info) {
    return Number::New(info.Env(), this->measuredWidth);
}

Value TextMeasurement::GetHeight(const CallbackInfo& info) {
    return Number::New(info.Env(), this->measuredHeight);
}
