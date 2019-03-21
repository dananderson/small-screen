#ifndef ROUNDED_RECTANGLE_EFFECT_H
#define ROUNDED_RECTANGLE_EFFECT_H

#include "Rectangle.h"

struct RoundedRectangleEffect {
    int radiusTopLeft;
    int radiusTopRight;
    int radiusBottomRight;
    int radiusBottomLeft;
    int stroke;

    int GetLeft() const;
    int GetRight() const;
    int GetTop() const;
    int GetBottom() const;

    Rectangle GetCapInsets() const;
};

bool operator<(const RoundedRectangleEffect& l, const RoundedRectangleEffect& r);

#endif
