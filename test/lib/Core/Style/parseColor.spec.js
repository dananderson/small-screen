/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { parseColor } from '../../../../lib/Core/Style/parseColor'

describe('parseColor()', () => {
  it('should parse 24-bit hex color', () => {
    assert.equal(parseColor('#FFFFFF'), 0xFFFFFF)
  })
  it('should parse 32-bit hex color', () => {
    const value = parseColor('#FFFFFFDD')

    assert.equal(value >>> 0, 0xDDFFFFFF)
    assert.isAbove(value, 0xFFFFFFFF)
  })
  it('should parse 24-bit short hex color', () => {
    assert.equal(parseColor('#FFF'), 0xFFFFFF)
  })
  it('should parse 32-bit short hex color', () => {
    const value = parseColor('#FFFD')

    assert.equal(value >>> 0, 0xDDFFFFFF)
    assert.isAbove(value, 0xFFFFFFFF)
  })
})
