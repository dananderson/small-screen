/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { DeviceButtonEvent } from '../../../../lib/Core/Event/DeviceButtonEvent'

const DEVICE = {}

describe('DeviceButtonEvent', () => {
  describe('constructor()', () => {
    it('should create a new DeviceButtonEvent object', () => {
      const event = new DeviceButtonEvent('e')

      assert.equal(event.type, 'e')
      assert.isFalse(event.cancelable)
      assert.isFalse(event.bubbles)
      assert.isFalse(event.canceled)
      assert.isNull(event.device)
      assert.equal(event.button, -1)
      assert.isFalse(event.pressed)
      assert.isFalse(event.repeat)
    })
  })
  describe('_reset()', () => {
    it('should reset the object with new button values', () => {
      const event = new DeviceButtonEvent('e')
      const result = event._reset(DEVICE, 2, 1, true, true)

      assert.strictEqual(result, event)
      assert.strictEqual(event.device, DEVICE)
      assert.equal(event.button, 1)
      assert.isTrue(event.pressed)
      assert.isTrue(event.repeat)
      assert.equal(event.timestamp, 2)
      assert.isFalse(event.canceled)
    })
  })
})
