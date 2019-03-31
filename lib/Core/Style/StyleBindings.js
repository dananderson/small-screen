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
  WRAP_WRAP_REVERSE,
  Node
} from '../../Core/Util/Yoga'
import { Value } from './Value'

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

function getMethodNames (method) {
  const { name } = method

  return [
    name,
    name + 'Percent',
    name + 'Auto'
  ]
}

function makeSetNumberFunc (method) {
  const [ point ] = getMethodNames(method)

  return (node, value) => {
    if (typeof value === 'number') {
      node[point](value)
    }
  }
}

function makeSetNumberPercentFunc (method) {
  const [ point, percent ] = getMethodNames(method)

  return (node, value) => {
    const type = typeof value

    if (type === 'number') {
      node[point](value)
    } else if (type === 'string' && value.endsWith('%')) {
      const parsed = parseFloat(value)

      if (!isNaN(parsed)) {
        node[percent](parsed)
      }
    }
  }
}

function makeSetNumberPercentAutoFunc (method) {
  const [ point, percent, auto ] = getMethodNames(method)

  return (node, value) => {
    const type = typeof value

    if (type === 'number') {
      node[point](value)
    } else if (value === 'auto') {
      node[auto](value)
    } else if (type === 'string' && value.endsWith('%')) {
      const parsed = parseFloat(value)

      if (!isNaN(parsed)) {
        node[percent](parsed)
      }
    }
  }
}

function makeSetEdgeNumberFunc (edge, method) {
  const [ point ] = getMethodNames(method)

  return (node, value) => {
    const type = typeof value

    if (type === 'number') {
      node[point](edge, value)
    } else if (type === 'string') {
      const parsed = parseFloat(value)

      if (!isNaN(parsed)) {
        node[point](edge, parsed)
      }
    }
  }
}

function makeSetEdgeNumberPercentFunc (edge, method) {
  const [ point, percent ] = getMethodNames(method)

  return (node, value) => {
    const type = typeof value

    if (type === 'number') {
      node[point](edge, value)
    } else if (type === 'string' && value.endsWith('%')) {
      const parsed = parseFloat(value)

      if (!isNaN(parsed)) {
        node[percent](edge, parsed)
      }
    }
  }
}

function makeSetEdgeNumberPercentAutoFunc (edge, method) {
  const [ point, percent, auto ] = getMethodNames(method)

  return (node, value) => {
    const type = typeof value

    if (type === 'number') {
      node[point](edge, value)
    } else if (value === 'auto') {
      node[auto](edge, value)
    } else if (type === 'string' && value.endsWith('%')) {
      const parsed = parseFloat(value)

      if (!isNaN(parsed)) {
        node[percent](edge, parsed)
      }
    }
  }
}

const BINDINGS = {
  alignItems: (node, value) => node.setAlignItems(ALIGN[value]),
  alignContent: (node, value) => node.setAlignContent(ALIGN[value]),
  alignSelf: (node, value) => node.setAlignSelf(ALIGN[value]),
  border: makeSetEdgeNumberFunc(EDGE_ALL, Node.prototype.setBorder),
  borderLeft: makeSetEdgeNumberFunc(EDGE_LEFT, Node.prototype.setBorder),
  borderTop: makeSetEdgeNumberFunc(EDGE_TOP, Node.prototype.setBorder),
  borderRight: makeSetEdgeNumberFunc(EDGE_RIGHT, Node.prototype.setBorder),
  borderBottom: makeSetEdgeNumberFunc(EDGE_BOTTOM, Node.prototype.setBorder),
  display: (node, value) => node.setDisplay(DISPLAY[value]),
  flex: makeSetNumberFunc(Node.prototype.setFlex),
  flexBasis: makeSetNumberPercentFunc(Node.prototype.setFlexBasis),
  flexGrow: makeSetNumberFunc(Node.prototype.setFlexGrow),
  flexShrink: makeSetNumberFunc(Node.prototype.setFlexShrink),
  flexWrap: (node, value) => node.setFlexWrap(FLEX_WRAP[value]),
  flexDirection: (node, value) => node.setFlexDirection(FLEX_DIRECTION[value]),
  height: makeSetNumberPercentAutoFunc(Node.prototype.setHeight),
  justifyContent: (node, value) => node.setJustifyContent(JUSTIFY[value]),
  margin: makeSetEdgeNumberPercentAutoFunc(EDGE_ALL, Node.prototype.setMargin),
  marginLeft: makeSetEdgeNumberPercentAutoFunc(EDGE_LEFT, Node.prototype.setMargin),
  marginTop: makeSetEdgeNumberPercentAutoFunc(EDGE_TOP, Node.prototype.setMargin),
  marginRight: makeSetEdgeNumberPercentAutoFunc(EDGE_RIGHT, Node.prototype.setMargin),
  marginBottom: makeSetEdgeNumberPercentAutoFunc(EDGE_BOTTOM, Node.prototype.setMargin),
  maxHeight: makeSetNumberPercentFunc(Node.prototype.setMaxHeight),
  maxWidth: makeSetNumberPercentFunc(Node.prototype.setMaxWidth),
  minHeight: makeSetNumberPercentFunc(Node.prototype.setMinHeight),
  minWidth: makeSetNumberPercentFunc(Node.prototype.setMinWidth),
  overflow: (node, value) => node.setOverflow(OVERFLOW[value]),
  padding: makeSetEdgeNumberPercentFunc(EDGE_ALL, Node.prototype.setPadding),
  paddingLeft: makeSetEdgeNumberPercentFunc(EDGE_LEFT, Node.prototype.setPadding),
  paddingTop: makeSetEdgeNumberPercentFunc(EDGE_TOP, Node.prototype.setPadding),
  paddingRight: makeSetEdgeNumberPercentFunc(EDGE_RIGHT, Node.prototype.setPadding),
  paddingBottom: makeSetEdgeNumberPercentFunc(EDGE_BOTTOM, Node.prototype.setPadding),
  left: makeSetEdgeNumberPercentFunc(EDGE_LEFT, Node.prototype.setPosition),
  top: makeSetEdgeNumberPercentFunc(EDGE_TOP, Node.prototype.setPosition),
  right: makeSetEdgeNumberPercentFunc(EDGE_RIGHT, Node.prototype.setPosition),
  bottom: makeSetEdgeNumberPercentFunc(EDGE_BOTTOM, Node.prototype.setPosition),
  position: (node, value) => node.setPositionType(POSITION_TYPE[value]),
  width: makeSetNumberPercentAutoFunc(Node.prototype.setWidth)
}

export function bindStyle (node, style) {
  node.resetStyle()

  for (const key in style) {
    bindStyleProperty(node, key, style[key])
  }
}

export function bindStyleProperty (node, property, value) {
  if (value !== undefined) {
    const binding = BINDINGS[property]

    if (binding) {
      binding(node, value instanceof Value ? value.getValue() : value)
    }
  }
}
