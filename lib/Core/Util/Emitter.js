/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export class Emitter {
  constructor () {
    this._listeners = new Set()
  }

  once (listener) {
    const l = (...args) => {
      this.off(l)
      listener(...args)
    }

    this.on(l)
  }

  on (listener) {
    this._listeners.add(listener)
  }

  off (listener) {
    this._listeners.delete(listener)
  }

  emit (...args) {
    for (const listener of this._listeners) {
      listener(...args)
    }
  }
}
