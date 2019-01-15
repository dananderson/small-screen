/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import {
  createKeyUpEvent,
  createKeyDownEvent,
  createGamepadConnectedEvent,
  createGamepadDisconnectedEvent,
  createRawJoystickButton,
  createRawJoystickAxis,
  createRawJoystickHat,
  createRawKeyboardEvent
} from '../Event/EventFactory'
import { Event } from '../Event/Event'
import { factory } from '../Platform'
import { now } from '../Util'
import { EventEmitter } from 'events'

export class InputManager extends EventEmitter {
  constructor (options) {
    super()

    this.lastActivity = now()
    this._options = options
    this._input = undefined
    this._enabled = true
    this._inputActivityListener = undefined
  }

  _attach () {
    // TODO: assert !_input
    this._input = factory.createInput(this._options)
  }

  _detach () {
    this._input && this._input.destroy()
    this._input = undefined
  }

  enable () {
    this._enabled = true
  }

  disable () {
    this._enabled = false
  }

  devices () {
    return this._input.devices()
  }

  setInputActivityListener (listener) {
    this._inputActivityListener = listener
  }

  removeInputActivityListener () {
    this._inputActivityListener = undefined
  }

  _onKeyboardUp (keyCode) {
    if (this._enabled) {
      const key = this._input.keyboard.mapping.getKey(keyCode)

      if (key !== -1) {
        this.emit(Event.KEY_UP, createKeyUpEvent(key))
      }
    }
  }

  _onKeyboardDown (keyCode, isRepeat) {
    if (!isRepeat) {
      this.emit(Event.RAW_KEYBOARD, createRawKeyboardEvent(keyCode))
    }

    this.lastActivity = now()

    if (this._enabled) {
      const key = this._input.keyboard.mapping.getKey(keyCode)

      if (key !== -1) {
        this.emit(Event.KEY_DOWN, createKeyDownEvent(key))
      }
    }

    this._inputActivityListener && !isRepeat && this._inputActivityListener()
  }

  _onJoystickButton (id, button, value) {
    this.emit(Event.RAW_JOYSTICK, createRawJoystickButton(id, button))
  }

  _onJoystickAxis (id, axis, value) {
    this.emit(Event.RAW_JOYSTICK, createRawJoystickAxis(id, axis, value))
  }

  _onJoystickHat (id, hat, value) {
    this.emit(Event.RAW_JOYSTICK, createRawJoystickHat(id, hat, value))
  }

  _onKeyUp (key) {
    this._enabled && this.emit(Event.KEY_UP, createKeyUpEvent(key))
  }

  _onKeyDown (key) {
    this.lastActivity = now()
    this._enabled && this.emit(Event.KEY_DOWN, createKeyDownEvent(key))
    this._inputActivityListener && this._inputActivityListener()
  }

  _onJoystickAdded (index) {
    this.lastActivity = now()
    const device = this._input.addInputDevice(index)

    if (device) {
      this._enabled && this.emit(Event.GAMEPAD_CONNECTED, createGamepadConnectedEvent(index, null))
      this._inputActivityListener && this._inputActivityListener()
    }
  }

  _onJoystickRemoved (id) {
    this.lastActivity = now()
    this._input.removeInputDevice(id)
    this._enabled && this._app.emit(Event.GAMEPAD_CONNECTED, createGamepadDisconnectedEvent(id))
    this._inputActivityListener && this._inputActivityListener()
  }

  destroy () {
    this._detach()
    this._input = undefined
  }
}
