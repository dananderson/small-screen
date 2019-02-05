/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { Input } from '../../../lib/Public/Input'
import { Keyboard } from '../../../lib/Core/Platform/Keyboard'
import { StandardMapping } from '../../../lib/Core/Input/StandardMapping'

const UUID = '03000000-5e04-0000-fd02-000003090000'

describe('Input', () => {
  let listener = event => {}

  describe('setEnabled()', () => {
    it('should turn on input events', () => {
      Input.setEnabled(true)

      assert.isTrue(Input.isEnabled())
    })
    it('should turn off input events', () => {
      Input.setEnabled(false)

      assert.isFalse(Input.isEnabled())
    })
  })
  describe('getGamepads()', () => {
    it('should return an array', () => {
      assert.isArray(Input.getGamepads())
    })
  })
  describe('getKeyboard()', () => {
    it('should return a Keyboard', () => {
      assert.instanceOf(Input.getKeyboard(), Keyboard)
    })
  })
  describe('addEventListener()', () => {
    it('should add an event listener', () => {
      Input.addEventListener(Input.Events.connected, listener)
    })
  })
  describe('removeEventListener()', () => {
    it('should remove an event listener', () => {
      Input.addEventListener(Input.Events.connected, listener)
      Input.removeEventListener(Input.Events.connected, listener)
    })
    it('should ignore non-function listener', () => {
      Input.removeEventListener(Input.Events.connected, undefined)
      Input.removeEventListener(Input.Events.connected, null)
      Input.removeEventListener(Input.Events.connected, '')
      Input.removeEventListener(Input.Events.connected, 'garbage')
    })
  })
  describe('setMapping()', () => {
    it('should set mapping', () => {
      const mapping = new StandardMapping([])

      Input.setMapping(UUID, mapping)

      assert.strictEqual(Input.getMapping(UUID), mapping)
    })
  })
  afterEach(() => {
    Input.setEnabled(true)
    Input.removeEventListener(Input.Events.connected, listener)
    Input.setMapping(UUID)
  })
})
