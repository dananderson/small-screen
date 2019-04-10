/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { FontStore } from '../../../../lib/Core/Resource/FontStore'
import {
  FONT_STYLE_ITALIC,
  FONT_STYLE_NORMAL,
  FONT_WEIGHT_BOLD,
  FONT_WEIGHT_NORMAL
} from '../../../../lib/Core/Style/Constants'
import { isRejected } from '../../../isRejected'

const TTF = 'test/resources/OpenSans-Regular.ttf'
const FAMILY = 'Open Sans'

describe('FontStore', () => {
  describe('FontStore', () => {
    let fontStore
    describe('add()', () => {
      it('should...', async () => {
        await fontStore.add(TTF, FAMILY, 'italic', 'bold')
      })
      it('should throw Error for file not found', async () => {
        await isRejected(fontStore.add('invalid.ttf', FAMILY, 'normal', 'bold'))
      })
      it('should throw Error for invalid font family', async () => {
        await isRejected(fontStore.add(TTF, 3, 'normal', 'bold'))
      })
      it('should throw Error for invalid font style', async () => {
        await isRejected(fontStore.add(TTF, FAMILY, 'xxx', 'bold'))
      })
      it('should throw Error for invalid font weight', async () => {
        await isRejected(fontStore.add(TTF, FAMILY, 'normal', 'xxx'))
      })
    })
    describe('getSample()', () => {
      it('should create a new font sample', async () => {
        await fontStore.add(TTF, FAMILY, 'italic', 'bold')

        const sample = await fontStore.getSample(FAMILY, FONT_STYLE_ITALIC, FONT_WEIGHT_BOLD, 16)

        assert.equal(sample.family, FAMILY)
        assert.equal(sample.style, FONT_STYLE_ITALIC)
        assert.equal(sample.weight, FONT_WEIGHT_BOLD)
        assert.equal(sample.fontSize, 16)
        assert.equal(sample.status, 1)
      })
      it('should create a new font sample while font is loading', async () => {
        fontStore.add(TTF, FAMILY, 'italic', 'bold')

        const sample = await fontStore.getSample(FAMILY, FONT_STYLE_ITALIC, FONT_WEIGHT_BOLD, 16)

        assert.equal(sample.family, FAMILY)
        assert.equal(sample.style, FONT_STYLE_ITALIC)
        assert.equal(sample.weight, FONT_WEIGHT_BOLD)
        assert.equal(sample.fontSize, 16)
        assert.equal(sample.status, 1)
      })
      it('should return same font sample instance', async () => {
        await fontStore.add(TTF, FAMILY, 'italic', 'bold')

        const sampleA = await fontStore.getSample(FAMILY, FONT_STYLE_ITALIC, FONT_WEIGHT_BOLD, 16)
        const sampleB = await fontStore.getSample(FAMILY, FONT_STYLE_ITALIC, FONT_WEIGHT_BOLD, 16)

        assert.strictEqual(sampleB, sampleA)
      })
      it('should load when two sample creates are running in parallel', async () => {
        await fontStore.add(TTF, FAMILY, 'italic', 'bold')

        fontStore.getSample(FAMILY, FONT_STYLE_ITALIC, FONT_WEIGHT_BOLD, 16)
        const sample = await fontStore.getSample(FAMILY, FONT_STYLE_ITALIC, FONT_WEIGHT_BOLD, 16)

        assert.equal(sample.status, 1)
      })
      it('should load when two sample creates amd font load are running in parallel', async () => {
        fontStore.add(TTF, FAMILY, 'italic', 'bold')
        fontStore.getSample(FAMILY, FONT_STYLE_ITALIC, FONT_WEIGHT_BOLD, 16)

        const sample = await fontStore.getSample(FAMILY, FONT_STYLE_ITALIC, FONT_WEIGHT_BOLD, 16)

        assert.equal(sample.status, 1)
      })
      it('should throw Error when no family has not been loaded', async () => {
        await isRejected(fontStore.getSample(FAMILY, FONT_STYLE_ITALIC, FONT_WEIGHT_BOLD, 16))
      })
      it('should throw Error when no family is invalid', async () => {
        await fontStore.add(TTF, FAMILY, 'italic', 'bold')
        await isRejected(fontStore.getSample('not a font', FONT_STYLE_ITALIC, FONT_WEIGHT_BOLD, 16))
      })
      it('should throw Error when style does not match', async () => {
        await fontStore.add(TTF, FAMILY, 'italic', 'bold')
        await isRejected(fontStore.getSample(FAMILY, FONT_STYLE_NORMAL, FONT_WEIGHT_BOLD, 16))
      })
      it('should throw Error when weight does not match', async () => {
        await fontStore.add(TTF, FAMILY, 'italic', 'bold')
        await isRejected(fontStore.getSample(FAMILY, FONT_STYLE_NORMAL, FONT_WEIGHT_NORMAL, 16))
      })
    })
    beforeEach(() => {
      fontStore = new FontStore()
    })
    afterEach(() => {
      fontStore = null
    })
  })
})
