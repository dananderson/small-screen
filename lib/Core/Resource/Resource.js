/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { FastEventEmitter } from '../Util/FastEventEmitter'

export class Resource extends FastEventEmitter {
  static INIT = 0
  static LOADING = 1
  static LOADED = 2
  static ATTACHED = 3
  static ERROR = 4

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

  _transition (state, ...args) {
    const event = EVENT_NAMES.get(this._state = state)

    event && this.emit(event, this, ...args)
  }
}

const EVENT_NAMES = new Map([
  [ Resource.INIT, 'detached' ],
  [ Resource.ATTACHED, 'attached' ],
  [ Resource.ERROR, 'error' ],
  [ Resource.LOADED, 'loaded' ]
])
