/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { testSetApplication } from '../../../lib/Public'
import { Display } from '../../../lib/Public/Display'

const WIDTH = 720
const HEIGHT = 480

describe('Display', () => {
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
  describe('isFullscreen()', () => {
    it('should return application fullscreen state', () => {
      assert.equal(Display.isFullscreen(), true)
    })
  })
  beforeEach(() => {
    testSetApplication({
      width: WIDTH,
      height: HEIGHT,
      fullscreen: true
    })
  })
  afterEach(() => {
    testSetApplication()
  })
})
