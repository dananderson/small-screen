/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Style, HINT_HAS_BORDER_RADIUS } from '../../../../lib/Core/Style/Style'
import { UNIT_PERCENT, UNIT_POINT } from '../../../../lib/Core/Util/Yoga'

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
  describe('objectPosition', () => {
    it('should set objectPosition with number', () => {
      const style = Style({
        objectPositionX: 3,
        objectPositionY: 5
      })

      assert.equal(style.objectPositionX.unit, UNIT_POINT)
      assert.equal(style.objectPositionX.value, 3)

      assert.equal(style.objectPositionY.unit, UNIT_POINT)
      assert.equal(style.objectPositionY.value, 5)
    })
    it('should set objectPosition with string number', () => {
      let style = Style({
        objectPositionX: '3',
        objectPositionY: '5'
      })

      assert.equal(style.objectPositionX.unit, UNIT_POINT)
      assert.equal(style.objectPositionX.value, 3)

      assert.equal(style.objectPositionY.unit, UNIT_POINT)
      assert.equal(style.objectPositionY.value, 5)

      style = Style({
        objectPositionX: '3.3',
        objectPositionY: '5.5'
      })

      assert.equal(style.objectPositionX.unit, UNIT_POINT)
      assert.approximately(style.objectPositionX.value, 3.3, 0.01)

      assert.equal(style.objectPositionY.unit, UNIT_POINT)
      assert.approximately(style.objectPositionY.value, 5.5, 0.01)
    })
    it('should set objectPosition with string %', () => {
      const style = Style({
        objectPositionX: '30%',
        objectPositionY: '50%'
      })

      assert.equal(style.objectPositionX.unit, UNIT_PERCENT)
      assert.approximately(style.objectPositionX.value, 0.30, 0.01)

      assert.equal(style.objectPositionY.unit, UNIT_PERCENT)
      assert.approximately(style.objectPositionY.value, 0.50, 0.01)
    })
    it('should set objectPosition with left', () => {
      const style = Style({
        objectPositionX: 'left'
      })

      assert.equal(style.objectPositionX.unit, UNIT_POINT)
      assert.equal(style.objectPositionX.value, 0)
    })
    it('should set objectPosition with right', () => {
      const style = Style({
        objectPositionX: 'right'
      })

      assert.equal(style.objectPositionX, 'right')
    })
    it('should set objectPosition with top', () => {
      const style = Style({
        objectPositionY: 'top'
      })

      assert.equal(style.objectPositionY.unit, UNIT_POINT)
      assert.equal(style.objectPositionY.value, 0)
    })
    it('should set objectPosition with bottom', () => {
      const style = Style({
        objectPositionY: 'bottom'
      })

      assert.equal(style.objectPositionY, 'bottom')
    })
    it('should throw Error for invalid values', () => {
      assert.throws(() => Style({ objectPositionX: {} }))
      assert.throws(() => Style({ objectPositionX: '' }))
      assert.throws(() => Style({ objectPositionX: null }))
      assert.throws(() => Style({ objectPositionX: NaN }))
      assert.throws(() => Style({ objectPositionX: '%' }))
      assert.throws(() => Style({ objectPositionX: 'top' }))
      assert.throws(() => Style({ objectPositionX: 'bottom' }))
      assert.throws(() => Style({ objectPositionY: 'left' }))
      assert.throws(() => Style({ objectPositionY: 'right' }))
    })
  })
})
