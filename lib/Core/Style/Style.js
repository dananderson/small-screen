/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { parseColor } from './parseColor'
import { rgb } from './rgb'
import { rgba } from './rgba'
import Yoga from 'yoga-layout'

export const HINT_LAYOUT_ONLY = Symbol('HINT_LAYOUT_ONLY')
export const HINT_HAS_BORDER = Symbol('HINT_HAS_BORDER')
export const HINT_HAS_PADDING = Symbol('HINT_HAS_PADDING')
export const HINT_HAS_BORDER_RADIUS = Symbol('HINT_HAS_BORDER_RADIUS')

const Value = Yoga.Value || class YogaValue { constructor (unit, value) { this.unit = unit; this.value = value } }

export function Style (style) {
  if (!(this instanceof Style)) {
    return new Style(style)
  }

  if (style) {
    if (!Array.isArray(style)) {
      ARRAY[0] = style
      style = ARRAY
    }

    for (const obj of style) {
      for (const key in obj) {
        const value = obj[key]
        if (value !== undefined) {
          this[key] = value
        }
      }
    }

    for (const key of TRANSKEYS) {
      const value = this[key]

      if (value !== undefined) {
        this[key] = TRANS[key](value)
      }
    }

    this[HINT_LAYOUT_ONLY] = (this.borderColor === undefined && this.backgroundColor === undefined && !this.backgroundImage)
    this[HINT_HAS_BORDER] = !!(this.border || this.borderTop || this.borderRight || this.borderBottom || this.borderLeft)
    this[HINT_HAS_PADDING] = !!(this.padding || this.paddingTop || this.paddingRight || this.paddingBottom || this.paddingLeft)

    if (this.borderRadius || this.borderRadiusTopLeft || this.borderRadiusTopRight || this.borderRadiusBottomLeft || this.borderRadiusBottomRight) {
      this[HINT_HAS_BORDER_RADIUS] = true
      validateBorderRadius(this)
    }
  }
}

Style.EMPTY = new Style()

Style.prototype = {
  // YogaNode properties

  alignItems: undefined,
  alignContent: undefined,
  alignSelf: undefined,
  border: undefined,
  borderLeft: undefined,
  borderTop: undefined,
  borderRight: undefined,
  borderBottom: undefined,
  display: undefined,
  flex: undefined,
  flexBasis: undefined,
  flexGrow: undefined,
  flexShrink: undefined,
  flexWrap: undefined,
  flexDirection: undefined,
  height: undefined,
  justifyContent: undefined,
  margin: undefined,
  marginLeft: undefined,
  marginTop: undefined,
  marginRight: undefined,
  marginBottom: undefined,
  maxHeight: undefined,
  maxWidth: undefined,
  minHeight: undefined,
  minWidth: undefined,
  overflow: undefined,
  padding: undefined,
  paddingLeft: undefined,
  paddingTop: undefined,
  paddingRight: undefined,
  paddingBottom: undefined,
  left: undefined,
  top: undefined,
  right: undefined,
  bottom: undefined,
  position: undefined,
  width: undefined,

  // RenderingContext properties

  // TODO: additional validation...

  color: undefined,
  borderColor: undefined,
  backgroundColor: undefined,
  backgroundClip: undefined,
  tintColor: undefined,
  textAlign: undefined,
  fontFamily: undefined,
  fontWeight: undefined,
  fontStyle: undefined,
  fontSize: undefined,
  maxLines: undefined,
  textOverflow: undefined,
  objectFit: undefined,
  objectPositionX: undefined,
  objectPositionY: undefined,
  borderRadius: undefined,
  borderRadiusTopLeft: undefined,
  borderRadiusTopRight: undefined,
  borderRadiusBottomLeft: undefined,
  borderRadiusBottomRight: undefined,

  [HINT_LAYOUT_ONLY]: false,
  [HINT_HAS_BORDER]: false,
  [HINT_HAS_PADDING]: false,
  [HINT_HAS_BORDER_RADIUS]: false
}

Style.rgb = rgb
Style.rgba = rgba

const TEXT_OVERFLOW_VALUES = new Set(['clip', 'ellipsis'])
const FONT_WEIGHT_VALUES = new Set(['normal', 'bold'])
const FONT_STYLE_VALUES = new Set(['normal', 'italic'])
const TEXT_ALIGN_VALUES = new Set(['left', 'right', 'center'])
const OBJECT_FIT_VALUES = new Set(['fill', 'contain', 'cover', 'none', 'scale-down'])
const BACKGROUND_CLIP_VALUES = new Set(['border-box', 'padding-box'])

function enumValue (property, value, values) {
  if (value === undefined || values.has(value)) {
    return value
  }

  throw Error(`Unsupported ${property} = ${value}`)
}

function validateBorderRadius (style) {
  const { borderRadius, borderRadiusTopLeft, borderRadiusTopRight, borderRadiusBottomLeft, borderRadiusBottomRight } = style

  if (borderRadius === undefined) {
    style.borderRadius = 0
  }

  for (const value of [ borderRadius, borderRadiusTopLeft, borderRadiusTopRight, borderRadiusBottomLeft, borderRadiusBottomRight ]) {
    if (value !== undefined && (!Number.isInteger(value) || value < 0)) {
      throw Error('Invalid borderRadius value: ' + value)
    }
  }
}

function positiveValue (property, value) {
  if (Number.isInteger(value) && value >= 0) {
    return value >> 0
  }

  throw Error(`${property} expects a positive integer. Value = ${value}`)
}

function objectPositionX (value) {
  let unit = Yoga.UNIT_POINT

  if (typeof value === 'string') {
    if (value === 'left') {
      value = 0
    } else if (value === 'right') {
      return value
    } else if (value.endsWith('%')) {
      unit = Yoga.UNIT_PERCENT
      value = parseFloat(value) / 100
    } else {
      value = parseInt(value)
    }
  } else {
    value = parseFloat(value)
  }

  if (isNaN(value)) {
    throw Error('Invalid objectPositionX: ' + value)
  }

  return new Value(unit, value)
}

function objectPositionY (value) {
  let unit = Yoga.UNIT_POINT

  if (typeof value === 'string') {
    if (value === 'top') {
      value = 0
    } else if (value === 'bottom') {
      return value
    } else if (value.endsWith('%')) {
      unit = Yoga.UNIT_PERCENT
      value = parseFloat(value) / 100
    } else {
      value = parseInt(value)
    }
  } else {
    value = parseFloat(value)
  }

  if (isNaN(value)) {
    throw Error('Invalid objectPositionY: ' + value)
  }

  return new Value(unit, value)
}

const ARRAY = [ Style.EMPTY ]
const TRANS = {
  color: parseColor,
  borderColor: parseColor,
  backgroundColor: parseColor,
  tintColor: parseColor,
  maxLines: value => (value === undefined || value === 'none') ? 0 : positiveValue('maxLines', value),
  textOverflow: value => enumValue('textOverflow', value, TEXT_OVERFLOW_VALUES),
  fontWeight: value => enumValue('fontWeight', value, FONT_WEIGHT_VALUES),
  fontStyle: value => enumValue('fontStyle', value, FONT_STYLE_VALUES),
  textAlign: value => enumValue('textAlign', value, TEXT_ALIGN_VALUES),
  objectFit: value => enumValue('objectFit', value, OBJECT_FIT_VALUES),
  backgroundClip: value => enumValue('backgroundClip', value, BACKGROUND_CLIP_VALUES),
  objectPositionX,
  objectPositionY
}
const TRANSKEYS = Object.keys(TRANS)
