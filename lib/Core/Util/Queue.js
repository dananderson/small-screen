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
    const { _list, _offset } = this

    if (_list.length === 0) {
      return
    }

    const item = _list[_offset]

    if (++this._offset * 2 >= _list.length) {
      this._list = _list.slice(this._offset)
      this._offset = 0
    }

    return item
  }

  find (callback) {
    const { _offset, _list } = this
    const len = _list.length

    for (let i = _offset; i < len; i++) {
      if (callback(_list[i])) {
        return _list[i]
      }
    }
  }

  clear () {
    this._list.length = 0
    this._offset = 0
  }
}
