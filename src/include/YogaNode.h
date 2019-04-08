/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <napi.h>
#include <Yoga.h>

namespace Yoga {

#define CONCAT(A, B) A ## B
#define VOID_METHOD(name) void name(const Napi::CallbackInfo& info)
#define VOID_METHOD_WITH_PERCENT(name) VOID_METHOD(name); void CONCAT(name, Percent)(const Napi::CallbackInfo& info)
#define VOID_METHOD_WITH_PERCENT_AUTO(name) VOID_METHOD_WITH_PERCENT(name); void CONCAT(name, Auto)(const Napi::CallbackInfo& info)
#define VALUE_METHOD(name) Napi::Value name(const Napi::CallbackInfo& info)

enum ComputedFields : uint32_t {
    COMPUTED_LAYOUT_TOP = 0,
    COMPUTED_LAYOUT_RIGHT = 1,
    COMPUTED_LAYOUT_BOTTOM = 2,
    COMPUTED_LAYOUT_LEFT = 3,
    COMPUTED_LAYOUT_WIDTH = 4,
    COMPUTED_LAYOUT_HEIGHT = 5,

    COMPUTED_BORDER_TOP = 6,
    COMPUTED_BORDER_RIGHT = 7,
    COMPUTED_BORDER_BOTTOM = 8,
    COMPUTED_BORDER_LEFT = 9,

    COMPUTED_PADDING_TOP = 10,
    COMPUTED_PADDING_RIGHT = 11,
    COMPUTED_PADDING_BOTTOM = 12,
    COMPUTED_PADDING_LEFT = 13,

    COMPUTED_MARGIN_TOP = 14,
    COMPUTED_MARGIN_RIGHT = 15,
    COMPUTED_MARGIN_BOTTOM = 16,
    COMPUTED_MARGIN_LEFT = 17,
};

class Node : public Napi::ObjectWrap<Node> {
public:
    Node(const Napi::CallbackInfo& info);
    virtual ~Node();

    static Napi::Object Init(Napi::Env env, Napi::Object exports);
    static int GetInstanceCount();
    static Napi::Value Create(const Napi::CallbackInfo& info);

    VOID_METHOD(setPositionType);
    VOID_METHOD_WITH_PERCENT(setPosition);

    VOID_METHOD(setAlignContent);
    VOID_METHOD(setAlignItems);
    VOID_METHOD(setAlignSelf);
    VOID_METHOD(setFlexDirection);
    VOID_METHOD(setFlexWrap);
    VOID_METHOD(setJustifyContent);

    VOID_METHOD_WITH_PERCENT_AUTO(setMargin);

    VOID_METHOD(setOverflow);
    VOID_METHOD(setDisplay);

    VOID_METHOD(setFlex);
    VOID_METHOD_WITH_PERCENT(setFlexBasis);
    VOID_METHOD(setFlexGrow);
    VOID_METHOD(setFlexShrink);

    VOID_METHOD_WITH_PERCENT_AUTO(setWidth);
    VOID_METHOD_WITH_PERCENT_AUTO(setHeight);

    VOID_METHOD_WITH_PERCENT(setMinWidth);
    VOID_METHOD_WITH_PERCENT(setMinHeight);

    VOID_METHOD_WITH_PERCENT(setMaxWidth);
    VOID_METHOD_WITH_PERCENT(setMaxHeight);

    VOID_METHOD(setAspectRatio);
    
    VOID_METHOD(setBorder);

    VOID_METHOD_WITH_PERCENT(setPadding);

    VALUE_METHOD(getPositionType);
    VALUE_METHOD(getPosition);

    VALUE_METHOD(getAlignContent);
    VALUE_METHOD(getAlignItems);
    VALUE_METHOD(getAlignSelf);
    VALUE_METHOD(getFlexDirection);
    VALUE_METHOD(getFlexWrap);
    VALUE_METHOD(getJustifyContent);

    VALUE_METHOD(getMargin);

    VALUE_METHOD(getOverflow);
    VALUE_METHOD(getDisplay);

    VALUE_METHOD(getFlexBasis);
    VALUE_METHOD(getFlexGrow);
    VALUE_METHOD(getFlexShrink);

    VALUE_METHOD(getWidth);
    VALUE_METHOD(getHeight);

    VALUE_METHOD(getMinWidth);
    VALUE_METHOD(getMinHeight);

    VALUE_METHOD(getMaxWidth);
    VALUE_METHOD(getMaxHeight);

    VALUE_METHOD(getAspectRatio);
    VALUE_METHOD(getBorder);
    VALUE_METHOD(getPadding);

    VOID_METHOD(destroy);
    VOID_METHOD(resetStyle);

    VALUE_METHOD(getParent);
    VALUE_METHOD(getChild);
    VALUE_METHOD(getChildCount);
    VOID_METHOD(insertChild);
    VOID_METHOD(pushChild);
    VOID_METHOD(remove);
    VOID_METHOD(removeChild);
    VOID_METHOD(sendToBack);

    VOID_METHOD(setMeasureFunc);
    VOID_METHOD(unsetMeasureFunc);

    VOID_METHOD(markDirty);
    VALUE_METHOD(isDirty);
    VOID_METHOD(calculateLayout);

    VALUE_METHOD(getBorderBox);
    VALUE_METHOD(getPaddingBox);
    
    VALUE_METHOD(getComputedBorder);
    VALUE_METHOD(getComputedPadding);
    VALUE_METHOD(getComputedMargin);

private:
    static Napi::FunctionReference constructor;

    YGNodeRef ygNode;
    Napi::FunctionReference measureFunc;
};

}
