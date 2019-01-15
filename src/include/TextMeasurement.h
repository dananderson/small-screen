/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef TEXTMEASUREMENT_H
#define TEXTMEASUREMENT_H

#include "napi.h"
#include <vector>

struct Character {
    int codepoint;
    int xadvance;
};

typedef std::vector<Character>::const_iterator CharacterStreamIterator;

class TextMeasurement : public Napi::ObjectWrap<TextMeasurement> {
public:

    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    TextMeasurement(const Napi::CallbackInfo& info);

    Napi::Value Measure(const Napi::CallbackInfo& info);
    Napi::Value GetWidth(const Napi::CallbackInfo& info);
    Napi::Value GetHeight(const Napi::CallbackInfo& info);

    CharacterStreamIterator CharacterStreamBegin() {
        return this->characterStream.begin();
    }

    CharacterStreamIterator CharacterStreamEnd() {
        return this->characterStream.end();
    }

private:
    static Napi::FunctionReference constructor;

    int measuredWidth;
    int measuredHeight;
    std::vector<Character> characterStream;
};

#endif
