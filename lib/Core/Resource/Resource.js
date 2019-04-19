/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { FastEventEmitter } from '../Util/FastEventEmitter'

const INIT = 0
const LOADING = 1
const LOADED = 2
const ATTACHED = 3
const ERROR = 4

let EVENT_NAMES = new Map([
  [ INIT, 'detached' ],
  [ ATTACHED, 'attached' ],
  [ ERROR, 'error' ],
  [ LOADED, 'loaded' ],
  [ ERROR, 'error' ]
])

export class Resource extends FastEventEmitter {
  static INIT = INIT
  static LOADING = LOADING
  static LOADED = LOADED
  static ATTACHED = ATTACHED
  static ERROR = ERROR

  constructor () {
    super()
    this._state = INIT
    this._ref = 0
  }

  get isAttached () {
    return this._state === ATTACHED
  }

  get hasError () {
    return this._state === ERROR
  }

  _transition (state, ...args) {
    const event = EVENT_NAMES.get(this._state = state)

    if (event) {
      this.emit(event, this, ...args)
    }
  }
}
