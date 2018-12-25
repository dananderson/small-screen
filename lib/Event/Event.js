/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export class Event {
  static CLOSING = 'app:closing'
  static CLOSE_REQUEST = 'app:closerequest'
  static CLOSED = 'app:closed'
  static HEARTBEAT = 'app:heartbeat'

  // TODO: add KEY_UP and KEY_DOWN events

  static KEY_UP = 'keyup'
  static KEY_DOWN = 'keydown'

  static RAW_KEYBOARD = 'rawkeyboard'
  static RAW_JOYSTICK = 'rawjoystick'

  static GAMEPAD_CONNECTED = 'gamepad:connected'
  static GAMEPAD_DISCONNECTED = 'gamepad:disconnected'

  _stopPropagationRequested = false

  constructor (type) {
    this.type = type
  }

  stopPropagation () {
    this._stopPropagationRequested = true
  }
}
