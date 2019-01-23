/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "FontStore.h"

#include <cstdio>
#include <string>
#include <iostream>
#include <memory>

#include "Format.h"
#include "StbFont.h"
#include "StbFontSample.h"

using namespace Napi;

std::vector<std::shared_ptr<Font>> sFonts;
std::vector<std::shared_ptr<FontSample>> sSamples;

bool IsFont(std::shared_ptr<Font> &font, const std::string& fontFamily, FontStyle fontStyle, FontWeight fontWeight) {
    return (font->GetFontFamily() == fontFamily && font->GetFontWeight() == fontWeight && font->GetFontStyle() == fontStyle);
}

bool IsFontSample(std::shared_ptr<FontSample> &sample, const std::string& fontFamily, FontStyle fontStyle, FontWeight fontWeight, int fontSize) {
    return (sample->GetFontFamily() == fontFamily && sample->GetFontWeight() == fontWeight && sample->GetFontStyle() == fontStyle && sample->GetFontSize() == fontSize);
}

std::shared_ptr<Font> FindFont(const std::string& fontFamily, FontStyle fontStyle, FontWeight fontWeight) {
    for (auto &font : sFonts) {
        if (IsFont(font, fontFamily, fontStyle, fontWeight)) {
            return font;
        }
    }

    return std::shared_ptr<Font>(nullptr);
}

std::shared_ptr<FontSample> FindSample(const std::string& fontFamily, FontStyle fontStyle, FontWeight fontWeight, int fontSize) {
    for (auto &sample : sSamples) {
        if (IsFontSample(sample, fontFamily, fontStyle, fontWeight, fontSize)) {
            return sample;
        }
    }

    return std::shared_ptr<FontSample>(nullptr);
}

void FontStore::Install(const CallbackInfo& info) {
    auto env = info.Env();
    auto file = info[0].As<String>().Utf8Value();
    auto fontFamily = info[1].As<String>().Utf8Value();
    auto fontStyleString = info[2].As<String>().Utf8Value();
    auto fontStyle = StringToFontStyle(fontStyleString);
    auto fontWeightString = info[3].As<String>().Utf8Value();
    auto fontWeight = StringToFontWeight(fontWeightString);

    if (fontStyle == FONT_STYLE_UNKNOWN) {
        throw Error::New(env, Format() << "Invalid fontStyle = " << fontStyleString );
    }

    if (fontWeight == FONT_WEIGHT_UNKNOWN) {
        throw Error::New(env, Format() << "Invalid fontWeight = " << fontWeightString );
    }

    if (FindFont(fontFamily, fontStyle, fontWeight)) {
        throw Error::New(env, Format() << "Font already exists. {" << file << ", " << fontFamily << ", " << fontStyleString << ", " << fontWeightString << "}");
    }

    std::shared_ptr<Font> newFont;

    try {
        newFont = std::make_shared<StbFont>(file, fontFamily, fontStyle, fontWeight);
    } catch (std::exception &e) {
        throw Error::New(env, Format() << "Failed to create font from file " << file);
    } catch (...) {
        throw Error::New(env, Format() << "Unknown error attempting to read font from file " << file);
    }

    sFonts.push_back(newFont);
}

void FontStore::Uninstall(const CallbackInfo& info) {
    auto env = info.Env();
    auto fontFamily = info[0].As<String>().Utf8Value();
    auto fontStyleString = info[1].As<String>().Utf8Value();
    auto fontStyle = StringToFontStyle(fontStyleString);
    auto fontWeightString = info[2].As<String>().Utf8Value();
    auto fontWeight = StringToFontWeight(fontWeightString);

    if (fontStyle == FONT_STYLE_UNKNOWN) {
        throw Error::New(env, Format() << "Invalid fontStyle = " << fontStyleString );
    }

    if (fontWeight == FONT_WEIGHT_UNKNOWN) {
        throw Error::New(env, Format() << "Invalid fontWeight = " << fontWeightString );
    }

    for (auto p = sFonts.begin(); p != sFonts.end(); p++) {
        if (IsFont(*p, fontFamily, fontStyle, fontWeight)) {
            sFonts.erase(p);
            return;
        }
    }
}

Value FontStore::Sample(const CallbackInfo& info) {
    auto env = info.Env();
    auto fontFamily = info[0].As<String>().Utf8Value();
    auto fontStyleString = info[1].As<String>().Utf8Value();
    auto fontStyle = StringToFontStyle(fontStyleString);
    auto fontWeightString = info[2].As<String>().Utf8Value();
    auto fontWeight = StringToFontWeight(fontWeightString);
    auto fontSize = info[3].As<Number>().Int32Value();

    if (fontStyle == FONT_STYLE_UNKNOWN) {
        throw Error::New(env, Format() << "Invalid fontStyle = " << fontStyleString );
    }

    if (fontWeight == FONT_WEIGHT_UNKNOWN) {
        throw Error::New(env, Format() << "Invalid fontWeight = " << fontWeightString );
    }

    if (fontSize <= 0) {
        throw Error::New(env, "fontSize must be greater than 0.");
    }

    auto font = FindFont(fontFamily, fontStyle, fontWeight);

    if (!font) {
        throw Error::New(env, Format() << "No font installed for  {" << fontFamily << ", " << fontStyleString << ", " << fontWeightString << "}");
    }

    auto sample = FindSample(fontFamily, fontStyle, fontWeight, fontSize);

    if (sample) {
        return External<FontSample>::New(env, sample.get());
    }

    std::shared_ptr<FontSample> newSample;

    try {
        newSample = std::make_shared<StbFontSample>(font, fontSize);
    } catch (std::exception &e) {
        throw Error::New(env, Format() << "Error creating sample for " << fontFamily << ". " << e.what());
    } catch (...) {
        throw Error::New(env, Format() << "Unknown error attempting to create font sample for " << fontFamily);
    }

    sSamples.push_back(newSample);

    return External<FontSample>::New(env, sSamples.back().get());
}

Object FontStore::Init(class Env env, Object exports) {
    auto fontStore = Object::New(env);

    fontStore["install"] = Function::New(env, FontStore::Install, "install");
    fontStore["uninstall"] = Function::New(env, FontStore::Uninstall, "uninstall");
    fontStore["sample"] = Function::New(env, FontStore::Sample, "sample");

    exports["FontStore"] = fontStore;

    return exports;
}