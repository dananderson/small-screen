/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef TEXTMEASUREMENT_H
#define TEXTMEASUREMENT_H

#include "napi.h"
#include <vector>

class TextMeasurement;

class Character {
private:
    enum CharacterType {
        RENDERABLE,
        NEW_LINE,
        WHITESPACE
    };
    
public:
    Character() : sourceRect{0}, destRect{0}, advance(0), destX(0), destY(0), type(WHITESPACE) {

    }

    int *GetSourceRect() {
        return this->sourceRect;
    }

    int *GetDestRect(int x, int y) {
        this->destRect[0] = this->destX + x;
        this->destRect[1] = this->destY + y;
        
        return this->destRect;
    }

    bool IsRenderable() {
        return this->type == RENDERABLE;
    }

    bool IsNewLine() {
        return this->type == NEW_LINE;
    }

    int GetAdvance() {
        return this->advance;
    }

private:
    int sourceRect[4];
    int destRect[4];
    int advance;
    int destX;
    int destY;
    CharacterType type;

    void SetSourceRect(int x, int y, int w, int h) {
        this->sourceRect[0] = x;
        this->sourceRect[1] = y;
        this->sourceRect[2] = w;
        this->sourceRect[3] = h;
    }

    void SetDestRect(int x, int y, int w, int h) {
        this->destX = this->destRect[0] = x;
        this->destY = this->destRect[1] = y;
        this->destRect[2] = w;
        this->destRect[3] = h;
    }

    void SetCharacterType(CharacterType type) {
        this->type = type;
    }

    void SetAdvance(int advance) {
        this->advance = advance;
    }

    friend class TextMeasurement;
};

typedef std::vector<Character>::iterator CharacterIterator;

class TextMeasurement : public Napi::ObjectWrap<TextMeasurement> {
public:

    static Napi::Object Init(Napi::Env env, Napi::Object exports);

    TextMeasurement(const Napi::CallbackInfo& info);
    ~TextMeasurement() {}

    Napi::Value Measure(const Napi::CallbackInfo& info);
    Napi::Value GetWidth(const Napi::CallbackInfo& info);
    Napi::Value GetHeight(const Napi::CallbackInfo& info);

    CharacterIterator Begin() {
        return this->characterStream.begin();
    }

    CharacterIterator End() {
        return this->characterStream.end();
    }

private:
    static Napi::FunctionReference constructor;

    int measuredWidth;
    int measuredHeight;
    std::vector<Character> characterStream;
};

#endif
