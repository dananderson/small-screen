/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { KeyEvent } from '../../../../lib/Core/Event/KeyEvent'
import { Direction } from '../../../../lib/Core/Views/Direction'
import { StandardKey } from '../../../../lib/Core/Input/StandardKey'
import { StandardMapping } from '../../../../lib/Core/Input/StandardMapping'

const DEVICE = {}
const MAPPING = new StandardMapping()

describe('KeyEvent', () => {
  describe('constructor()', () => {
    it('should create a new KeyEvent object', () => {
      const event = new KeyEvent('e', true, true)

      assert.equal(event.type, 'e')
      assert.isTrue(event.cancelable)
      assert.isTrue(event.bubbles)
      assert.isFalse(event.canceled)
      assert.isNull(event.device)
      assert.equal(event.direction, -1)
      assert.equal(event.key, -1)
      assert.isFalse(event.pressed)
      assert.isFalse(event.repeat)
      assert.isNull(event.mapping)
    })
  })
  describe('_reset()', () => {
    it('should reset the object with new values', () => {
      const event = new KeyEvent('e', true, true)
      const result = event._reset(DEVICE, 1, MAPPING, StandardKey.LS_LEFT, Direction.LEFT, true, true)

      assert.strictEqual(result, event)
      assert.strictEqual(event.device, DEVICE)
      assert.equal(event.direction, Direction.LEFT)
      assert.equal(event.key, StandardKey.LS_LEFT)
      assert.isTrue(event.pressed)
      assert.isTrue(event.repeat)
      assert.equal(event.timestamp, 1)
      assert.isFalse(event.canceled)
      assert.equal(event.mapping.name, StandardMapping.NAME)
    })
  })
})
