/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import bindings from 'bindings'

const lib = bindings('small-screen-lib')

export const ALIGN_AUTO = 0
export const ALIGN_FLEX_START = 1
export const ALIGN_CENTER = 2
export const ALIGN_FLEX_END = 3
export const ALIGN_STRETCH = 4
export const ALIGN_BASELINE = 5
export const ALIGN_SPACE_BETWEEN = 6
export const ALIGN_SPACE_AROUND = 7

export const DIRECTION_INHERIT = 0
export const DIRECTION_LTR = 1
export const DIRECTION_RTL = 2

export const DISPLAY_FLEX = 0
export const DISPLAY_NONE = 1

export const EDGE_LEFT = 0
export const EDGE_TOP = 1
export const EDGE_RIGHT = 2
export const EDGE_BOTTOM = 3
export const EDGE_START = 4
export const EDGE_END = 5
export const EDGE_HORIZONTAL = 6
export const EDGE_VERTICAL = 7
export const EDGE_ALL = 8

export const FLEX_DIRECTION_COLUMN = 0
export const FLEX_DIRECTION_COLUMN_REVERSE = 1
export const FLEX_DIRECTION_ROW = 2
export const FLEX_DIRECTION_ROW_REVERSE = 3

export const JUSTIFY_FLEX_START = 0
export const JUSTIFY_CENTER = 1
export const JUSTIFY_FLEX_END = 2
export const JUSTIFY_SPACE_BETWEEN = 3
export const JUSTIFY_SPACE_AROUND = 4
export const JUSTIFY_SPACE_EVENLY = 5

export const MEASURE_MODE_UNDEFINED = 0
export const MEASURE_MODE_EXACTLY = 1
export const MEASURE_MODE_AT_MOST = 2

export const OVERFLOW_VISIBLE = 0
export const OVERFLOW_HIDDEN = 1
export const OVERFLOW_SCROLL = 2

export const POSITION_TYPE_RELATIVE = 0
export const POSITION_TYPE_ABSOLUTE = 1

export const UNIT_UNDEFINED = 0
export const UNIT_POINT = 1
export const UNIT_PERCENT = 2
export const UNIT_AUTO = 3

export const WRAP_NO_WRAP = 0
export const WRAP_WRAP = 1
export const WRAP_WRAP_REVERSE = 2

export const getInstanceCount = lib.Yoga.getInstanceCount

export const Value = lib.Yoga.Value

// Patch the Node class to support setting CSS-like values, such as 3, '3', '100% and Value objects. Consider moving
// these to the native code.

export class Node extends lib.Yoga.Node {
  setFlexBasis (value) {
    this._set(-1, value, super.setFlexBasis, this.setFlexBasisPercent)
  }

  setWidth (value) {
    this._set(-1, value, super.setWidth, this.setWidthPercent, this.setWidthAuto)
  }

  setHeight (value) {
    this._set(-1, value, super.setHeight, this.setHeightPercent, this.setHeightAuto)
  }

  setMinWidth (value) {
    this._set(-1, value, super.setMinWidth, this.setMinWidthPercent)
  }

  setMinHeight (value) {
    this._set(-1, value, super.setMinHeight, this.setMinHeightPercent)
  }

  setMaxWidth (value) {
    this._set(-1, value, super.setMaxWidth, this.setMaxWidthPercent)
  }

  setMaxHeight (value) {
    this._set(-1, value, super.setMaxHeight, this.setMaxHeightPercent)
  }

  setPosition (edge, value) {
    this._set(edge, value, super.setPosition, this.setPositionPercent)
  }

  setPadding (edge, value) {
    this._set(edge, value, super.setPadding, super.setPaddingPercent)
  }

  setMargin (edge, value) {
    this._set(edge, value, super.setMargin, this.setMarginPercent, this.setMarginAuto)
  }

  _set (edge, value, pointMethod, percentMethod, autoMethod) {
    let unit = -1

    if (value instanceof Value) {
      unit = value.unit
      value = value.value
    } else if (typeof value === 'number') {
      unit = UNIT_POINT
    } else if (value === 'auto') {
      unit = UNIT_AUTO
      if (!autoMethod) {
        throw Error(`auto is not valid for ${pointMethod.name}`)
      }
    } else if (typeof value === 'string') {
      const parsedValue = parseFloat(value)

      if (!isNaN(parsedValue)) {
        unit = value.endsWith('%') ? UNIT_PERCENT : UNIT_POINT
        value = parsedValue
      }
    }

    if (unit < 0) {
      throw Error(`${pointMethod.name} invalid style value: ${value}`)
    }

    switch (unit) {
      case UNIT_PERCENT:
        edge < 0 ? percentMethod.call(this, value) : percentMethod.call(this, edge, value)
        break
      case UNIT_POINT:
        edge < 0 ? pointMethod.call(this, value) : pointMethod.call(this, edge, value)
        break
      case UNIT_AUTO:
        edge < 0 ? autoMethod.call(this) : autoMethod.call(this, edge)
        break
    }
  }
}

// Patch in a factory method for Node objects.

Node.create = () => new Node()
