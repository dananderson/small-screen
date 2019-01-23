/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef STBFONTSAMPLE_H
#define STBFONTSAMPLE_H

#include "FontSample.h"
#include <stb_truetype.h>
#include <string>
#include <memory>

class StbFont;

class StbFontSample : public FontSample {
    public:

    StbFontSample(std::shared_ptr<Font> &font, int fontSize);
    virtual ~StbFontSample();

    virtual const CodepointMetrics *GetCodepointMetrics(int codepoint) const;
};

#endif
