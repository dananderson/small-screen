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
import {
  BACKGROUND_CLIP_BORDER_BOX, BACKGROUND_CLIP_PADDING_BOX,
  HINT_ANIMATED_PROPERTIES,
  HINT_HAS_BORDER,
  HINT_HAS_BORDER_RADIUS,
  HINT_HAS_PADDING,
  HINT_LAYOUT_ONLY,
  OBJECT_FIT_CONTAIN, OBJECT_FIT_COVER, OBJECT_FIT_FILL, OBJECT_FIT_NONE, OBJECT_FIT_SCALE_DOWN,
  TEXT_ALIGN_CENTER, TEXT_ALIGN_LEFT, TEXT_ALIGN_RIGHT,
  TEXT_OVERFLOW_CLIP, TEXT_OVERFLOW_ELLIPSIS,
  TEXT_OVERFLOW_NONE, TEXT_TRANSFORM_LOWERCASE, TEXT_TRANSFORM_NONE, TEXT_TRANSFORM_UPPERCASE
} from './Constants'

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

Style.prototype = {
  [HINT_LAYOUT_ONLY]: true,
  [HINT_HAS_BORDER]: false,
  [HINT_HAS_PADDING]: false,
  [HINT_HAS_BORDER_RADIUS]: false,
  [HINT_ANIMATED_PROPERTIES]: undefined
}

Style.EMPTY = new Style()
Style.rgb = rgb
Style.rgba = rgba

const FONT_WEIGHT_VALUES = new Set(['normal', 'bold'])

const FONT_STYLE_VALUES = new Set(['normal', 'italic'])

const TEXT_OVERFLOW_VALUES = new Map([
  [ 'none', TEXT_OVERFLOW_NONE ],
  [ 'clip', TEXT_OVERFLOW_CLIP ],
  [ 'ellipsis', TEXT_OVERFLOW_ELLIPSIS ]
])

const TEXT_ALIGN_VALUES = new Map([
  [ 'left', TEXT_ALIGN_LEFT ],
  [ 'center', TEXT_ALIGN_CENTER ],
  [ 'right', TEXT_ALIGN_RIGHT ]
])

const OBJECT_FIT_VALUES = new Map([
  [ 'fill', OBJECT_FIT_FILL ],
  [ 'contain', OBJECT_FIT_CONTAIN ],
  [ 'cover', OBJECT_FIT_COVER ],
  [ 'none', OBJECT_FIT_NONE ],
  [ 'scale-down', OBJECT_FIT_SCALE_DOWN ]
])

const BACKGROUND_CLIP_VALUES = new Map([
  [ 'border-box', BACKGROUND_CLIP_BORDER_BOX ],
  [ 'padding-box', BACKGROUND_CLIP_PADDING_BOX ]
])

const TEXT_TRANSFORM_VALUES = new Map([
  [ 'none', TEXT_TRANSFORM_NONE ],
  [ 'uppercase', TEXT_TRANSFORM_UPPERCASE ],
  [ 'lowercase', TEXT_TRANSFORM_LOWERCASE ]
])

const greaterThanZero = (value) => value > 0 && Number.isInteger(value) ? value : undefined
const number = value => typeof value === 'number' && !isNaN(value) ? value : undefined
const string = value => typeof value === 'string' ? value : undefined

function oneOf (values) {
  return value => values.has(value) ? value : undefined
}

function toEnum (values) {
  return value => values.get(value) || 0
}

const ARRAY = [ Style.EMPTY ]
const VALIDATE_PROPERTY = {
  // Yoga style properties are validated when bound to view.

  backgroundColor: parseColor,
  backgroundClip: toEnum(BACKGROUND_CLIP_VALUES),
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
  objectFit: toEnum(OBJECT_FIT_VALUES),
  objectPositionX: value => ObjectPosition.create(value, true),
  objectPositionY: value => ObjectPosition.create(value, false),
  rotate: number,
  tintColor: parseColor,
  textOverflow: toEnum(TEXT_OVERFLOW_VALUES),
  textAlign: toEnum(TEXT_ALIGN_VALUES),
  textTransform: toEnum(TEXT_TRANSFORM_VALUES)
}
