/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import sinon from 'sinon'
import { Resource } from '../../../../lib/Core/Resource/Resource'
import { ImageResource } from '../../../../lib/Core/Resource/ImageResource'
import { SourceType } from '../../../../lib/Core/Util'
import { createGraphics } from '.'
import { isRejected } from '../../../isRejected'

describe('ImageResource', () => {
  let graphics

  describe('_load()', () => {
    it('should put the resource in the LOADED state with a valid image file', async () => {
      const image = new ImageResource({ uri: 'test/resources/one.png', type: SourceType.FILE })

      await image._load({ graphics })

      assert.equal(image._state, Resource.LOADED)
      assert.isTrue(image.hasDimensions)
      assert.equal(image.width, 1)
      assert.equal(image.height, 1)
      assert.isAbove(image.aspectRatio, 0)
      assert.isNotNull(image._image)
      assert.notExists(image.texture)
    })
    it('should put the resource in the ERROR state with file not found', async () => {
      const image = new ImageResource({ uri: 'file-does-not-exist', type: SourceType.FILE })

      await isRejected(image._load({ graphics }))
    })
  })
  describe('_attach()', () => {
    it('should put resource in the ATTACHED state with texture set', async () => {
      const image = new ImageResource({ uri: 'test/resources/one.png', type: SourceType.FILE })

      graphics.createTexture.returns('texture')
      await image._load({ graphics })

      image._attach({ graphics })
      assert.equal(image._state, Resource.ATTACHED)
      assert.notExists(image._image)
      assert.equal(image.texture, 'texture')
      sinon.assert.calledOnce(graphics.createTexture)
    })
  })
  describe('_detach()', () => {
    it('should put resource in the INIT state with texture cleared', async () => {
      const image = new ImageResource({ uri: 'test/resources/one.png', type: SourceType.FILE })

      graphics.createTexture.returns('texture')
      graphics.destroyTexture.withArgs('texture')
      await image._load({ graphics })

      image._attach({ graphics })
      assert.equal(image._state, Resource.ATTACHED)
      image._detach({ graphics })
      assert.equal(image._state, Resource.INIT)
      assert.notExists(image._image)
      assert.notExists(image.texture)
      sinon.assert.calledOnce(graphics.destroyTexture)
    })
  })
  beforeEach(() => {
    graphics = createGraphics()
  })
})
