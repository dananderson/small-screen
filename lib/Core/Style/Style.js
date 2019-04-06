/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { parseColor } from './parseColor'
import { rgb } from './rgb'
import { rgba } from './rgba'
import { ObjectPosition } from './ObjectPosition'
import { Value } from './Value'

export const HINT_LAYOUT_ONLY = Symbol.for('HINT_LAYOUT_ONLY')
export const HINT_HAS_BORDER = Symbol.for('HINT_HAS_BORDER')
export const HINT_HAS_PADDING = Symbol.for('HINT_HAS_PADDING')
export const HINT_HAS_BORDER_RADIUS = Symbol.for('HINT_HAS_BORDER_RADIUS')
export const HINT_ANIMATED_PROPERTIES = Symbol.for('HINT_ANIMATED')

let assign = Object.assign

export function Style (style) {
  if (!(this instanceof Style)) {
    return new Style(style)
  }

  let animatedProperties
  let value

  if (style) {
    if (!Array.isArray(style)) {
      ARRAY[0] = style
      style = ARRAY
    }

    for (const obj of style) {
      if (obj instanceof Style) {
        // Values have already been validated. Just copy the defined properties.
        assign(this, obj)
      } else {
        // Plain object. Validate each property before assigning.
        for (const property in obj) {
          value = obj[property]
          this[property] = property in VALIDATE_PROPERTY ? VALIDATE_PROPERTY[property](value) : value
        }
      }
    }

    // Find all (animated) properties in the combined style.
    for (const key in this) {
      if (this[key] instanceof Value) {
        (animatedProperties || (animatedProperties = [])).push(key)
      }
    }

    // Set hints for the renderer.
    this[HINT_LAYOUT_ONLY] = (this.borderColor === undefined && this.backgroundColor === undefined && !this.backgroundImage)
    this[HINT_HAS_BORDER] = !!(this.border || this.borderTop || this.borderRight || this.borderBottom || this.borderLeft)
    this[HINT_HAS_PADDING] = !!(this.padding || this.paddingTop || this.paddingRight || this.paddingBottom || this.paddingLeft)
    this[HINT_HAS_BORDER_RADIUS] = !!(this.borderRadius || this.borderRadiusTopLeft || this.borderRadiusTopRight || this.borderRadiusBottomLeft || this.borderRadiusBottomRight)
    this[HINT_ANIMATED_PROPERTIES] = animatedProperties

    Object.freeze(this)
  }
}

Style.EMPTY = new Style()

Style.prototype = {
  [HINT_LAYOUT_ONLY]: false,
  [HINT_HAS_BORDER]: false,
  [HINT_HAS_PADDING]: false,
  [HINT_HAS_BORDER_RADIUS]: false,
  [HINT_ANIMATED_PROPERTIES]: undefined
}

Style.rgb = rgb
Style.rgba = rgba

const TEXT_OVERFLOW_VALUES = new Set(['clip', 'ellipsis'])
const FONT_WEIGHT_VALUES = new Set(['normal', 'bold'])
const FONT_STYLE_VALUES = new Set(['normal', 'italic'])
const TEXT_ALIGN_VALUES = new Set(['left', 'right', 'center'])
const OBJECT_FIT_VALUES = new Set(['fill', 'contain', 'cover', 'none', 'scale-down'])
const BACKGROUND_CLIP_VALUES = new Set(['border-box', 'padding-box'])

const greaterThanZero = (value) => value > 0 && Number.isInteger(value) ? value : undefined
const number = value => typeof value === 'number' && !isNaN(value) ? value : undefined
const string = value => typeof value === 'string' ? value : undefined

function oneOf (values) {
  return value => values.has(value) ? value : undefined
}

const ARRAY = [ Style.EMPTY ]
const VALIDATE_PROPERTY = {
  // Yoga style properties are validated when bound to view.

  backgroundColor: parseColor,
  backgroundClip: oneOf(BACKGROUND_CLIP_VALUES),
  borderColor: parseColor,
  borderRadius: greaterThanZero,
  borderRadiusTopLeft: greaterThanZero,
  borderRadiusTopRight: greaterThanZero,
  borderRadiusBottomLeft: greaterThanZero,
  borderRadiusBottomRight: greaterThanZero,
  color: parseColor,
  fontFamily: string,
  fontSize: greaterThanZero,
  fontStyle: oneOf(FONT_STYLE_VALUES),
  fontWeight: oneOf(FONT_WEIGHT_VALUES),
  maxLines: greaterThanZero,
  objectFit: oneOf(OBJECT_FIT_VALUES),
  objectPositionX: value => ObjectPosition.create(value, true),
  objectPositionY: value => ObjectPosition.create(value, false),
  rotate: number,
  tintColor: parseColor,
  textOverflow: oneOf(TEXT_OVERFLOW_VALUES),
  textAlign: oneOf(TEXT_ALIGN_VALUES)
}
