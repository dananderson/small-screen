/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Style, HINT_HAS_BORDER_RADIUS } from '../../../../lib/Core/Style/Style'

chai.use(chaiAsPromised)

describe('Style()', () => {
  it('should parse colors', () => {
    const style = Style({
      color: '#000',
      backgroundColor: '#000',
      borderColor: '#000'
    })

    assert.equal(style.color, 0)
    assert.equal(style.backgroundColor, 0)
    assert.equal(style.borderColor, 0)
  })
  describe('borderRadius', () => {
    it('should set borderRadius', () => {
      const style = Style({
        borderRadius: 10
      })

      assert.equal(style.borderRadius, 10)
      assert.isTrue(style[HINT_HAS_BORDER_RADIUS])
    })
    it('should set borderRadiusTopLeft', () => {
      const style = Style({
        borderRadiusTopLeft: 10
      })

      assert.equal(style.borderRadius, 0)
      assert.equal(style.borderRadiusTopLeft, 10)
      assert.isTrue(style[HINT_HAS_BORDER_RADIUS])
    })
    it('should should throw error for invalid borderRadius', () => {
      assert.throws(() => Style({ borderRadiusTopLeft: 'invalid' }))
    })
    it('should not set HINT_HAS_BORDER_RADIUS', () => {
      const style = Style({})

      assert.isFalse(style[HINT_HAS_BORDER_RADIUS])
    })
  })
})
