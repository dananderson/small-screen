/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { rgba } from '../../../../lib/Core/Style/rgba'

describe('rgba()', () => {
  it('should create 32-bit color value', () => {
    const value = rgba(0xAA, 0xBB, 0xCC, 0xDD)

    assert.equal(value >>> 0, 0xDDAABBCC)
    // Check for 0x100000000
    assert.isAbove(value, 0xFFFFFFFF)
  })
})
