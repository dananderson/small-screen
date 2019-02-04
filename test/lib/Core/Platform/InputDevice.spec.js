/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { InputDevice } from '../../../../lib/Core/Platform/InputDevice'

const UUID = '5e952a86-b8c9-4fef-a4ad-2fd507749a7a'

describe('InputDevice', () => {
  describe('constructor()', () => {
    it('should create a new InputDevice object', () => {
      const device = new InputDevice(UUID)

      assert.equal(device.uuid, UUID)
      assert.isTrue(device.connected)
      assert.isFalse(device.isKeyboard)
      assert.isFalse(device.isGamepad)
    })
    it('should throw error when passed an invalid UUID', () => {
      assert.throws(() => new InputDevice(undefined))
      assert.throws(() => new InputDevice(''))
      assert.throws(() => new InputDevice('garbage'))
      assert.throws(() => new InputDevice(UUID.toUpperCase()))
    })
  })
  describe('getDefaultMapping()', () => {
    it('should return undefined', () => {
      assert.isUndefined((new InputDevice(UUID)).getDefaultMapping())
    })
  })
  describe('_close()', () => {
    it('should set connected to false', () => {
      const device = new InputDevice(UUID)

      device._close()
      assert.isFalse(device.connected)
    })
  })
})
