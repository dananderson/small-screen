/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export class FastEventEmitter {
  constructor () {
    this._events = new Map()
    this._deferred = new Map()
    this._emitting = false
  }

  on(event, listener) {
    const events = this._emitting ? this._deferred : this._events
    let listeners = events.get(event)

    if (!listeners) {
      events.set(event, listeners = new Set())
    }

    listeners.add(listener)
  }

  once(event, listener) {
    const l = (...args) => {
      this.off(event, l)
      listener(...args)
    }

    this.on(event, l)
  }

  off(event, listener) {
    const events = this._events
    let listeners = events[event]

    if (listeners) {
      listeners.delete(listener)
    }
  }

  emit(event, ...args) {
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
        merge(events, this._deferred)
      }
    }
  }
}

export class EventEmitterScope {
  constructor (emitter) {
    this._emitter = emitter
    this._captured = new Map()
  }

  on(event, listener) {
    let listeners = this._captured.get(event)

    if (!listeners) {
      this._captured.set(event, listeners = new Set())
    }

    listeners.add(listener)

    this._emitter.on(event, listener)
  }

  release() {
    const emitter = this._emitter

    for (const [event, listeners] of this._captured) {
      for (const listener of listeners) {
        emitter.off(event, listener)
      }
    }

    this._captured.clear()
  }
}

function merge(events, deferred) {
  for (const [event, listeners] of deferred) {
    const target = events.get(event)

    if (target) {
      for (const listener of listeners) {
        target.add(listener)
      }
    } else {
      events.set(event, listeners)
    }
  }
  deferred.clear()
}