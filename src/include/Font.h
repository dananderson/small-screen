/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef FONT_H
#define FONT_H

#include <string>

enum FontStyle {
    FONT_STYLE_UNKNOWN = -1,
    FONT_STYLE_NORMAL = 0,
    FONT_STYLE_ITALIC = 1,
};

enum FontWeight {
    FONT_WEIGHT_UNKNOWN = -1,
    FONT_WEIGHT_NORMAL = 0,
    FONT_WEIGHT_BOLD = 1,
};

FontStyle StringToFontStyle(const std::string fontStyle);
FontWeight StringToFontWeight(const std::string fontWeight);

class FontSample;

class Font {
public:
    Font(const std::string& fontFamily, FontStyle fontStyle, FontWeight fontWeight);
    virtual ~Font();

    const std::string GetFontFamily() const;
    FontStyle GetFontStyle() const;
    FontWeight GetFontWeight() const;

private:
    std::string fontFamily;
    FontStyle fontStyle;
    FontWeight fontWeight;
};

#endif
