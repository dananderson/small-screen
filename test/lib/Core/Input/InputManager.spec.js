/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { Keyboard } from '../../../../lib/Core/Platform/Keyboard'
import { InputManager } from '../../../../lib/Core/Input/InputManager'
import { DeviceEvent } from '../../../../lib/Core/Event/DeviceEvent'
import { DeviceButtonEvent } from '../../../../lib/Core/Event/DeviceButtonEvent'
import { DeviceAxisEvent } from '../../../../lib/Core/Event/DeviceAxisEvent'
import { StandardMapping } from '../../../../lib/Core/Input/StandardMapping'

const TIMESTAMP = 100

describe('InputManager', () => {
  let window
  let inputManager
  let called
  describe('constructor()', () => {
    it('should create a new InputManager object', () => {
      inputManager = new InputManager(window)

      assert.lengthOf(inputManager.mappings, 2)
      assert.hasAllKeys(inputManager.mappings, [ window.keyboard.uuid, window.gamepadsById.get(0).uuid ])
    })
  })
  describe('attach()', () => {
    it('should update devices with default mappings', () => {
      inputManager.mappings.clear()
      inputManager.attach()

      assert.lengthOf(inputManager.mappings, 2)
      assert.hasAllKeys(inputManager.mappings, [ window.keyboard.uuid, window.gamepadsById.get(0).uuid ])
    })
  })
  describe('onDeviceConnected()', () => {
    it('should dispatch connected DeviceEvent', () => {
      const uuid = '57e42a1c-6ed2-477b-aa78-d0d3856973fc'

      inputManager.on(InputManager.Events.connected, event => {
        called = true
        assert.instanceOf(event, DeviceEvent)
        assert.strictEqual(event.device.uuid, uuid)
        assert.equal(event.timestamp, TIMESTAMP)
      })

      inputManager.onDeviceConnected(createMockGamepad(uuid), TIMESTAMP)
      assert.isTrue(called)
      assert.hasAnyKeys(inputManager.mappings, [ uuid ])
    })
  })
  describe('onDeviceDisconnected()', () => {
    it('should dispatch disconnected DeviceEvent', () => {
      inputManager.on(InputManager.Events.disconnected, event => {
        called = true
        assert.instanceOf(event, DeviceEvent)
        assert.strictEqual(event.device, window.gamepadsById.get(0))
        assert.equal(event.timestamp, TIMESTAMP)
      })

      inputManager.onDeviceDisconnected(window.gamepadsById.get(0), TIMESTAMP)
      assert.isTrue(called)
    })
  })
  describe('onDeviceKeyUp()', () => {
    it('should dispatch ButtonEvent for unmapped button', () => {
      inputManager.on(InputManager.Events.buttonup, event => {
        called = true
        assert.instanceOf(event, DeviceButtonEvent)
        assert.strictEqual(event.device, window.gamepadsById.get(0))
        assert.equal(event.button, 0)
        assert.isFalse(event.pressed)
        assert.isFalse(event.repeat)
        assert.equal(event.timestamp, TIMESTAMP)
      })

      inputManager.onDeviceKeyUp(window.gamepadsById.get(0), 0, TIMESTAMP)
      assert.isTrue(called)
    })
  })
  describe('onDeviceKeyDown()', () => {
    it('should dispatch ButtonEvent for unmapped button', () => {
      inputManager.on(InputManager.Events.buttondown, event => {
        called = true
        assert.instanceOf(event, DeviceButtonEvent)
        assert.strictEqual(event.device, window.gamepadsById.get(0))
        assert.equal(event.button, 0)
        assert.isTrue(event.pressed)
        assert.isTrue(event.repeat)
        assert.equal(event.timestamp, TIMESTAMP)
      })

      inputManager.onDeviceKeyDown(window.gamepadsById.get(0), 0, true, TIMESTAMP)
      assert.isTrue(called)
    })
  })
  describe('onDeviceMotion()', () => {
    it('should dispatch AxisEvent for unmapped axis', () => {
      inputManager.on(InputManager.Events.axismove, event => {
        called = true
        assert.instanceOf(event, DeviceAxisEvent)
        assert.strictEqual(event.device, window.gamepadsById.get(0))
        assert.equal(event.axis, 0)
        assert.equal(event.value, 1)
        assert.equal(event.timestamp, TIMESTAMP)
      })

      inputManager.onDeviceMotion(window.gamepadsById.get(0), 0, 1, TIMESTAMP)
      assert.isTrue(called)
    })
  })
  beforeEach(() => {
    inputManager = new InputManager(window = createMockWindow())
    called = false
  })
})

function createMockGamepad (uuid) {
  return {
    id: 0,
    uuid: uuid,
    axes: [],
    getDefaultMapping () {
      return new StandardMapping()
    },
    close () {

    }
  }
}

function createMockWindow () {
  const mockGamepad = createMockGamepad('cb93b9d3-b41d-46ee-a9d4-a1dbcff52e57')

  return {
    gamepadsById: new Map([[ mockGamepad.id, mockGamepad ]]),
    keyboard: new Keyboard()
  }
}
