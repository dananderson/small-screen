/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { Keyboard } from '../../../../lib/Core/Platform/Keyboard'
import KeyCode from '../../../../lib/Core/Input/KeyCode'
import { Mapping } from '../../../../lib/Core/Input/Mapping'

describe('Keyboard', () => {
  describe('constructor()', () => {
    it('should create a new Keyboard object', () => {
      const keyboard = new Keyboard()

      assert.equal(keyboard.uuid, '00000000-0000-0000-0000-000000000001')
      assert.isTrue(keyboard.connected)
      assert.isTrue(keyboard.isKeyboard)

      for (let i = 0; i < KeyCode.MAX_KEYS; i++) {
        assert.isFalse(keyboard.keys[i])
      }
    })
  })
  describe('_close()', () => {
    it('should close the input device', () => {
      const keyboard = new Keyboard()

      keyboard._close()
      assert.isFalse(keyboard.connected)
    })
  })
  describe('getDefaultMapping()', () => {
    it('should return an instance of KeyMapping', () => {
      const keyboard = new Keyboard()

      assert.instanceOf(keyboard.getDefaultMapping(), Mapping)
    })
  })
  describe('_resetKeys()', () => {
    it('should set all keys to false', () => {
      const keyboard = new Keyboard()

      keyboard.keys[KeyCode.KEY_BACKSPACE] = true
      keyboard._resetKeys()

      for (let i = 0; i < KeyCode.MAX_KEYS; i++) {
        assert.isFalse(keyboard.keys[i])
      }
    })
  })
})
