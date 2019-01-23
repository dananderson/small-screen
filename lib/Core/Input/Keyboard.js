/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import KeyCode from '../Event/KeyCode'
import { Key } from './Key'

export class Keyboard {
  constructor () {
    this._mapping = new Map([
      [KeyCode.KEY_UP, Key.UP],
      [KeyCode.KEY_DOWN, Key.DOWN],
      [KeyCode.KEY_LEFT, Key.LEFT],
      [KeyCode.KEY_RIGHT, Key.RIGHT],
      [KeyCode.KEY_Z, Key.B],
      [KeyCode.KEY_X, Key.A],
      [KeyCode.KEY_S, Key.X],
      [KeyCode.KEY_A, Key.Y],
      [KeyCode.KEY_RETURN, Key.START],
      [KeyCode.KEY_RSHIFT, Key.SELECT],
      [KeyCode.KEY_Q, Key.L1],
      [KeyCode.KEY_W, Key.R1]
    ])
  }

  // TODO: get/set mapping api
}
