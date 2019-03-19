/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { rgb } from '../../../../lib/Core/Style/rgb'

describe('rgb()', () => {
  it('should create 24-bit color value', () => {
    assert.equal(rgb(255, 255, 255), 0xFFFFFF)
  })
})
