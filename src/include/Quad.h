/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#ifndef QUAD_H
#define QUAD_H

#include <vector>

class Quad {
public:
    Quad()
        : sourceRect{0},
          destRect{0},
          destX(0),
          destY(0),
          texture(false) {

    }

    Quad(int sx, int sy, int sw, int sh, float dx, float dy, float dw, float dh)
        : sourceRect{sx, sy, sw, sh},
          destRect{0, 0, clamp(dw), clamp(dh)},
          destX(dx),
          destY(dy),
          texture(sw != 0 && sh != 0) {

    }

    virtual ~Quad() {}

    const int *GetSourceRect() const {
        return this->sourceRect;
    }

    const int *GetDestRect(float x, float y) {
        this->destRect[0] = clamp(this->destX + x);
        this->destRect[1] = clamp(this->destY + y);

        return this->destRect;
    }

    void UpdateDestRect(float w, float h) {
        this->destRect[2] = clamp(w);
        this->destRect[3] = clamp(h);
    }

    bool HasTexture() const {
        return this->texture;
    }

private:
    int sourceRect[4];
    int destRect[4];
    float destX;
    float destY;
    bool texture;
};

typedef std::vector<Quad>::iterator QuadIterator;

#endif
