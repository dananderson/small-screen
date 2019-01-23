/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export class FastEventEmitter {
  constructor () {
    this._events = {}
    this._deferred = {}
    this._emitting = false
  }

  on (event, listener) {
    let events

    if (this._emitting) {
      if (!this._deferred) {
        this._deferred = {}
      }
      events = this._deferred
    } else {
      events = this._events
    }

    let listeners = events[event]

    if (!listeners) {
      events[event] = (listeners = new Set())
    }

    listeners.add(listener)
  }

  once (event, listener) {
    const l = (...args) => {
      this.off(event, l)
      listener(...args)
    }

    this.on(event, l)
  }

  off (event, listener) {
    const events = this._events
    let listeners = events[event]

    if (listeners) {
      listeners.delete(listener)
    }
  }

  emit (event, ...args) {
    const events = this._events
    let listeners = events[event]

    if (listeners) {
      this._emitting = true
      try {
        for (const listener of listeners) {
          listener(...args)
        }
      } finally {
        this._emitting = false
        if (this._deferred) {
          merge(events, this._deferred)
          this._deferred = undefined
        }
      }
    }
  }
}

function merge (events, deferred) {
  for (const event in deferred) {
    const target = events[event]

    if (target) {
      for (const listener of deferred[event]) {
        target.add(listener)
      }
    } else {
      events[event] = deferred[event]
    }
  }
}
