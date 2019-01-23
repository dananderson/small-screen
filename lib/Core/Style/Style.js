/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { parseColor } from './parseColor'

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
  tintColor: undefined,
  textAlign: undefined,
  fontFamily: undefined,
  fontWeight: undefined,
  fontStyle: undefined,
  fontSize: undefined,
  maxLines: undefined,
  textOverflow: undefined,
  objectFit: undefined
}

const TEXT_OVERFLOW_VALUES = new Set(['clip', 'ellipsis'])
const FONT_WEIGHT_VALUES = new Set(['normal', 'bold'])
const FONT_STYLE_VALUES = new Set(['normal', 'italic'])
const TEXT_ALIGN_VALUES = new Set(['left', 'right', 'center'])
const OBJECT_FIT_VALUES = new Set(['fill', 'contain', 'cover', 'none', 'scale-down'])

function enumValue (property, value, values) {
  if (value === undefined || values.has(value)) {
    return value
  }

  throw Error(`Unsupported ${property} = ${value}`)
}

function positiveValue (property, value) {
  if (Number.isInteger(value) && value >= 0) {
    return value >> 0
  }

  throw Error(`${property} expects a positive integer. Value = ${value}`)
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
  objectFit: value => enumValue('objectFit', value, OBJECT_FIT_VALUES)
}
const TRANSKEYS = Object.keys(TRANS)
