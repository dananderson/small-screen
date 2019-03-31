/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export const TYPE_POINT = 0
export const TYPE_PERCENT = 1
export const TYPE_RIGHT = 2
export const TYPE_BOTTOM = 3

export class ObjectPosition {
  static create (value, isX) {
    const type = typeof value

    if (type === 'string') {
      if (value.endsWith('%')) {
        value = parseFloat(value) / 100

        if (!isNaN(value)) {
          return new ObjectPosition(TYPE_PERCENT, value)
        }
      } else if (isX) {
        if (value === 'left') {
          return ZERO
        } else if (value === 'right') {
          return RIGHT
        }
      } else {
        if (value === 'top') {
          return ZERO
        } else if (value === 'bottom') {
          return BOTTOM
        }
      }
    } else if (type === 'number' && !isNaN(value)) {
      return new ObjectPosition(TYPE_POINT, value)
    }
  }

  constructor (type, value) {
    this.type = type
    this.value = value
  }
}

let RIGHT = new ObjectPosition(TYPE_RIGHT)
let BOTTOM = new ObjectPosition(TYPE_BOTTOM)
let ZERO = new ObjectPosition(TYPE_POINT, 0)
