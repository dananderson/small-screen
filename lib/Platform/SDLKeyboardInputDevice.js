/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import KeyCode from '../Event/KeyCode'
import { Key } from '../Input/Key'
import { KeyMapping } from '../Input/KeyMapping'

export class SDLKeyboardInputDevice {
  constructor (SDL) {
    this.id = -1
    this.name = 'Keyboard'
    this.guid = 'keyboard'
    this.isGamepad = false
    this.isKeyboard = true
    this.mapping = new KeyMapping()

    this.mapping.setKey(Key.UP, KeyCode.KEY_UP)
    this.mapping.setKey(Key.DOWN, KeyCode.KEY_DOWN)
    this.mapping.setKey(Key.LEFT, KeyCode.KEY_LEFT)
    this.mapping.setKey(Key.RIGHT, KeyCode.KEY_RIGHT)
    this.mapping.setKey(Key.B, KeyCode.KEY_Z)
    this.mapping.setKey(Key.A, KeyCode.KEY_X)
    this.mapping.setKey(Key.X, KeyCode.KEY_S)
    this.mapping.setKey(Key.Y, KeyCode.KEY_A)
    this.mapping.setKey(Key.START, KeyCode.KEY_RETURN)
    this.mapping.setKey(Key.SELECT, KeyCode.KEY_RSHIFT)
    this.mapping.setKey(Key.L1, KeyCode.KEY_Q)
    this.mapping.setKey(Key.R1, KeyCode.KEY_W)
  }

  destroy () {

  }
}
