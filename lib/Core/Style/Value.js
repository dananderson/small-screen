/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events'

export class Value extends EventEmitter {
  static CHANGE = 'change'

  constructor (initial) {
    super()
    this._value = initial || 0
  }

  getValue() {
    return this._value
  }

  setValue(value) {
    this._value = value
    this.emit(Value.CHANGE, value)
  }
}
