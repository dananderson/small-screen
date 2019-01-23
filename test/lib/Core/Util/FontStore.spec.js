/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { FontStore } from '../../../../lib/Core/Util/small-screen-lib'

const TTF = 'test/resources/OpenSans-Regular.ttf'
const FAMILY = 'Open Sans'
const STYLE = 'italic'
const WEIGHT = 'bold'

describe('FontStore', () => {
  describe('install()', () => {
    it('should install TTF font', () => {
      FontStore.install(TTF, FAMILY, STYLE, WEIGHT)
    })
    it('should throw error when font family arg is not a string', () => {
      assert.throws(() => FontStore.install(TTF, undefined, STYLE, WEIGHT))
    })
    it('should throw error when font style arg is invalid', () => {
      assert.throws(() => FontStore.install(TTF, undefined, 'not a valid style', WEIGHT))
    })
    it('should throw error when font weight arg is invalid', () => {
      assert.throws(() => FontStore.install(TTF, undefined, STYLE, 'not a valid weight'))
    })
    it('should throw error when file not found', () => {
      assert.throws(() => FontStore.install('unknown.ttf', FAMILY, STYLE, WEIGHT))
    })
  })
  describe('sample()', () => {
    it('should create a font sample of size 12', () => {
      FontStore.install(TTF, FAMILY, STYLE, WEIGHT)
      const sample = FontStore.sample(FAMILY, STYLE, WEIGHT, 12)

      assert.exists(sample)
    })
  })
  afterEach(() => {
    FontStore.uninstall(FAMILY, STYLE, WEIGHT)
  })
})
