/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import KeyCode from '../Input/KeyCode'
import { StandardKey } from '../Input/StandardKey'
import { InputDevice } from './InputDevice'
import { StandardMapping } from '../Input/StandardMapping'

const KEYBOARD_UUID = '00000000-0000-0000-0000-000000000001'
const MAPPING = new StandardMapping([
  [ KeyCode.KEY_UP, StandardKey.UP ],
  [ KeyCode.KEY_DOWN, StandardKey.DOWN ],
  [ KeyCode.KEY_LEFT, StandardKey.LEFT ],
  [ KeyCode.KEY_RIGHT, StandardKey.RIGHT ],
  [ KeyCode.KEY_Z, StandardKey.B ],
  [ KeyCode.KEY_X, StandardKey.A ],
  [ KeyCode.KEY_S, StandardKey.X ],
  [ KeyCode.KEY_A, StandardKey.Y ],
  [ KeyCode.KEY_RETURN, StandardKey.START ],
  [ KeyCode.KEY_RSHIFT, StandardKey.SELECT ],
  [ KeyCode.KEY_Q, StandardKey.L1 ],
  [ KeyCode.KEY_W, StandardKey.R1 ]
])

/**
 * Keyboard input device.
 */
export class Keyboard extends InputDevice {
  /**
   * Construct a Keyboard object.
   */
  constructor () {
    super(KEYBOARD_UUID)

    /**
     * Snapshot of raw keyboard key state. The array is indexed by KeyCode values.
     *
     * @property {boolean[]}
     * @name Event#bubbles
     */
    Object.defineProperty(this, 'keys', {
      value: Array(KeyCode.MAX_KEYS).fill(false),
      writable: false
    })
  }

  /**
   * Get the default Mapping, in standard mapping format, for this Keyboard.
   *
   * @return {Mapping}
   */
  getDefaultMapping () {
    return MAPPING
  }

  get isKeyboard () {
    return true
  }

  _resetKeys () {
    this.keys.fill(false)
  }
}
