/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Style, HINT_HAS_BORDER_RADIUS } from '../../../../lib/Core/Style/Style'
import { ObjectPosition } from '../../../../lib/Core/Style'
import { TYPE_BOTTOM, TYPE_PERCENT, TYPE_POINT, TYPE_RIGHT } from '../../../../lib/Core/Style/ObjectPosition'

chai.use(chaiAsPromised)

describe('Style()', () => {
  describe('colors', () => {
    it('should parse all colors properties', () => {
      const style = Style({
        color: '#000',
        backgroundColor: '#000',
        borderColor: '#000',
        tintColor: '#000'
      })

      assert.equal(style.color, 0)
      assert.equal(style.backgroundColor, 0)
      assert.equal(style.borderColor, 0)
      assert.equal(style.tintColor, 0)
    })
    it('should parse rgba', () => {
      [ '#FFFFFFFF', '#FFFF' ].forEach(color => {
        const style = Style({ color })

        assert.equal(style.color >>> 0, 0xFFFFFFFF)
        assert.isAbove(style.color, 0xFFFFFFFF) // check rgba flag in 33rd bit
      })
    })
    it('should parse named color', () => {
      const style = Style({ color: 'dodgerblue' })

      assert.equal(style.color, 0x1E90FF)
    })
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

      assert.isUndefined(style.borderRadius)
      assert.equal(style.borderRadiusTopLeft, 10)
      assert.isTrue(style[HINT_HAS_BORDER_RADIUS])
    })
    it('should should set undefined for invalid input', () => {
      const style = Style({ borderRadiusTopLeft: 'invalid' })
      assert.isUndefined(style.borderRadiusTopLeft)
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

      assert.deepEqual(style.objectPositionX, new ObjectPosition(TYPE_POINT, 3))
      assert.deepEqual(style.objectPositionY, new ObjectPosition(TYPE_POINT, 5))
    })
    it('should set objectPosition with string %', () => {
      const style = Style({
        objectPositionX: '30%',
        objectPositionY: '50%'
      })

      assert.equal(style.objectPositionX.type, TYPE_PERCENT)
      assert.approximately(style.objectPositionX.value, 0.30, 0.01)

      assert.equal(style.objectPositionY.type, TYPE_PERCENT)
      assert.approximately(style.objectPositionY.value, 0.50, 0.01)
    })
    it('should set objectPosition with left', () => {
      const style = Style({
        objectPositionX: 'left'
      })

      assert.deepEqual(style.objectPositionX, new ObjectPosition(TYPE_POINT, 0))
    })
    it('should set objectPosition with right', () => {
      const style = Style({
        objectPositionX: 'right'
      })

      assert.deepEqual(style.objectPositionX, new ObjectPosition(TYPE_RIGHT))
    })
    it('should set objectPosition with top', () => {
      const style = Style({
        objectPositionY: 'top'
      })

      assert.deepEqual(style.objectPositionY, new ObjectPosition(TYPE_POINT, 0))
    })
    it('should set objectPosition with bottom', () => {
      const style = Style({
        objectPositionY: 'bottom'
      })

      assert.deepEqual(style.objectPositionY, new ObjectPosition(TYPE_BOTTOM))
    })
    it('should set undefined for invalid values', () => {
      assert.isUndefined(Style({ objectPositionX: {} }).objectPositionX)
      assert.isUndefined(Style({ objectPositionX: {} }).objectPositionX)
      assert.isUndefined(Style({ objectPositionX: '' }).objectPositionX)
      assert.isUndefined(Style({ objectPositionX: null }).objectPositionX)
      assert.isUndefined(Style({ objectPositionX: NaN }).objectPositionX)
      assert.isUndefined(Style({ objectPositionX: '%' }).objectPositionX)
      assert.isUndefined(Style({ objectPositionX: 'top' }).objectPositionX)
      assert.isUndefined(Style({ objectPositionX: 'bottom' }).objectPositionX)
      assert.isUndefined(Style({ objectPositionY: 'left' }).objectPositionY)
      assert.isUndefined(Style({ objectPositionY: 'right' }).objectPositionY)
    })
  })
})
