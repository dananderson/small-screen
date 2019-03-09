/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { FastEventEmitter } from '../Util'
import { KeyEvent } from '../Event/KeyEvent'
import { DeviceEvent } from '../Event/DeviceEvent'
import { DeviceButtonEvent } from '../Event/DeviceButtonEvent'
import { DeviceAxisEvent } from '../Event/DeviceAxisEvent'
import { StandardMapping } from './StandardMapping'

const DIRECTION = StandardMapping.DIRECTION

export class InputManager extends FastEventEmitter {
  static Events = {
    keyup: 'keyup',
    keydown: 'keydown',
    connected: 'connected',
    disconnected: 'disconnected',
    buttonup: 'buttonup',
    buttondown: 'buttondown',
    axismove: 'axismove'
  }

  constructor (window) {
    super()

    this.lastActivity = 0
    this.mappings = new Map()

    this._window = window
    this._enabled = true

    this.attach()
  }

  attach () {
    const { keyboard, gamepadsById } = this._window

    if (gamepadsById) {
      for (const gamepad of gamepadsById.values()) {
        this._updateMapping(gamepad)
      }
    }

    keyboard && this._updateMapping(keyboard)
  }

  detach () {

  }

  setEnabled (enabled) {
    this._enabled = enabled
  }

  isEnabled () {
    return this._enabled
  }

  onDeviceConnected (device, timestamp) {
    this.lastActivity = timestamp

    this._updateMapping(device)

    this.emit(gConnected.type, gConnected._reset(device, timestamp))
  }

  onDeviceDisconnected (device, timestamp) {
    this.lastActivity = timestamp

    this.emit(gDisconnected.type, gDisconnected._reset(device, timestamp))
  }

  onDeviceKeyUp (device, button, timestamp) {
    this.lastActivity = timestamp

    if (this._enabled) {
      const mapping = this.mappings.get(device.uuid)

      if (mapping) {
        const key = mapping.getKeyForButton(button);

        (key !== undefined) && this.emit(gKeyUp.type, gKeyUp._reset(device, timestamp, mapping, key, DIRECTION.get(key) || -1))
      }

      this.emit(gButtonUp.type, gButtonUp._reset(device, timestamp, button))
    }
  }

  onDeviceKeyDown (device, button, repeat, timestamp) {
    this.lastActivity = timestamp

    if (this._enabled) {
      const mapping = this.mappings.get(device.uuid)

      if (mapping) {
        const key = mapping.getKeyForButton(button);

        (key !== undefined) &&
          this.emit(gKeyDown.type, gKeyDown._reset(device, timestamp, mapping, key, DIRECTION.get(key) || -1, true, repeat))
      }

      this.emit(gButtonDown.type, gButtonDown._reset(device, timestamp, button, true, repeat))
    }
  }

  onDeviceMotion (device, axis, value, timestamp) {
    this.lastActivity = timestamp

    const enabled = this._enabled

    if (enabled) {
      const mapping = this.mappings.get(device.uuid)

      mapping && mapping.hasAxis(axis) && this._onDeviceMotionMapped(device, timestamp, mapping, axis, value, timestamp)
    }

    device.axes[axis] = value

    enabled && this.emit(gAxisMove.type, gAxisMove._reset(device, timestamp, axis, value))
  }

  _updateMapping (device) {
    const { uuid } = device
    const { mappings } = this

    if (!mappings.has(uuid)) {
      const mapping = device.getDefaultMapping()

      mapping && mappings.set(uuid, mapping)
    }
  }

  _onDeviceMotionMapped (device, timestamp, mapping, axis, value) {
    const useFullRange = mapping.getKeyForAxis(axis, 0) !== undefined
    const digitalValue = toDigital(value, useFullRange)
    const lastDigitalValue = toDigital(device.axes[axis], useFullRange)
    let key

    if (lastDigitalValue !== digitalValue) {
      if (digitalValue === 0 && lastDigitalValue !== 0) {
        key = mapping.getKeyForAxis(axis, useFullRange ? 0 : lastDigitalValue);

        (key !== undefined) && this.emit(gKeyUp.type, gKeyUp._reset(device, timestamp, mapping, key, DIRECTION.get(key) || -1))
      }

      if (digitalValue !== 0) {
        key = mapping.getKeyForAxis(axis, useFullRange ? 0 : digitalValue);
        (key !== undefined) && this.emit(gKeyDown.type, gKeyDown._reset(device, timestamp, mapping, key, DIRECTION.get(key) || -1, true, false))
      }
    }
  }
}

function toDigital (analogueValue, useFullRange) {
  const adjustedValue = useFullRange ? (analogueValue + 1) / 2 : analogueValue

  if (adjustedValue > 0.6) {
    return 1
  } else if (adjustedValue < -0.6) {
    return -1
  }

  return 0
}

const gKeyUp = new KeyEvent(InputManager.Events.keyup, true, true)
const gKeyDown = new KeyEvent(InputManager.Events.keydown, true, true)
const gButtonUp = new DeviceButtonEvent(InputManager.Events.buttonup)
const gButtonDown = new DeviceButtonEvent(InputManager.Events.buttondown)
const gAxisMove = new DeviceAxisEvent(InputManager.Events.axismove)
const gConnected = new DeviceEvent(InputManager.Events.connected)
const gDisconnected = new DeviceEvent(InputManager.Events.disconnected)
