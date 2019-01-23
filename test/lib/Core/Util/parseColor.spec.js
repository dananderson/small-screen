/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { parseColor } from '../../../../lib/Core/Style/parseColor'

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
  it('should return integer color value', () => {
    assert.deepEqual(parseColor(0xFFFFFF), 0xFFFFFF)
  })
  it('should throw Error for invalid color string', () => {
    assert.throws(() => parseColor('invalid'))
    assert.throws(() => parseColor('#ff'))
    assert.throws(() => parseColor('#fffffff'))
    assert.throws(() => parseColor('ffffff'))
  })
})
