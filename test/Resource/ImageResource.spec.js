/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { ImageResource } from '../../lib/Resource/ImageResource'
import { Resource } from '../../lib/Resource/Resource'
import sinon from 'sinon'
import { StubGraphicsDevice } from '../Mock/StubGraphicsDevice'
import { Image } from '../../lib/Resource/Image'

chai.use(chaiAsPromised)

describe('ImageResource', () => {
  describe('_load()', () => {
    it('should put the resource in the LOADED state with a valid image file', () => {
      const graphicsDevice = StubGraphicsDevice.createStubInstance()
      const image = new ImageResource('test/resources/one.png')

      return assert.isFulfilled(image._load({ graphicsDevice })
        .then(() => {
          assert.equal(image._getState(), Resource.LOADING)
          assert.isNotNull(image._pixels)
          assert.isUndefined(image.texture)
        }))
    })
    it('should put the resource in the FAILED state with file not found', () => {
      const graphicsDevice = StubGraphicsDevice.createStubInstance()
      const image = new ImageResource('file-does-not-exist')

      return assert.isRejected(image._load({ graphicsDevice }))
    })
  })
  describe('_attach()', () => {
    it('should put resource in the ATTACHED state with texture set', () => {
      const graphicsDevice = StubGraphicsDevice.createStubInstance()
      const image = new ImageResource('test/resources/one.png')

      graphicsDevice.createTexture.withArgs(sinon.match.instanceOf(Image))
        .returns('texture')

      return image._load({ graphicsDevice })
        .then(() => {
          image._attach({ graphicsDevice })
          assert.equal(image._getState(), Resource.ATTACHED)
          assert.isNotNull(image._image)
          assert.equal(image.texture, 'texture')
          sinon.assert.calledOnce(graphicsDevice.createTexture)
        })
    })
  })
  describe('_detach()', () => {
    it('should put resource in the DETACHED state with texture cleared', () => {
      const graphicsDevice = StubGraphicsDevice.createStubInstance()
      const image = new ImageResource('test/resources/one.png')

      graphicsDevice.createTexture.withArgs(sinon.match.instanceOf(Image))
        .returns('texture')
      graphicsDevice.destroyTexture.withArgs('texture')

      return image._load({ graphicsDevice })
        .then(() => {
          image._attach({ graphicsDevice })
          image._detach({ graphicsDevice })
          assert.equal(image._getState(), Resource.DETACHED)
          assert.isUndefined(image._image)
          assert.isUndefined(image.texture)
          sinon.assert.calledOnce(graphicsDevice.destroyTexture)
        })
    })
  })
})
