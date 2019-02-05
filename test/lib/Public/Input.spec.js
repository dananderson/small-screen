/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { Input } from '../../../lib/Public/Input'
import { Keyboard } from '../../../lib/Core/Platform/Keyboard'
import { StandardMapping } from '../../../lib/Core/Input/StandardMapping'
import { testSetApplication } from '../../../lib/Public'
import sinon from 'sinon'
import { InputManager } from '../../../lib/Core/Input/InputManager'
import { SDLWindow } from '../../../lib/Core/Platform/SDLWindow'

const UUID = '03000000-5e04-0000-fd02-000003090000'

describe('Input', () => {
  let listener = event => {}
  let app
  describe('setEnabled()', () => {
    it('should turn on input events', () => {
      Input.setEnabled(true)

      sinon.assert.calledOnce(app.input.setEnabled)
      sinon.assert.calledWith(app.input.setEnabled, true)
    })
    it('should turn off input events', () => {
      Input.setEnabled(false)

      sinon.assert.calledOnce(app.input.setEnabled)
      sinon.assert.calledWith(app.input.setEnabled, false)
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
  beforeEach(() => {
    testSetApplication(app = {
      input: sinon.createStubInstance(InputManager),
      window: sinon.createStubInstance(SDLWindow)
    })
    app.window.keyboard = sinon.createStubInstance(Keyboard)
    app.input.mappings = new Map()
  })
  afterEach(() => {
    testSetApplication()
  })
})
