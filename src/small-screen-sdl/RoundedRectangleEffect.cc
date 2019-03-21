#include "RoundedRectangleEffect.h"
#include <tuple>
#include <algorithm>

int RoundedRectangleEffect::GetLeft() const {
    return std::max(radiusTopLeft, radiusBottomLeft);
}

int RoundedRectangleEffect::GetRight() const {
    return std::max(radiusTopRight, radiusBottomRight);
}

int RoundedRectangleEffect::GetTop() const {
    return std::max(radiusTopLeft, radiusTopRight);
}

int RoundedRectangleEffect::GetBottom() const {
    return std::max(radiusBottomLeft, radiusBottomRight);
}

Rectangle RoundedRectangleEffect::GetCapInsets() const {
    return { GetTop(), GetRight(), GetBottom(), GetLeft() };
}

bool operator<(const RoundedRectangleEffect& l, const RoundedRectangleEffect& r) {
    return std::tie(l.radiusTopLeft, l.radiusTopRight, l.radiusBottomRight, l.radiusBottomLeft, l.stroke)
        < std::tie(r.radiusTopLeft, r.radiusTopRight, r.radiusBottomRight,r.radiusBottomLeft, r.stroke);
}
