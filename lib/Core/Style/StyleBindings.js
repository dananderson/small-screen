/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import {
  ALIGN_AUTO,
  ALIGN_BASELINE,
  ALIGN_CENTER,
  ALIGN_FLEX_END,
  ALIGN_FLEX_START,
  ALIGN_SPACE_AROUND,
  ALIGN_SPACE_BETWEEN,
  ALIGN_STRETCH,
  DISPLAY_FLEX,
  DISPLAY_NONE,
  EDGE_ALL,
  EDGE_BOTTOM,
  EDGE_LEFT,
  EDGE_RIGHT,
  EDGE_TOP,
  FLEX_DIRECTION_COLUMN,
  FLEX_DIRECTION_COLUMN_REVERSE,
  FLEX_DIRECTION_ROW,
  FLEX_DIRECTION_ROW_REVERSE,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_END, JUSTIFY_FLEX_START,
  JUSTIFY_SPACE_AROUND,
  JUSTIFY_SPACE_BETWEEN,
  JUSTIFY_SPACE_EVENLY,
  OVERFLOW_HIDDEN,
  OVERFLOW_SCROLL,
  OVERFLOW_VISIBLE,
  POSITION_TYPE_ABSOLUTE,
  POSITION_TYPE_RELATIVE,
  WRAP_NO_WRAP,
  WRAP_WRAP,
  WRAP_WRAP_REVERSE
} from '../../Core/Util/Yoga'

const ALIGN = {
  auto: ALIGN_AUTO,
  'flex-start': ALIGN_FLEX_START,
  center: ALIGN_CENTER,
  'flex-end': ALIGN_FLEX_END,
  stretch: ALIGN_STRETCH,
  baseline: ALIGN_BASELINE,
  'space-between': ALIGN_SPACE_BETWEEN,
  'space-around': ALIGN_SPACE_AROUND
}

const DISPLAY = {
  flex: DISPLAY_FLEX,
  none: DISPLAY_NONE
}

const POSITION_TYPE = {
  relative: POSITION_TYPE_RELATIVE,
  absolute: POSITION_TYPE_ABSOLUTE
}

const FLEX_DIRECTION = {
  column: FLEX_DIRECTION_COLUMN,
  'column-reverse': FLEX_DIRECTION_COLUMN_REVERSE,
  row: FLEX_DIRECTION_ROW,
  'row-reverse': FLEX_DIRECTION_ROW_REVERSE
}

const FLEX_WRAP = {
  'no-wrap': WRAP_NO_WRAP,
  wrap: WRAP_WRAP,
  'wrap-reverse': WRAP_WRAP_REVERSE
}

const JUSTIFY = {
  'flex-start': JUSTIFY_FLEX_START,
  center: JUSTIFY_CENTER,
  'flex-end': JUSTIFY_FLEX_END,
  'space-between': JUSTIFY_SPACE_BETWEEN,
  'space-around': JUSTIFY_SPACE_AROUND,
  'space-evenly': JUSTIFY_SPACE_EVENLY
}

const OVERFLOW = {
  visible: OVERFLOW_VISIBLE,
  hidden: OVERFLOW_HIDDEN,
  scroll: OVERFLOW_SCROLL
}

function invalidEnum (value, map) {
  throw Error(`Invalid style string: ${value}. Expected: ${Object.keys(map).join(', ')}`)
}

function getYogaEnum (value, map) {
  return value in map ? map[value] : invalidEnum(value, map)
}

const BINDINGS = {
  alignItems: (node, value) => node.setAlignItems(getYogaEnum(value, ALIGN)),
  alignContent: (node, value) => node.setAlignContent(getYogaEnum(value, ALIGN)),
  alignSelf: (node, value) => node.setAlignSelf(getYogaEnum(value, ALIGN)),
  border: (node, value) => node.setBorder(EDGE_ALL, value),
  borderLeft: (node, value) => node.setBorder(EDGE_LEFT, value),
  borderTop: (node, value) => node.setBorder(EDGE_TOP, value),
  borderRight: (node, value) => node.setBorder(EDGE_RIGHT, value),
  borderBottom: (node, value) => node.setBorder(EDGE_BOTTOM, value),
  display: (node, value) => node.setDisplay(getYogaEnum(value, DISPLAY)),
  flex: (node, value) => node.setFlex(value),
  flexBasis: (node, value) => node.setFlexBasis(value),
  flexGrow: (node, value) => node.setFlexGrow(value),
  flexShrink: (node, value) => node.setFlexShrink(value),
  flexWrap: (node, value) => node.setFlexWrap(getYogaEnum(value, FLEX_WRAP)),
  flexDirection: (node, value) => node.setFlexDirection(getYogaEnum(value, FLEX_DIRECTION)),
  height: (node, value) => node.setHeight(value),
  justifyContent: (node, value) => node.setJustifyContent(getYogaEnum(value, JUSTIFY)),
  margin: (node, value) => node.setMargin(EDGE_ALL, value),
  marginLeft: (node, value) => node.setMargin(EDGE_LEFT, value),
  marginTop: (node, value) => node.setMargin(EDGE_TOP, value),
  marginRight: (node, value) => node.setMargin(EDGE_RIGHT, value),
  marginBottom: (node, value) => node.setMargin(EDGE_BOTTOM, value),
  maxHeight: (node, value) => node.setMaxHeight(value),
  maxWidth: (node, value) => node.setMaxWidth(value),
  minHeight: (node, value) => node.setMinHeight(value),
  minWidth: (node, value) => node.setMinWidth(value),
  overflow: (node, value) => node.setOverflow(getYogaEnum(value, OVERFLOW)),
  padding: (node, value) => node.setPadding(EDGE_ALL, value),
  paddingLeft: (node, value) => node.setPadding(EDGE_LEFT, value),
  paddingTop: (node, value) => node.setPadding(EDGE_TOP, value),
  paddingRight: (node, value) => node.setPadding(EDGE_RIGHT, value),
  paddingBottom: (node, value) => node.setPadding(EDGE_BOTTOM, value),
  left: (node, value) => node.setPosition(EDGE_LEFT, value),
  top: (node, value) => node.setPosition(EDGE_TOP, value),
  right: (node, value) => node.setPosition(EDGE_RIGHT, value),
  bottom: (node, value) => node.setPosition(EDGE_BOTTOM, value),
  position: (node, value) => node.setPositionType(getYogaEnum(value, POSITION_TYPE)),
  width: (node, value) => node.setWidth(value)
}

export function bindStyle (node, style) {
  const values = {}

  for (const key in style) {
    const value = style[key]

    if (value !== undefined) {
      const binding = BINDINGS[key]

      if (binding) {
        if (value.getValue) {
          binding(node, value.getValue())
        } else {
          binding(node, value)
        }
      }

      if (value.getValue) {
        values[key] = value
      }
    }
  }

  return values
}

export function bindStyleProperty (node, property, value) {
  if (value !== undefined) {
    const binding = BINDINGS[property]

    if (binding) {
      binding(node, value.getValue ? value.getValue() : value)
    }
  }
}
