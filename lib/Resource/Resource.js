/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events'

export class Resource extends EventEmitter {
  static INIT = 1
  static LOADING = 2
  static ATTACHED = 3
  static DETACHED = 4
  static ERROR = 5

  constructor () {
    super()
    this._state = Resource.INIT
    this._ref = 0
  }

  get isAttached () {
    return this._state === Resource.ATTACHED
  }

  get hasError () {
    return this._state === Resource.ERROR
  }

  _load (devices) {

  }

  _attach (devices) {

  }

  _detach (devices) {

  }

  _destroy () {

  }

  _getState () {
    return this._state
  }

  _setState (state) {
    if (!TRANSITIONS.get(this._state)
      .has(state)) {
      throw Error(`Invalid state transition from ${stateToString(this._state)} to ${stateToString(state)}`)
    }

    this._state = state
  }
}

function stateToString (state) {
  for (const key in Object.keys(Resource)) {
    if (Resource[key] === state) {
      return key
    }
  }

  return 'INVALID'
}

const TRANSITIONS = new Map([
  [
    Resource.INIT,
    new Set([Resource.LOADING, Resource.ATTACHED, Resource.DETACHED, Resource.ERROR])
  ],
  [
    Resource.LOADING,
    new Set([Resource.ATTACHED, Resource.DETACHED, Resource.ERROR])
  ],
  [
    Resource.ATTACHED,
    new Set([Resource.DETACHED, Resource.ERROR, Resource.LOADING])
  ],
  [
    Resource.DETACHED,
    new Set([Resource.ATTACHED, Resource.ERROR, Resource.LOADING])
  ],
  [
    Resource.ERROR,
    new Set([])
  ]
])
