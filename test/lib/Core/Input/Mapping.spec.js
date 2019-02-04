/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { Mapping } from '../../../../lib/Core/Input/Mapping'
import { StandardKey } from '../../../../lib/Core/Input/StandardKey'
import { StandardMapping } from '../../../../lib/Core/Input/StandardMapping'

describe('Mapping', () => {
  describe('constructor()', () => {
    it('should create Mapping object from short button spec', () => {
      buttonTest(new Mapping(StandardMapping.NAME, [[ 3, StandardKey.HOME ]]))
    })
    it('should create Mapping object from full button spec', () => {
      buttonTest(new Mapping(StandardMapping.NAME, [[ Mapping.Type.BUTTON, 0, 3, StandardKey.HOME ]]))
    })
    it('should create Mapping object from short axis spec', () => {
      axisTest(new Mapping(StandardMapping.NAME, [[ 0, Mapping.Axis.POSITIVE, StandardKey.HOME ]]))
    })
    it('should create Mapping object from full axis spec', () => {
      axisTest(new Mapping(StandardMapping.NAME, [[ Mapping.Type.AXIS, 0, Mapping.Axis.POSITIVE, StandardKey.HOME ]]))
    })
    it('should create Mapping object from empty array', () => {
      const mapping = new Mapping(StandardMapping.NAME, [])

      assert.equal(mapping.name, StandardMapping.NAME)
    })
    it('should create Mapping object from undefined', () => {
      const mapping = new Mapping(StandardMapping.NAME)

      assert.equal(mapping.name, StandardMapping.NAME)
    })
    it('should throw Error when name is not a string', () => {
      assert.throws(() => new Mapping(undefined, [[ 3, StandardKey.HOME ]]))
      assert.throws(() => new Mapping(null, [[ 3, StandardKey.HOME ]]))
      assert.throws(() => new Mapping(3, [[ 3, StandardKey.HOME ]]))
      assert.throws(() => new Mapping('', [[ 3, StandardKey.HOME ]]))
    })
    it('should throw Error when entries is not an array', () => {
      assert.throws(() => new Mapping(StandardMapping.NAME, 'garbage'))
      assert.throws(() => new Mapping(StandardMapping.NAME, 3))
    })
    it('should throw Error when an entry is not an array', () => {
      assert.throws(() => new Mapping(StandardMapping.NAME, [[ null ]]))
      assert.throws(() => new Mapping(StandardMapping.NAME, [[ undefined ]]))
      assert.throws(() => new Mapping(StandardMapping.NAME, [[ '' ]]))
      assert.throws(() => new Mapping(StandardMapping.NAME, [[ 3 ]]))
    })
    it('should throw Error when an entry is not an array of length 2, 3 or 4', () => {
      assert.throws(() => new Mapping(StandardMapping.NAME, [[ Mapping.Type.BUTTON ]]))
      assert.throws(() => new Mapping(StandardMapping.NAME, [[ Mapping.Type.BUTTON, 0, 0, 0, 0 ]]))
    })
    it('should throw Error when an entry has an invalid type', () => {
      assert.throws(() => new Mapping(StandardMapping.NAME, [[ -1, 0, 0, StandardKey.HOME ]]))
    })
    it('should throw Error when the same axis is mapped to multiple keys', () => {
      const spec = [
        [ Mapping.Type.AXIS, 0, Mapping.Axis.POSITIVE, StandardKey.HOME ],
        [ Mapping.Type.AXIS, 0, Mapping.Axis.POSITIVE, StandardKey.SELECT ]
      ]
      assert.throws(() => new Mapping(StandardMapping.NAME, spec))
    })
    it('should throw Error when the same axis value is invalid', () => {
      assert.throws(() => new Mapping(StandardMapping.NAME, [[ Mapping.Type.AXIS, 0, 255, StandardKey.HOME ]]))
      assert.throws(() => new Mapping(StandardMapping.NAME, [[ Mapping.Type.AXIS, 0, null, StandardKey.HOME ]]))
      assert.throws(() => new Mapping(StandardMapping.NAME, [[ Mapping.Type.AXIS, 0, undefined, StandardKey.HOME ]]))
      assert.throws(() => new Mapping(StandardMapping.NAME, [[ Mapping.Type.AXIS, 0, '', StandardKey.HOME ]]))
    })
  })
})

function buttonTest (mapping) {
  assert.equal(mapping.name, StandardMapping.NAME)
  assert.equal(mapping.getKeyForButton(3), StandardKey.HOME)
  assert.equal(mapping.getKey(Mapping.Type.BUTTON, 0, 3), StandardKey.HOME)
}

function axisTest (mapping) {
  assert.equal(mapping.name, StandardMapping.NAME)
  assert.equal(mapping.getKeyForAxis(0, Mapping.Axis.POSITIVE), StandardKey.HOME)
  assert.equal(mapping.getKey(Mapping.Type.AXIS, 0, Mapping.Axis.POSITIVE), StandardKey.HOME)
  assert.isTrue(mapping.hasAxis(0))
}
