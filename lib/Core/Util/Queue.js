/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export class Queue {
  constructor (size) {
    // backing array. can grow beyond the initial size.
    this._list = new Array(Number.isInteger(size) ? size : 20)

    // dequeue offset, from the front of the backing array
    this._deqOffset = 0

    // enqueue offset, from the back of the backing array
    this._enqOffset = 0

    // Note: offsets are reset when the queue becomes empty on dequeue. If the queue never becomes empty,
    // the offsets will grow the array forever. The current queue users (image loading, resource manager, font
    // loading) will clear their queues, so this policy is ok. This policy was chosen to prevent copying or resizing
    // the backing array on enqueue() or dequeue().
  }

  get length () {
    return this._enqOffset - this._deqOffset
  }

  enqueue (value) {
    this._list[this._enqOffset++] = value
  }

  dequeue () {
    const { _enqOffset, _deqOffset, _list } = this

    if (_enqOffset - _deqOffset === 0) {
      return
    }

    const item = _list[_deqOffset]

    _list[_deqOffset] = undefined

    if (++this._deqOffset >= _enqOffset) {
      this._deqOffset = this._enqOffset = 0
    }

    return item
  }

  find (callback) {
    const { _deqOffset, _enqOffset, _list } = this

    for (let i = _deqOffset; i < _enqOffset; i++) {
      if (callback(_list[i])) {
        return _list[i]
      }
    }
  }

  clear () {
    this._list.fill(undefined, 0)
    this._deqOffset = 0
    this._enqOffset = 0
  }
}
