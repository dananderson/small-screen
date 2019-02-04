/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { hatToButton } from '../../../../lib/Core/Platform/hatToButton'

const GAMEPAD = {
  _physicalButtonCount: 10
}

describe('hatToButton', () => {
  it('should convert hat to gamepad button value', () => {
    assert.equal(hatToButton(GAMEPAD, 0, 1), 10)
    assert.equal(hatToButton(GAMEPAD, 0, 2), 11)
    assert.equal(hatToButton(GAMEPAD, 0, 4), 12)
    assert.equal(hatToButton(GAMEPAD, 0, 8), 13)

    assert.equal(hatToButton(GAMEPAD, 1, 1), 14)
    assert.equal(hatToButton(GAMEPAD, 1, 2), 15)
    assert.equal(hatToButton(GAMEPAD, 1, 4), 16)
    assert.equal(hatToButton(GAMEPAD, 1, 8), 17)
  })
  it('should return -1 for invalid hat values', () => {
    assert.equal(hatToButton(GAMEPAD, 0, -1), -1)
    assert.equal(hatToButton(GAMEPAD, 0, 0), -1)
    assert.equal(hatToButton(GAMEPAD, 0, 3), -1)
    assert.equal(hatToButton(GAMEPAD, 0, 16), -1)
  })
})
