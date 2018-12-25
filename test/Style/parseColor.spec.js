/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { parseColor } from '../../lib/Style/parseColor'

chai.use(chaiAsPromised)

describe('parseColor()', () => {
  it('should parse color keyword value', () => {
    assert.deepEqual(parseColor('black'), 0)
  })
  it('should parse short hex color value', () => {
    assert.deepEqual(parseColor('#fff'), 0xFFFFFF)
  })
  it('should parse hex color value', () => {
    assert.deepEqual(parseColor('#ffffff'), 0xFFFFFF)
  })
  it('should return undefined for unsupported color keyword', () => {
    assert.throws(() => parseColor('invalid'))
  })
})
