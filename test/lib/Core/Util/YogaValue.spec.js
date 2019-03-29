/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { UNIT_AUTO, UNIT_POINT, UNIT_UNDEFINED, Value } from '../../../../lib/Core/Util/Yoga'

describe('Value', () => {
  describe('constructor', () => {
    it('should create a Value with unit and value', () => {
      const value = new Value(UNIT_POINT, 3)

      assert.equal(value.unit, UNIT_POINT)
      assert.equal(value.value, 3)
    })
    it('should create a UNIT_UNDEFINED Value with no parameters', () => {
      const value = new Value()

      assert.equal(value.unit, UNIT_UNDEFINED)
      assert.isUndefined(value.value)
    })
    it('should create unit only Values', () => {
      let value = new Value(UNIT_AUTO)

      assert.equal(value.unit, UNIT_AUTO)
      assert.isUndefined(value.value)

      value = new Value(UNIT_UNDEFINED)

      assert.equal(value.unit, UNIT_UNDEFINED)
      assert.isUndefined(value.value)
    })
  })
})
