/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

#include "YogaNode.h"
#include "YogaValue.h"
#include <YGNode.h>
#include <YGStyle.h>
#include <map>

using namespace Napi;
using namespace Yoga;

FunctionReference Node::constructor;
static std::map<YGNodeRef, ObjectReference> sActiveNodes;
static std::vector<std::pair<YGNodeRef, ObjectReference>> sNodePool;
static YGStyle sEmptyStyle = YGStyle{};

#define INSTANCE_METHOD(name) InstanceMethod(#name, &Node::name)

#define GET_NUMBER_IMPL(method, ygMethod) Napi::Value Node::method(const CallbackInfo& info) { \
    return Number::New(info.Env(), ygMethod(this->ygNode)); \
}

#define GET_VALUE_IMPL(method, ygMethod) Napi::Value Node::method(const CallbackInfo& info) { \
    return Yoga::Value::New(info.Env(), ygMethod(this->ygNode)); \
}

#define GET_VALUE_BY_EDGE_IMPL(method, ygMethod) Napi::Value Node::method(const CallbackInfo& info) { \
    return Yoga::Value::New(info.Env(), ygMethod(this->ygNode, static_cast<YGEdge>(info[0].As<Number>().Int32Value()))); \
}

#define GET_NUMBER_BY_EDGE_IMPL(method, ygMethod) Napi::Value Node::method(const CallbackInfo& info) { \
    return Number::New(info.Env(), ygMethod(this->ygNode, static_cast<YGEdge>(info[0].As<Number>().Int32Value()))); \
}

#define SET_ENUM_IMPL(method, ygMethod, type) void Node::method(const CallbackInfo& info) { \
    if (info[0].IsNumber()) { \
        ygMethod(this->ygNode, static_cast<type>(info[0].As<Number>().Int32Value())); \
    } \
}

#define SET_DOUBLE_IMPL(method, ygMethod) void Node::method(const CallbackInfo& info) { \
    ygMethod(this->ygNode, info[0].As<Number>().DoubleValue()); \
}

#define SET_DOUBLE_AND_PERCENT_IMPL(method, ygMethod) SET_DOUBLE_IMPL(method, ygMethod) \
\
void Node::CONCAT(method, Percent)(const CallbackInfo& info) { \
    CONCAT(ygMethod, Percent)(this->ygNode, info[0].As<Number>().DoubleValue()); \
}

#define SET_DOUBLE_BY_EDGE_IMPL(method, ygMethod) void Node::method(const CallbackInfo& info) { \
    ygMethod(this->ygNode, static_cast<YGEdge>(info[0].As<Number>().Int32Value()), info[1].As<Number>().DoubleValue()); \
}

#define SET_DOUBLE_AND_PERCENT_BY_EDGE_IMPL(method, ygMethod) SET_DOUBLE_BY_EDGE_IMPL(method, ygMethod) \
\
void Node::CONCAT(method, Percent)(const CallbackInfo& info) { \
    CONCAT(ygMethod, Percent)(this->ygNode, static_cast<YGEdge>(info[0].As<Number>().Int32Value()), info[1].As<Number>().DoubleValue()); \
}

inline Napi::Value ToNumber(Env env, const float value, Napi::Value& zero) {
    return value == 0 ? zero : Number::New(env, value);
}

void SyncComputedFields(Env env, YGNodeRef ygNode, uint32_t generation, Napi::Value& zero) {
    // The generation is incremented when layout is run on a dirty node. Since a node marked dirty may not result in
    // a layout change, using the generation check will result in more syncing than necessary.

    if (YGNodeLayoutGeneration(ygNode) == generation) {
        auto it = sActiveNodes.find(ygNode);

        if (it != sActiveNodes.end()) {
            auto& ref = it->second;
            auto& position = ygNode->getLayout().position;
            auto& dimensions = ygNode->getLayout().dimensions;

            ref.Set(COMPUTED_LAYOUT_TOP, ToNumber(env, position[YGEdgeTop], zero));
            ref.Set(COMPUTED_LAYOUT_RIGHT, ToNumber(env, position[YGEdgeRight], zero));
            ref.Set(COMPUTED_LAYOUT_BOTTOM, ToNumber(env, position[YGEdgeBottom], zero));
            ref.Set(COMPUTED_LAYOUT_LEFT, ToNumber(env, position[YGEdgeLeft], zero));
            ref.Set(COMPUTED_LAYOUT_WIDTH, ToNumber(env, dimensions[YGDimensionWidth], zero));
            ref.Set(COMPUTED_LAYOUT_HEIGHT, ToNumber(env, dimensions[YGDimensionHeight], zero));

            ref.Set(COMPUTED_BORDER_TOP, ToNumber(env, YGNodeLayoutGetBorder(ygNode, YGEdgeTop), zero));
            ref.Set(COMPUTED_BORDER_RIGHT, ToNumber(env, YGNodeLayoutGetBorder(ygNode, YGEdgeRight), zero));
            ref.Set(COMPUTED_BORDER_BOTTOM, ToNumber(env, YGNodeLayoutGetBorder(ygNode, YGEdgeBottom), zero));
            ref.Set(COMPUTED_BORDER_LEFT, ToNumber(env, YGNodeLayoutGetBorder(ygNode, YGEdgeLeft), zero));

            ref.Set(COMPUTED_PADDING_TOP, ToNumber(env, YGNodeLayoutGetPadding(ygNode, YGEdgeTop), zero));
            ref.Set(COMPUTED_PADDING_RIGHT, ToNumber(env, YGNodeLayoutGetPadding(ygNode, YGEdgeRight), zero));
            ref.Set(COMPUTED_PADDING_BOTTOM, ToNumber(env, YGNodeLayoutGetPadding(ygNode, YGEdgeBottom), zero));
            ref.Set(COMPUTED_PADDING_LEFT, ToNumber(env, YGNodeLayoutGetPadding(ygNode, YGEdgeLeft), zero));

            ref.Set(COMPUTED_MARGIN_TOP, ToNumber(env, YGNodeLayoutGetMargin(ygNode, YGEdgeTop), zero));
            ref.Set(COMPUTED_MARGIN_RIGHT, ToNumber(env, YGNodeLayoutGetMargin(ygNode, YGEdgeRight), zero));
            ref.Set(COMPUTED_MARGIN_BOTTOM, ToNumber(env, YGNodeLayoutGetMargin(ygNode, YGEdgeBottom), zero));
            ref.Set(COMPUTED_MARGIN_LEFT, ToNumber(env, YGNodeLayoutGetMargin(ygNode, YGEdgeLeft), zero));
        }
    }

    const uint32_t childCount = YGNodeGetChildCount(ygNode);

    for (uint32_t i = 0; i < childCount; i++) {
        SyncComputedFields(env, YGNodeGetChild(ygNode, i), generation, zero);
    }
}

Node::Node(const CallbackInfo& info) : ObjectWrap<Node>(info), ygNode(YGNodeNew()) {

}

Node::~Node() {

}

Object Node::Init(Napi::Env env, Object exports) {
    HandleScope scope(env);

    auto func = DefineClass(env, "Node", {
        StaticMethod("create", Node::Create),
        INSTANCE_METHOD(setPositionType),
        INSTANCE_METHOD(setPosition),
        INSTANCE_METHOD(setPositionPercent),
        INSTANCE_METHOD(setAlignContent),
        INSTANCE_METHOD(setAlignItems),
        INSTANCE_METHOD(setAlignSelf),
        INSTANCE_METHOD(setFlexDirection),
        INSTANCE_METHOD(setFlexWrap),
        INSTANCE_METHOD(setJustifyContent),
        INSTANCE_METHOD(setMargin),
        INSTANCE_METHOD(setMarginPercent),
        INSTANCE_METHOD(setMarginAuto),
        INSTANCE_METHOD(setOverflow),
        INSTANCE_METHOD(setDisplay),
        INSTANCE_METHOD(setFlex),
        INSTANCE_METHOD(setFlexBasis),
        INSTANCE_METHOD(setFlexBasisPercent),
        INSTANCE_METHOD(setFlexGrow),
        INSTANCE_METHOD(setFlexShrink),
        INSTANCE_METHOD(setWidth),
        INSTANCE_METHOD(setWidthPercent),
        INSTANCE_METHOD(setWidthAuto),
        INSTANCE_METHOD(setHeight),
        INSTANCE_METHOD(setHeightPercent),
        INSTANCE_METHOD(setHeightAuto),
        INSTANCE_METHOD(setMinWidth),
        INSTANCE_METHOD(setMinWidthPercent),
        INSTANCE_METHOD(setMinHeight),
        INSTANCE_METHOD(setMinHeightPercent),
        INSTANCE_METHOD(setMaxWidth),
        INSTANCE_METHOD(setMaxWidthPercent),
        INSTANCE_METHOD(setMaxHeight),
        INSTANCE_METHOD(setMaxHeightPercent),
        INSTANCE_METHOD(setAspectRatio),
        INSTANCE_METHOD(setBorder),
        INSTANCE_METHOD(setPadding),
        INSTANCE_METHOD(setPaddingPercent),
        INSTANCE_METHOD(getPositionType),
        INSTANCE_METHOD(getPosition),
        INSTANCE_METHOD(getAlignContent),
        INSTANCE_METHOD(getAlignItems),
        INSTANCE_METHOD(getAlignSelf),
        INSTANCE_METHOD(getFlexDirection),
        INSTANCE_METHOD(getFlexWrap),
        INSTANCE_METHOD(getJustifyContent),
        INSTANCE_METHOD(getMargin),
        INSTANCE_METHOD(getOverflow),
        INSTANCE_METHOD(getDisplay),
        INSTANCE_METHOD(getFlexBasis),
        INSTANCE_METHOD(getFlexGrow),
        INSTANCE_METHOD(getFlexShrink),
        INSTANCE_METHOD(getWidth),
        INSTANCE_METHOD(getHeight),
        INSTANCE_METHOD(getMinWidth),
        INSTANCE_METHOD(getMinHeight),
        INSTANCE_METHOD(getMaxWidth),
        INSTANCE_METHOD(getMaxHeight),
        INSTANCE_METHOD(getAspectRatio),
        INSTANCE_METHOD(getBorder),
        INSTANCE_METHOD(getPadding),
        INSTANCE_METHOD(release),
        INSTANCE_METHOD(resetStyle),
        INSTANCE_METHOD(getParent),
        INSTANCE_METHOD(getChild),
        INSTANCE_METHOD(getChildCount),
        INSTANCE_METHOD(insertChild),
        INSTANCE_METHOD(pushChild),
        INSTANCE_METHOD(sendToBack),
        INSTANCE_METHOD(remove),
        INSTANCE_METHOD(removeChild),
        INSTANCE_METHOD(setMeasureFunc),
        INSTANCE_METHOD(unsetMeasureFunc),
        INSTANCE_METHOD(markDirty),
        INSTANCE_METHOD(isDirty),
        INSTANCE_METHOD(calculateLayout),
        INSTANCE_METHOD(getBorderBox),
        INSTANCE_METHOD(getPaddingBox),
        INSTANCE_METHOD(getComputedBorder),
        INSTANCE_METHOD(getComputedPadding),
        INSTANCE_METHOD(getComputedMargin)
    });

    constructor = Persistent(func);
    constructor.SuppressDestruct();

    exports.Set("Node", func);

    return exports;
}

Napi::Value Node::Create(const CallbackInfo& info) {
    if (sNodePool.empty()) {
        auto jsNode = constructor.New({}).As<Object>();
        auto node = ObjectWrap::Unwrap(jsNode);

        sActiveNodes[node->ygNode] = Persistent(jsNode);
        sActiveNodes[node->ygNode].SuppressDestruct();

        return jsNode;
    }

    EscapableHandleScope scope(info.Env());
    auto& poolEntry = sNodePool.back();
    auto jsNode = poolEntry.second.Value();
    auto ygNode = poolEntry.first;

    sActiveNodes[ygNode] = std::move(poolEntry.second);

    sNodePool.pop_back();

    return scope.Escape(jsNode);
}

void Node::release(const CallbackInfo& info) {
    HandleScope scope(info.Env());
    auto recursive = info.Length() == 1 ? info[0].ToBoolean().Value() : false;

    if (!recursive && YGNodeGetChildCount(ygNode) > 0) {
       throw Error::New(info.Env(), "Cannot release Node with children.");
    }

    auto parent = YGNodeGetParent(ygNode);

    if (parent) {
        YGNodeRemoveChild(parent, ygNode);
    }

    this->Release(this->ygNode);
}

void Node::resetStyle(const CallbackInfo& info) {
    this->ResetStyle();
    this->ygNode->markDirtyAndPropogate();
}

Napi::Value Node::getParent(const CallbackInfo& info) {
    auto it = sActiveNodes.find(YGNodeGetParent(this->ygNode));

    if (it != sActiveNodes.end()) {
        return it->second.Value();
    }

    return info.Env().Undefined();
}

Napi::Value Node::getChild(const CallbackInfo& info) {
    int32_t index = info[0].As<Number>();
    auto node = YGNodeGetChild(this->ygNode, index);
    auto it = sActiveNodes.find(node);

    if (it != sActiveNodes.end()) {
        return it->second.Value();
    }

    return info.Env().Undefined();
}

void Node::insertChild(const CallbackInfo& info) {
    Node *child = ObjectWrap::Unwrap(info[0].As<Object>());
    int32_t index = info[1].As<Number>();
    auto it = sActiveNodes.find(child->ygNode);

    if (it != sActiveNodes.end()) {
        YGNodeInsertChild(this->ygNode, child->ygNode, index);
    }
}

void Node::removeChild(const CallbackInfo& info) {
    Node *child = ObjectWrap::Unwrap(info[0].As<Object>());
    auto it = sActiveNodes.find(child->ygNode);

    if (it != sActiveNodes.end()) {
        YGNodeRemoveChild(this->ygNode, child->ygNode);
    }
}

void Node::pushChild(const CallbackInfo& info) {
    Node *child = ObjectWrap::Unwrap(info[0].As<Object>());
    auto it = sActiveNodes.find(child->ygNode);

    if (it != sActiveNodes.end()) {
        YGNodeInsertChild(this->ygNode, child->ygNode, YGNodeGetChildCount(this->ygNode));
    }
}

void Node::remove(const CallbackInfo& info) {
    YGNodeRef parent = YGNodeGetParent(this->ygNode);

    if (parent) {
        YGNodeRemoveChild(parent, this->ygNode);
    }
}

void Node::sendToBack(const CallbackInfo& info) {
    YGNodeRef parent = YGNodeGetParent(this->ygNode);

    if (!parent) {
        return;
    }

    YGNodeRemoveChild(parent, this->ygNode);
    YGNodeInsertChild(parent, this->ygNode, YGNodeGetChildCount(parent));
}

void Node::setMeasureFunc(const Napi::CallbackInfo& info) {
    if (!info[0].IsFunction()) {
        this->unsetMeasureFunc(info);
        return;
    }

    auto func = info[0].As<Function>();

    this->ResetMeasureFunc();
    this->measureFunc.Reset(func, 1);

    YGNodeSetMeasureFunc(this->ygNode, [](YGNodeRef nodeRef, float width, YGMeasureMode widthMode, float height, YGMeasureMode heightMode) -> YGSize {
        YGSize size = { 0, 0 };
        auto it = sActiveNodes.find(nodeRef);

        if (it == sActiveNodes.end()) {
            return size;
        }

        auto env = it->second.Env();
        HandleScope scope(env);

        auto jsNode = it->second.Value().As<Object>();
        Node *node = ObjectWrap::Unwrap(jsNode);

        auto result = node->measureFunc.Call({
            Number::New(env, width),
            Number::New(env, widthMode),
            Number::New(env, height),
            Number::New(env, heightMode)
        });

        if (result.IsObject()) {
            auto obj = result.As<Object>();
            auto width = obj.Get("width");
            auto height = obj.Get("height");

            size.width = width.IsNumber() ? width.As<Number>() : 0.f;
            size.height = height.IsNumber() ? height.As<Number>() : 0.f;
        }

        return size;
    });
}

void Node::unsetMeasureFunc(const Napi::CallbackInfo& info) {
    this->ResetMeasureFunc();
}

void Node::markDirty(const Napi::CallbackInfo& info) {
    this->ygNode->markDirtyAndPropogate();
}

Napi::Value Node::isDirty(const Napi::CallbackInfo& info) {
    return Boolean::New(info.Env(), YGNodeIsDirty(this->ygNode));
}

void Node::calculateLayout(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    HandleScope scope(env);
    double width = info[0].As<Number>();
    double height = info[1].As<Number>();
    int32_t direction = info[2].As<Number>();
    auto zero = Number::New(env, 0);

    YGNodeCalculateLayout(this->ygNode, width, height, static_cast<YGDirection>(direction));

    // Computed fields are copied to the numbered indexed fields of the node object. This avoids javascript from
    // calling into native code to get layout information (and constructing temporary objects and arrays). This is
    // a performance improvement for the existing design. Rendering needs to be refactored to clearly delineate
    // javascript and native responsibilities.
     
    SyncComputedFields(env, this->ygNode, YGNodeCurrentLayoutGeneration(), zero);
}

Napi::Value Node::getBorderBox(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    auto layout = Array::New(env, 4);

    layout[0u] = Number::New(env, YGNodeLayoutGetLeft(this->ygNode));
    layout[1u] = Number::New(env, YGNodeLayoutGetTop(this->ygNode));
    layout[2u] = Number::New(env, YGNodeLayoutGetWidth(this->ygNode));
    layout[3u] = Number::New(env, YGNodeLayoutGetHeight(this->ygNode));

    return layout;
}

Napi::Value Node::getPaddingBox(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    auto layout = Array::New(env, 4);

    auto paddingTop = YGNodeLayoutGetPadding(this->ygNode, YGEdgeTop);
    auto paddingRight = YGNodeLayoutGetPadding(this->ygNode, YGEdgeRight);
    auto paddingBottom = YGNodeLayoutGetPadding(this->ygNode, YGEdgeBottom);
    auto paddingLeft = YGNodeLayoutGetPadding(this->ygNode, YGEdgeLeft);

    layout[0u] = Number::New(env, YGNodeLayoutGetLeft(this->ygNode) + paddingLeft);
    layout[1u] = Number::New(env, YGNodeLayoutGetTop(this->ygNode) + paddingTop);
    layout[2u] = Number::New(env, YGNodeLayoutGetWidth(this->ygNode) - (paddingLeft + paddingRight));
    layout[3u] = Number::New(env, YGNodeLayoutGetHeight(this->ygNode) - (paddingTop + paddingBottom));

    return layout;
}

Napi::Value Node::getComputedBorder(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    auto layout = Array::New(env, 4);

    layout[0u] = Number::New(env, YGNodeLayoutGetBorder(this->ygNode, YGEdgeTop));
    layout[1u] = Number::New(env, YGNodeLayoutGetBorder(this->ygNode, YGEdgeRight));
    layout[2u] = Number::New(env, YGNodeLayoutGetBorder(this->ygNode, YGEdgeBottom));
    layout[3u] = Number::New(env, YGNodeLayoutGetBorder(this->ygNode, YGEdgeLeft));

    return layout;
}

Napi::Value Node::getComputedPadding(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    auto layout = Array::New(env, 4);

    layout[0u] = Number::New(env, YGNodeLayoutGetPadding(this->ygNode, YGEdgeTop));
    layout[1u] = Number::New(env, YGNodeLayoutGetPadding(this->ygNode, YGEdgeRight));
    layout[2u] = Number::New(env, YGNodeLayoutGetPadding(this->ygNode, YGEdgeBottom));
    layout[3u] = Number::New(env, YGNodeLayoutGetPadding(this->ygNode, YGEdgeLeft));

    return layout;
}

Napi::Value Node::getComputedMargin(const Napi::CallbackInfo& info) {
    auto env = info.Env();
    auto layout = Array::New(env, 4);

    layout[0u] = Number::New(env, YGNodeLayoutGetMargin(this->ygNode, YGEdgeTop));
    layout[1u] = Number::New(env, YGNodeLayoutGetMargin(this->ygNode, YGEdgeRight));
    layout[2u] = Number::New(env, YGNodeLayoutGetMargin(this->ygNode, YGEdgeBottom));
    layout[3u] = Number::New(env, YGNodeLayoutGetMargin(this->ygNode, YGEdgeLeft));

    return layout;
}

GET_VALUE_BY_EDGE_IMPL(getPosition, YGNodeStyleGetPosition)
GET_VALUE_BY_EDGE_IMPL(getMargin, YGNodeStyleGetMargin)
GET_VALUE_BY_EDGE_IMPL(getPadding, YGNodeStyleGetPadding)
GET_VALUE_IMPL(getFlexBasis, YGNodeStyleGetFlexBasis)
GET_VALUE_IMPL(getWidth, YGNodeStyleGetWidth)
GET_VALUE_IMPL(getHeight, YGNodeStyleGetHeight)
GET_VALUE_IMPL(getMinWidth, YGNodeStyleGetMinWidth)
GET_VALUE_IMPL(getMinHeight, YGNodeStyleGetMinHeight)
GET_VALUE_IMPL(getMaxWidth, YGNodeStyleGetMaxWidth)
GET_VALUE_IMPL(getMaxHeight, YGNodeStyleGetMaxHeight)
GET_NUMBER_BY_EDGE_IMPL(getBorder, YGNodeStyleGetBorder)
GET_NUMBER_IMPL(getPositionType, YGNodeStyleGetPositionType)
GET_NUMBER_IMPL(getAlignContent, YGNodeStyleGetAlignContent)
GET_NUMBER_IMPL(getAlignItems, YGNodeStyleGetAlignItems)
GET_NUMBER_IMPL(getAlignSelf, YGNodeStyleGetAlignSelf)
GET_NUMBER_IMPL(getFlexDirection, YGNodeStyleGetFlexDirection)
GET_NUMBER_IMPL(getFlexWrap, YGNodeStyleGetFlexWrap)
GET_NUMBER_IMPL(getJustifyContent, YGNodeStyleGetJustifyContent)
GET_NUMBER_IMPL(getOverflow, YGNodeStyleGetOverflow)
GET_NUMBER_IMPL(getDisplay, YGNodeStyleGetDisplay)
GET_NUMBER_IMPL(getFlexGrow, YGNodeStyleGetFlexGrow)
GET_NUMBER_IMPL(getFlexShrink, YGNodeStyleGetFlexShrink)
GET_NUMBER_IMPL(getAspectRatio, YGNodeStyleGetAspectRatio)
GET_NUMBER_IMPL(getChildCount, YGNodeGetChildCount)

SET_ENUM_IMPL(setPositionType, YGNodeStyleSetPositionType, YGPositionType)

SET_ENUM_IMPL(setAlignContent, YGNodeStyleSetAlignContent, YGAlign)
SET_ENUM_IMPL(setAlignItems, YGNodeStyleSetAlignItems, YGAlign)
SET_ENUM_IMPL(setAlignSelf, YGNodeStyleSetAlignSelf, YGAlign)
SET_ENUM_IMPL(setFlexDirection, YGNodeStyleSetFlexDirection, YGFlexDirection)
SET_ENUM_IMPL(setFlexWrap, YGNodeStyleSetFlexWrap, YGWrap)
SET_ENUM_IMPL(setJustifyContent, YGNodeStyleSetJustifyContent, YGJustify)

SET_ENUM_IMPL(setOverflow, YGNodeStyleSetOverflow, YGOverflow)
SET_ENUM_IMPL(setDisplay, YGNodeStyleSetDisplay, YGDisplay)

SET_DOUBLE_IMPL(setFlex, YGNodeStyleSetFlex)
SET_DOUBLE_IMPL(setFlexGrow, YGNodeStyleSetFlexGrow)
SET_DOUBLE_IMPL(setFlexShrink, YGNodeStyleSetFlexShrink)

SET_DOUBLE_IMPL(setAspectRatio, YGNodeStyleSetAspectRatio)

SET_DOUBLE_AND_PERCENT_IMPL(setFlexBasis, YGNodeStyleSetFlexBasis)

SET_DOUBLE_AND_PERCENT_IMPL(setWidth, YGNodeStyleSetWidth)
SET_DOUBLE_AND_PERCENT_IMPL(setHeight, YGNodeStyleSetHeight)

SET_DOUBLE_AND_PERCENT_IMPL(setMinWidth, YGNodeStyleSetMinWidth)
SET_DOUBLE_AND_PERCENT_IMPL(setMinHeight, YGNodeStyleSetMinHeight)

SET_DOUBLE_AND_PERCENT_IMPL(setMaxWidth, YGNodeStyleSetMaxWidth)
SET_DOUBLE_AND_PERCENT_IMPL(setMaxHeight, YGNodeStyleSetMaxHeight)

SET_DOUBLE_BY_EDGE_IMPL(setBorder, YGNodeStyleSetBorder)

SET_DOUBLE_AND_PERCENT_BY_EDGE_IMPL(setPosition, YGNodeStyleSetPosition)
SET_DOUBLE_AND_PERCENT_BY_EDGE_IMPL(setPadding, YGNodeStyleSetPadding)
SET_DOUBLE_AND_PERCENT_BY_EDGE_IMPL(setMargin, YGNodeStyleSetMargin)

void Node::setWidthAuto(const CallbackInfo& info) {
    YGNodeStyleSetWidthAuto(this->ygNode);
}

void Node::setHeightAuto(const CallbackInfo& info) {
    YGNodeStyleSetHeightAuto(this->ygNode);
}

void Node::setMarginAuto(const CallbackInfo& info) {
    YGNodeStyleSetMarginAuto(this->ygNode, static_cast<YGEdge>(info[0].As<Number>().Int32Value()));
}

int Node::GetInstanceCount() {
    return static_cast<int32_t>(sActiveNodes.size());
}

void Node::ResetStyle() {
    this->ygNode->setStyle(sEmptyStyle);
}

void Node::ResetMeasureFunc() {
    if (!this->measureFunc.IsEmpty()) {
        this->measureFunc.Unref();
        this->measureFunc.Reset();
        YGNodeSetMeasureFunc(this->ygNode, nullptr);
    }
}

void Node::Release(YGNodeRef ygNode) {
    auto it = sActiveNodes.find(ygNode);

    if (it == sActiveNodes.end()) {
        return;
    }

    const uint32_t childCount = YGNodeGetChildCount(ygNode);

    for (uint32_t i = 0; i < childCount; i++) {
        Release(YGNodeGetChild(ygNode, i));
    }

    YGNodeRemoveAllChildren(ygNode);

    auto node = ObjectWrap::Unwrap(it->second.Value());

    node->ResetStyle();
    node->ResetMeasureFunc();
    ygNode->setDirty(false);

    sNodePool.push_back(std::make_pair(ygNode, std::move(it->second)));
    sActiveNodes.erase(ygNode);
}
