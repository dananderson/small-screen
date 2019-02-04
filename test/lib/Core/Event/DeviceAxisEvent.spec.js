/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { DeviceAxisEvent } from '../../../../lib/Core/Event/DeviceAxisEvent'

const DEVICE = {}

describe('DeviceAxisEvent', () => {
  describe('constructor()', () => {
    it('should create a new DeviceAxisEvent object', () => {
      const event = new DeviceAxisEvent('e')

      assert.equal(event.type, 'e')
      assert.isFalse(event.cancelable)
      assert.isFalse(event.bubbles)
      assert.isFalse(event.canceled)
      assert.isNull(event.device)
      assert.equal(event.axis, -1)
      assert.equal(event.value, 0)
    })
  })
  describe('_reset()', () => {
    it('should reset the object with new axis values', () => {
      const event = new DeviceAxisEvent('e')
      const result = event._reset(DEVICE, 2, 1, 1)

      assert.strictEqual(result, event)
      assert.strictEqual(event.device, DEVICE)
      assert.equal(event.axis, 1)
      assert.equal(event.value, 1)
      assert.equal(event.timestamp, 2)
      assert.isFalse(event.canceled)
    })
  })
})
