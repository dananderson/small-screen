/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { BitmapFontResource } from '../../lib/Resource/BitmapFontResource'
import { Resource } from '../../lib/Resource/Resource'
import sinon from 'sinon'
import { StubGraphicsDevice } from '../Mock/StubGraphicsDevice'
import { bufferEndianPatch } from '../../lib/Utilities/bufferEndianPatch'
import { Image } from '../../lib/Resource/Image'

bufferEndianPatch()
chai.use(chaiAsPromised)

describe('BitmapFontResource', () => {
  describe('_load()', () => {
    it('should put the resource in the LOADED state with a valid font file', () => {
      const graphicsDevice = StubGraphicsDevice.createStubInstance()
      const font = new BitmapFontResource('test/resources/open-sans-28.fnt')

      return assert.isFulfilled(font._load({ graphicsDevice })
        .then(() => {
          assert.equal(font._getState(), Resource.LOADING)
          assert.isNotNull(font._pixels)
          assert.isUndefined(font.textures)

          const metrics = font.metrics

          assert.equal(metrics.baseline, 30)
          assert.equal(metrics.family, 'Open Sans')
          assert.equal(metrics.glyphCount, 95)
          assert.equal(metrics.kerningCount, 107)
          assert.equal(metrics.lineHeight, 38)
          assert.equal(metrics.size, 28)
        }))
    })
    it('should put the resource in the FAILED state with file not found', () => {
      const graphicsDevice = StubGraphicsDevice.createStubInstance()
      const font = new BitmapFontResource('file-does-not-exist')

      return assert.isRejected(font._load({ graphicsDevice }))
    })
  })
  describe('_attach()', () => {
    it('should put resource in the ATTACHED state with textures set', () => {
      const graphicsDevice = StubGraphicsDevice.createStubInstance()
      const font = new BitmapFontResource('test/resources/open-sans-28.fnt')

      graphicsDevice.createTexture.withArgs(sinon.match.instanceOf(Image))
        .returns('texture')

      return font._load({ graphicsDevice })
        .then(() => {
          font._attach({ graphicsDevice })
          assert.equal(font._getState(), Resource.ATTACHED)
          assert.equal(font.textures.length, 1)
          assert.equal(font.textures[0], 'texture')
          font.metrics.glyph.forEach(glyph => assert.equal(glyph.texture, 'texture'))
          sinon.assert.calledOnce(graphicsDevice.createTexture)
        })
    })
  })
  describe('_detach()', () => {
    it('should put resource in the DETACHED state with textures cleared', () => {
      const graphicsDevice = StubGraphicsDevice.createStubInstance()
      const font = new BitmapFontResource('test/resources/open-sans-28.fnt')

      graphicsDevice.createTexture.withArgs(sinon.match.instanceOf(Image))
        .returns('texture')
      graphicsDevice.destroyTexture.withArgs('texture')

      return font._load({ graphicsDevice })
        .then(() => {
          font._attach({ graphicsDevice })
          font._detach({ graphicsDevice })
          assert.equal(font._getState(), Resource.DETACHED)
          assert.isUndefined(font.textures)
          assert.isUndefined(font._images)
          font.metrics.glyph.forEach(glyph => assert.isNotOk(glyph.texture))
          sinon.assert.calledOnce(graphicsDevice.destroyTexture)
        })
    })
  })
})
