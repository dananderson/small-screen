/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { DeviceEvent } from '../../../../lib/Core/Event/DeviceEvent'

const GAMEPAD = {}

describe('DeviceEvent', () => {
  describe('constructor()', () => {
    it('should create a new DeviceEvent object', () => {
      const event = new DeviceEvent('e')

      assert.equal(event.type, 'e')
      assert.isFalse(event.bubbles)
      assert.isFalse(event.cancelable)
      assert.notExists(event.device)
    })
  })
  describe('_reset()', () => {
    it('should reset the object with new gamepad', () => {
      const event = new DeviceEvent('e')
      const result = event._reset(GAMEPAD, 1)

      assert.strictEqual(result, event)
      assert.strictEqual(event.device, GAMEPAD)
      assert.equal(event.timestamp, 1)
      assert.isFalse(event.canceled)
    })
  })
})
