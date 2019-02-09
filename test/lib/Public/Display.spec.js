/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { testSetApplication } from '../../../lib/Public'
import { Display } from '../../../lib/Public/Display'
import sinon from 'sinon'

const WIDTH = 720
const HEIGHT = 480

describe('Display', () => {
  let app
  describe('getWidth()', () => {
    it('should return application width', () => {
      assert.equal(Display.getWidth(), WIDTH)
    })
  })
  describe('getHeight()', () => {
    it('should return application height', () => {
      assert.equal(Display.getHeight(), HEIGHT)
    })
  })
  describe('resize()', () => {
    it('should call window resize', () => {
      const options = { fullscreen: true }

      Display.resize(WIDTH, HEIGHT, options)

      sinon.assert.calledOnce(app.window.resize)
      sinon.assert.calledWith(app.window.resize, WIDTH, HEIGHT, options)
    })
  })
  describe('getDefaultResolution()', () => {
    it('should return default resolution', () => {
      assert.strictEqual(Display.getDefaultResolution(), app.window.caps.defaultResolution)
    })
  })
  describe('getDefaultResolution()', () => {
    it('should return default resolution', () => {
      assert.lengthOf(Display.getAvailableResolutions(), 1)
      assert.strictEqual(Display.getAvailableResolutions()[0], app.window.caps.availableResolutions[0])
    })
  })
  beforeEach(() => {
    testSetApplication(app = {
      window: {
        width: WIDTH,
        height: HEIGHT,
        resize: sinon.stub(),
        caps: {
          defaultResolution: {},
          availableResolutions: [ {} ]
        }
      }
    })
  })
  afterEach(() => {
    testSetApplication()
  })
})
