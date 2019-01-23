/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Event } from '../Event/Event'
import { FastEventEmitter } from '../Util'
import { Keyboard } from './Keyboard'
import { performance } from 'perf_hooks'

const now = performance.now
const gKeyUpEvent = new Event(Event.KEY_UP)
const gKeyDownEvent = new Event(Event.KEY_DOWN)

export class InputManager extends FastEventEmitter {
  constructor (window) {
    super()

    this.lastActivity = now()
    this._window = window
    this._enabled = true
    this._inputActivityListener = undefined

    this._window.onKeyDown = this.onKeyDown.bind(this)
    this._window.onKeyUp = this.onKeyUp.bind(this)

    this._keyboard = new Keyboard()
  }

  attach () {

  }

  detach () {

  }

  enable () {
    this._enabled = true
  }

  disable () {
    this._enabled = false
  }

  gamepads () {
    // TODO: do not return the SDL gamepads..
    return this._window.gamepads
  }

  setInputActivityListener (listener) {
    this._inputActivityListener = listener
  }

  removeInputActivityListener () {
    this._inputActivityListener = undefined
  }

  onKeyUp (keyCode) {
    if (this._enabled) {
      const key = this._keyboard._mapping.get(keyCode)

      if (key >= 0) {
        gKeyUpEvent.key = key
        gKeyUpEvent._stopPropagationRequested = false

        this.emit(gKeyUpEvent.type, gKeyUpEvent)
      }
    }
    // TODO: emit raw
  }

  onKeyDown (keyCode, isRepeat) {
    if (this._enabled) {
      const key = this._keyboard._mapping.get(keyCode)

      if (key >= 0) {
        gKeyDownEvent.key = key
        gKeyDownEvent._stopPropagationRequested = false

        this.emit(gKeyDownEvent.type, gKeyDownEvent)
      }
    }
    // TODO: emit raw
  }

  onJoyUp (id, button) {
    // TODO: this.emit(Event.RAW_JOYSTICK, createRawJoystickButton(id, button))
  }

  onJoyDown (id, button) {
    // TODO: this.emit(Event.RAW_JOYSTICK, createRawJoystickAxis(id, axis, value))
  }

  onJoyHat (id, hat, value) {
    // TODO: this.emit(Event.RAW_JOYSTICK, createRawJoystickHat(id, hat, value))
  }

  onJoyAxis (id, axis, value) {
    // TODO: emit
  }

  onJoyConnected () {
    // TODO: emit
  }

  onJoyDisconnected () {
    // TODO: emit
  }
}
