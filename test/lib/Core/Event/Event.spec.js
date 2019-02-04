/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { Event } from '../../../../lib/Core/Event/Event'

describe('Event', () => {
  describe('constructor()', () => {
    it('should create a new Event object', () => {
      const event = new Event('e', true, true)

      assert.equal(event.type, 'e')
      assert.isTrue(event.cancelable)
      assert.isTrue(event.bubbles)
      assert.isFalse(event.canceled)
    })
    it('should throw Error when type is not a string', () => {
      assert.throws(() => new Event(3))
      assert.throws(() => new Event(null))
      assert.throws(() => new Event(undefined))
    })
  })
  describe('cancel()', () => {
    it('should set canceled to true', () => {
      const event = new Event('e', true, true)

      event.cancel()
      assert.isTrue(event.canceled)
    })
    it('should do nothing when cancelable is false', () => {
      const event = new Event('e', false, true)

      event.cancel()
      assert.isFalse(event.canceled)
    })
  })
  describe('_reset()', () => {
    it('should reset the object to default', () => {
      const event = new Event('e', true, true)

      event.cancel()
      assert.isTrue(event.canceled)

      const result = event._reset(1)

      assert.strictEqual(result, event)
      assert.isFalse(event.canceled)
      assert.equal(event.timestamp, 1)
    })
  })
})
