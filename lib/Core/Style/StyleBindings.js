/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import Yoga from 'yoga-layout'

// Style string values to Yoga Layout constants.
const DISPLAY = createStyleStringValueToYogaEnumMap('DISPLAY')
const FLEX_DIRECTION = createStyleStringValueToYogaEnumMap('FLEX_DIRECTION')
const ALIGN = createStyleStringValueToYogaEnumMap('ALIGN')
const JUSTIFY_CONTENT = createStyleStringValueToYogaEnumMap('JUSTIFY')
// const DIRECTION = createStyleStringValueToYogaEnumMap('DIRECTION')
const WRAP = createStyleStringValueToYogaEnumMap('WRAP')
const OVERFLOW = createStyleStringValueToYogaEnumMap('OVERFLOW')
const POSITION = createStyleStringValueToYogaEnumMap('POSITION_TYPE')
// const PRINT_OPTIONS = createStyleStringValueToYogaEnumMap('PRINT_OPTIONS')

const BINDINGS = {
  alignItems: (node, value) => node.setAlignItems(ALIGN[value]),
  alignContent: (node, value) => node.setAlignContent(ALIGN[value]),
  alignSelf: (node, value) => node.setAlignSelf(ALIGN[value]),
  border: (node, value) => node.setBorder(Yoga.EDGE_ALL, value),
  borderLeft: (node, value) => node.setBorder(Yoga.EDGE_LEFT, value),
  borderTop: (node, value) => node.setBorder(Yoga.EDGE_TOP, value),
  borderRight: (node, value) => node.setBorder(Yoga.EDGE_RIGHT, value),
  borderBottom: (node, value) => node.setBorder(Yoga.EDGE_BOTTOM, value),
  display: (node, value) => node.setDisplay(DISPLAY[value]),
  flex: (node, value) => node.setFlex(value),
  flexBasis: (node, value) => node.setFlexBasis(value),
  flexGrow: (node, value) => node.setFlexGrow(value),
  flexShrink: (node, value) => node.setFlexShrink(value),
  flexWrap: (node, value) => node.setFlexWrap(WRAP[value]),
  flexDirection: (node, value) => node.setFlexDirection(FLEX_DIRECTION[value]),
  height: (node, value) => node.setHeight(value),
  justifyContent: (node, value) => node.setJustifyContent(JUSTIFY_CONTENT[value]),
  margin: (node, value) => node.setMargin(Yoga.EDGE_ALL, value),
  marginLeft: (node, value) => node.setMargin(Yoga.EDGE_LEFT, value),
  marginTop: (node, value) => node.setMargin(Yoga.EDGE_TOP, value),
  marginRight: (node, value) => node.setMargin(Yoga.EDGE_RIGHT, value),
  marginBottom: (node, value) => node.setMargin(Yoga.EDGE_BOTTOM, value),
  maxHeight: (node, value) => node.setMaxHeight(value),
  maxWidth: (node, value) => node.setMaxWidth(value),
  minHeight: (node, value) => node.setMinHeight(value),
  minWidth: (node, value) => node.setMinWidth(value),
  overflow: (node, value) => node.setOverflow(OVERFLOW[value]),
  padding: (node, value) => node.setPadding(Yoga.EDGE_ALL, value),
  paddingLeft: (node, value) => node.setPadding(Yoga.EDGE_LEFT, value),
  paddingTop: (node, value) => node.setPadding(Yoga.EDGE_TOP, value),
  paddingRight: (node, value) => node.setPadding(Yoga.EDGE_RIGHT, value),
  paddingBottom: (node, value) => node.setPadding(Yoga.EDGE_BOTTOM, value),
  left: (node, value) => node.setPosition(Yoga.EDGE_LEFT, value),
  top: (node, value) => node.setPosition(Yoga.EDGE_TOP, value),
  right: (node, value) => node.setPosition(Yoga.EDGE_RIGHT, value),
  bottom: (node, value) => node.setPosition(Yoga.EDGE_BOTTOM, value),
  position: (node, value) => node.setPositionType(POSITION[value]),
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

export function bindStyleProperty(node, property, value) {
  if (value !== undefined) {
    const binding = BINDINGS[property]

    if (binding) {
      binding(node, value.getValue ? value.getValue() : value)
    }
  }
}

function createStyleStringValueToYogaEnumMap (yogaEnumPrefix) {
  let prefix = yogaEnumPrefix + '_'
  let countConstant = prefix + 'COUNT'
  let map = {}

  Object.keys(Yoga)
    .filter(k => k.startsWith(prefix) && k !== countConstant)
    .forEach(k => {
      const key = k.replace(prefix, '').replace('_', '-').toLowerCase()
      map[key] = Yoga[k]
    })

  return map
}
