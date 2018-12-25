/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { parseColor } from './parseColor'
import { fontId } from '../Utilities/fontId'

const Yoga = require('yoga-layout')

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

const LAYOUT_STYLE_APPLY_FUNC = {
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

const PSEUDO_CLASSES = new Set(['focus'])

function applyStyleToLayout (layout) {
  const style = this

  this.bindings.length = 0

  for (let key in style) {
    const apply = LAYOUT_STYLE_APPLY_FUNC[key]

    if (apply) {
      const value = style[key]

      if (value.getValue) {
        apply(layout, value.getValue())
        value.bind(key, layout)
        this.bindings.push(value)
      } else {
        apply(layout, value)
      }
    }
  }

  return layout
}

function release () {
  for (const value of this.bindings) {
    value.release()
  }
}

function applyStyleValueToLayout (key, value, layout) {
  const apply = LAYOUT_STYLE_APPLY_FUNC[key]

  apply && apply(layout, value.getValue ? value.getValue() : value)
}

function Style (style) {
  validate(style)

  for (let p of PSEUDO_CLASSES) {
    if (p in style) {
      const pseudoClassStyle = validate(Object.assign({}, style, style[p]))

      delete pseudoClassStyle[p]

      style[p] = toStyle(pseudoClassStyle)
    }
  }

  return toStyle(style)
}

function toStyle (style) {
  style.isStyle = true

  Object.defineProperty(style, 'apply', { value: applyStyleToLayout.bind(style), enumerable: false })
  Object.defineProperty(style, 'release', { value: release.bind(style), enumerable: false })
  Object.defineProperty(style, 'bindings', { value: [], enumerable: false })

  return style
}

function validate (style) {
  // TODO: validate layout properties

  const { color, borderColor, backgroundColor, tintColor, lineHeight, textAlign, fontFamily, fontSize } = style

  if (color) {
    style.color = parseColor(color)
  }

  if (borderColor) {
    style.borderColor = parseColor(borderColor)
  }

  if (backgroundColor) {
    style.backgroundColor = parseColor(backgroundColor)
  }

  if (tintColor) {
    style.tintColor = parseColor(tintColor)
  }

  if (textAlign) {
    style.textAlign = parseTextAlign(textAlign)
  }

  if (lineHeight) {
    style.lineHeight = lineHeight << 0
  }

  if (fontFamily && fontSize) {
    style.fontId = fontId(fontFamily, fontSize)
  }

  return style
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

function createStyleSheet (styleMap) {
  const styleSheet = {}

  Object.getOwnPropertyNames(styleMap)
    .forEach(key => {
      styleSheet[key] = Style(styleMap[key])
    })

  return styleSheet
}

function merge (...styles) {
  let merged = {}

  for (let style of styles) {
    if (!style.isStyle) {
      style = Style(style)
    }
    merged = Object.assign(merged, style)
  }

  return toStyle(merged)
}

function parseTextAlign (textAlign) {
  switch (textAlign) {
    case 'left':
      return 0
    case 'right':
      return 1
    case 'center':
      return 2
    default:
      return undefined
  }
}

/**
 * Create a stylesheet.
 *
 * @param obj {object} Raw stylesheet.
 * @returns {Style}
 */
Style.createStyleSheet = createStyleSheet

/**
 * Merge an array of Styles objects into one.
 *
 * @param styles {array} List of Style objects to merge.
 * @returns {Style}
 */
Style.merge = merge

/**
 * An empty style sheet.
 */
Style.EMPTY = Style({})

export { Style, applyStyleValueToLayout }
