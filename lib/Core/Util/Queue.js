/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export class Queue {
  constructor () {
    this._list = []
    this._offset = 0
  }

  get length () {
    return this._list.length - this._offset
  }

  enqueue (value) {
    this._list.push(value)
  }

  dequeue () {
    if (this._list.length === 0) {
      return
    }

    const item = this._list[this._offset]

    if (++this._offset * 2 >= this._list.length) {
      this._list = this._list.slice(this._offset)
      this._offset = 0
    }

    return item
  }

  find (callback) {
    for (let i = this._offset; i < this._list.length; i++) {
      if (callback(this._list[i])) {
        return this._list[i]
      }
    }
  }

  clear () {
    this._list.length = 0
    this._offset = 0
  }
}
