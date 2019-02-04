/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import sinon from 'sinon'
import { Gamepad } from '../../../../lib/Core/Platform/Gamepad'
import { createNativeGamepad } from './index'
import { toUUID } from '../../../../lib/Core/Platform/toUUID'
import { Mapping } from '../../../../lib/Core/Input/Mapping'

const GAME_CONTROLLER_MAPPING = '05000000a00500003232000008010000,8Bitdo Zero GamePad,a:b0,b:b1,back:b10,dpdown:+a1,dpleft:-a0,dpright:+a0,dpup:-a1,leftshoulder:b6,rightshoulder:b7,start:b11,x:b3,y:b4,platform:Linux,'
const GAME_CONTROLLER_GUID = '05000000a00500003232000008010000'

describe('Gamepad', () => {
  describe('constructor()', () => {
    it('should create a new Gamepad object', () => {
      const nativeGamepad = createNativeGamepad()
      const gamepad = new Gamepad(nativeGamepad)

      assert.equal(gamepad.id, nativeGamepad.getId())
      assert.equal(gamepad.uuid, toUUID(nativeGamepad.getGUID()))
      assert.equal(gamepad.name, nativeGamepad.getName())
      assert.equal(gamepad._physicalButtonCount, nativeGamepad.getButtonCount())
      assert.equal(gamepad.buttons.length, nativeGamepad.getButtonCount() + nativeGamepad.getHatCount() * 4)
      assert.equal(gamepad._hats.length, nativeGamepad.getHatCount())
      assert.equal(gamepad.axes.length, nativeGamepad.getAxisCount())
      assert.isTrue(gamepad.connected)
      assert.isTrue(gamepad.isGamepad)
    })
  })
  describe('getDefaultMapping()', () => {
    it('should return Mapping when native gamepad provides game controller mapping', () => {
      const nativeGamepad = createNativeGamepad()

      nativeGamepad.getGUID.returns(GAME_CONTROLLER_GUID)
      nativeGamepad.getGameControllerMapping.returns(GAME_CONTROLLER_MAPPING)
      nativeGamepad.getButtonCount.returns(12)
      nativeGamepad.getHatCount.returns(0)
      nativeGamepad.getAxisCount.returns(2)

      const gamepad = new Gamepad(nativeGamepad)

      assert.instanceOf(gamepad.getDefaultMapping(), Mapping)
    })
    it('should return undefined when native gamepad does not have game controller mapping', () => {
      const gamepad = new Gamepad(createNativeGamepad())

      assert.isUndefined(gamepad.getDefaultMapping())
    })
  })
  describe('_close()', () => {
    it('should close the native gamepad', () => {
      const nativeGamepad = createNativeGamepad()
      const gamepad = new Gamepad(nativeGamepad)

      gamepad._close()
      sinon.assert.calledOnce(nativeGamepad.close)
      assert.notExists(gamepad._nativeGamepad)
      assert.isFalse(gamepad.connected)
    })
    it('should be a no-op if already closed', () => {
      const nativeGamepad = createNativeGamepad()
      const gamepad = new Gamepad(nativeGamepad)

      gamepad._close()
      gamepad._close()
      sinon.assert.calledOnce(nativeGamepad.close)
    })
  })
})
