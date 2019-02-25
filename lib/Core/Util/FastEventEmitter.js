/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Fast implementation of the EventEmitter interface.
 *
 * This class removes some listener management overhead of the original EventEmitter by using a Set, rather than an
 * array for storing listeners.
 *
 * FastEventEmitter has similar behavior as EventEmitter, with the following exceptions: One, listeners will not be
 * emitted in the same order on each emit. Two, there is no special handling of the 'error' event.
 */
export class FastEventEmitter {
  constructor () {
    this._events = {}
    this._deferred = null
    this._deferCount = -1
  }

  on (event, listener) {
    // If currently emitting, add listener to the deferred event list.
    const events = this._deferCount !== -1 ? this._deferred || (this._deferCount++, this._deferred = {}) : this._events
    const listeners = events[event] || (events[event] = new Set())

    listeners.add(checkListener(listener))
  }

  once (event, listener) {
    checkListener(listener)

    const l = (...args) => {
      this.off(event, l)
      listener(...args)
    }

    this.on(event, l)
  }

  off (event, listener) {
    const listeners = this._events[event]

    if (listeners) {
      listeners.delete(listener)
    }

    if (this._deferCount !== -1) {
      this._deferred && (delete this._deferred[event])
    }
  }

  emit (event, ...args) {
    const events = this._events
    const listeners = events[event]

    if (listeners) {
      this._deferCount = 0
      try {
        for (const listener of listeners) {
          listener(...args)
        }
      } finally {
        // Any new listeners added during this emit will now be added to the listeners list. The listeners
        // are eligible to notified on the next emit for this event.
        (this._deferCount > 0) && merge(events, this._deferred)
        this._deferCount = -1
      }
    }
  }

  listenerCount (event) {
    const listeners = this._events[event]

    return listeners ? listeners.size : 0
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

function checkListener (listener) {
  if (typeof listener !== 'function') {
    throw Error(`listener argument must be a function, got ${listener}`)
  }

  return listener
}
