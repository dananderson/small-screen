/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { Resource } from '../../../lib/Public/Resource'
import { testSetApplication } from '../../../lib/Public'
import sinon from 'sinon'
import { ResourceManager } from '../../../lib/Core/Resource/ResourceManager'

const IMAGES = [ 'one.png', 'two.png' ]
const SAMPLES = [ 'one.wav', 'two.wav' ]

describe('Resource', () => {
  let app
  describe('setResourcePath()', () => {
    it('should set the resource path', () => {
      Resource.setResourcePath('path')

      assert.equal(Resource.getResourcePath(), 'path')
    })
  })
  describe('addImage()', () => {
    it('should add an image', () => {
      Resource.addImage(IMAGES[0])

      sinon.assert.calledOnce(app.resource.addImage)
      sinon.assert.calledWith(app.resource.addImage, IMAGES[0])
    })
    it('should add an array of images', () => {
      Resource.addImage(IMAGES)

      sinon.assert.calledTwice(app.resource.addImage)
      sinon.assert.calledWith(app.resource.addImage, IMAGES[0])
      sinon.assert.calledWith(app.resource.addImage, IMAGES[1])
    })
  })
  describe('addSample()', () => {
    it('should add an audio sample', () => {
      Resource.addSample(SAMPLES[0])

      sinon.assert.calledOnce(app.resource.addAudio)
      sinon.assert.calledWith(app.resource.addAudio, SAMPLES[0])
    })
    it('should add an array of audio samples', () => {
      Resource.addImage(SAMPLES)

      sinon.assert.calledTwice(app.resource.addImage)
      sinon.assert.calledWith(app.resource.addImage, SAMPLES[0])
      sinon.assert.calledWith(app.resource.addImage, SAMPLES[1])
    })
  })
  beforeEach(() => {
    testSetApplication(app = {
      resource: sinon.createStubInstance(ResourceManager)
    })
  })
  afterEach(() => {
    testSetApplication()
  })
})
