/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export class Value {
  constructor (initial) {
    this._value = initial || 0
    this._listeners = new Set()
  }

  getValue () {
    return this._value
  }

  setValue (value) {
    this._value = value
    for (const listener of this._listeners) {
      listener(value)
    }
  }

  on (listener) {
    this._listeners.add(listener)
  }

  off (listener) {
    this._listeners.delete(listener)
  }
}
