/*
 * Copyright (c) 2018 Daniel Anderson.
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
import { createInput } from '../Platform/Platform'
import { now } from '../Utilities/now'

export class InputManager {
  constructor (app) {
    this.lastActivity = now()

    this._app = app
    this._input = undefined
    this._enabled = true
    this._inputActivityListener = undefined
  }

  _attach () {
    // TODO: assert !_input
    this._input = createInput(this._app._options)
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
        this._app.emit(Event.KEY_UP, createKeyUpEvent(key))
      }
    }
  }

  _onKeyboardDown (keyCode, isRepeat) {
    if (!isRepeat) {
      this._app.emit(Event.RAW_KEYBOARD, createRawKeyboardEvent(keyCode))
    }

    this.lastActivity = now()

    if (this._enabled) {
      const key = this._input.keyboard.mapping.getKey(keyCode)

      if (key !== -1) {
        this._app.emit(Event.KEY_DOWN, createKeyDownEvent(key))
      }
    }

    this._inputActivityListener && !isRepeat && this._inputActivityListener()
  }

  _onJoystickButton (id, button, value) {
    this._app.emit(Event.RAW_JOYSTICK, createRawJoystickButton(id, button))
  }

  _onJoystickAxis (id, axis, value) {
    this._app.emit(Event.RAW_JOYSTICK, createRawJoystickAxis(id, axis, value))
  }

  _onJoystickHat (id, hat, value) {
    this._app.emit(Event.RAW_JOYSTICK, createRawJoystickHat(id, hat, value))
  }

  _onKeyUp (key) {
    this._enabled && this._app.emit(Event.KEY_UP, createKeyUpEvent(key))
  }

  _onKeyDown (key) {
    this.lastActivity = now()
    this._enabled && this._app.emit(Event.KEY_DOWN, createKeyDownEvent(key))
    this._inputActivityListener && this._inputActivityListener()
  }

  _onJoystickAdded (index) {
    this.lastActivity = now()
    const device = this._input.addInputDevice(index)

    if (device) {
      this._enabled && this._app.emit(Event.GAMEPAD_CONNECTED, createGamepadConnectedEvent(index, null))
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

/*
<inputAction type="onfinish">
  <command>/opt/retropie/supplementary/emulationstation/scripts/inputconfiguration.sh</command>
</inputAction>
*/

/*
<?xml version="1.0"?>
<inputList>
  <inputConfig type="joystick" deviceName="8Bitdo NES30 Pro" deviceGUID="05000000c82d00002038000000010000">
    <input name="a" type="button" id="0" value="1" />
    <input name="b" type="button" id="1" value="1" />
    <input name="down" type="hat" id="0" value="4" />
    <input name="hotkeyenable" type="button" id="10" value="1" />
    <input name="left" type="hat" id="0" value="8" />
    <input name="leftanalogdown" type="axis" id="1" value="1" />
    <input name="leftanalogleft" type="axis" id="0" value="-1" />
    <input name="leftanalogright" type="axis" id="0" value="1" />
    <input name="leftanalogup" type="axis" id="1" value="-1" />
    <input name="leftthumb" type="button" id="13" value="1" />
    <input name="right" type="hat" id="0" value="2" />
    <input name="rightanalogup" type="axis" id="3" value="1" />
    <input name="rightshoulder" type="button" id="7" value="1" />
    <input name="rightthumb" type="axis" id="3" value="-1" />
    <input name="select" type="button" id="10" value="1" />
    <input name="start" type="button" id="11" value="1" />
    <input name="up" type="hat" id="0" value="1" />
    <input name="x" type="button" id="3" value="1" />
    <input name="y" type="button" id="4" value="1" />
  </inputConfig>
</inputList>
*/
