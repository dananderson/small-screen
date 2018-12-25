/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Resource } from '../../lib/Resource/Resource'
import sinon from 'sinon'
import { StubGraphicsDevice } from '../Mock/StubGraphicsDevice'
import { ResourceManager } from '../../lib/Resource/ResourceManager'
import { ImageResource } from '../../lib/Resource/ImageResource'
import { BitmapFontResource } from '../../lib/Resource/BitmapFontResource'
import { AudioResource } from '../../lib/Resource/AudioResource'

chai.use(chaiAsPromised)

describe('ResourceManager', () => {
  describe('addResource()', () => {
    it('should add a resource', () => {
      const resource = createStubResource(Resource)
      const result = resourceManager.addResource('test', resource)

      assert.equal(result, resource)
      assert.equal(resourceManager.getResource('test'), resource)

      assert.isTrue(resourceManager._workQueue.isEmpty())
      assert.equal(resource._ref, 1)

      sinon.assert.notCalled(resource._load)
      sinon.assert.notCalled(resource._attach)
    })
    it('should add a resource when a graphics device is attached', () => {
      resourceManager._attach({ graphicsDevice })

      const resource = createStubResource(Resource)
      const result = resourceManager.addResource('test', resource)

      assert.equal(result, resource)
      assert.equal(resourceManager.getResource('test'), resource)

      assert.equal(resourceManager._workQueue.size(), 1)
      assert.equal(resource._ref, 1)

      sinon.assert.notCalled(resource._load)
      sinon.assert.notCalled(resource._attach)
    })
    it('should throw Error for duplicate ID', () => {
      const resource = resourceManager.addResource('test', createStubResource(Resource))
      assert.throws(() => resourceManager.addResource('test', resource))
    })
  })
  describe('addImageResource()', () => {
    it('should add an ImageResource', () => {
      const resource = resourceManager.addImageResource('test', 'test/resources/one.png')
      assert.instanceOf(resource, ImageResource)
    })
  })
  describe('addBitmapFontResource()', () => {
    it('should add an BitmapFontResource', () => {
      const resource = resourceManager.addBitmapFontResource('test', 'test/resources/one.png')
      assert.instanceOf(resource, BitmapFontResource)
    })
  })
  describe('addAudioResource()', () => {
    it('should add an AudioResource', () => {
      const resource = resourceManager.addAudioResource('test', 'test/resources/one.png')
      assert.instanceOf(resource, AudioResource)
    })
  })
  describe('hasResource()', () => {
    it('should return true for a registered resource', () => {
      resourceManager.addResource('test', createStubResource(Resource))
      assert.isTrue(resourceManager.hasResource('test'))
    })
    it('should return false if resource ID does not exist', () => {
      resourceManager.hasResource('test')
    })
  })
  describe('getResource()', () => {
    it('should return resource', () => {
      resourceManager.addResource('test', createStubResource(Resource))
      assert.isNotNull(resourceManager.getResource('test'))
    })
    it('should return undefined if resource ID does not exist', () => {
      assert.isUndefined(resourceManager.getResource('test'))
    })
  })
  describe('addRef()', () => {
    it('should add a ref to an ID\'d resource', () => {
      const resource = resourceManager.addResource('test', createStubResource(Resource))

      assert.equal(resource._ref, 1)
      resourceManager.addRef('test')
      assert.equal(resource._ref, 2)
    })
    it('should be a noop if resource ID does not exist', () => {
      resourceManager.addRef('unknown')
    })
  })
  describe('removeResource()', () => {
    it('should remove an existing resource', () => {
      resourceManager.addResource('test', createStubResource(Resource))

      assert.isTrue(resourceManager.hasResource('test'))
      resourceManager.removeResource('test')
      assert.isFalse(resourceManager.hasResource('test'))
    })
    it('should decrement ref of an existing resource', () => {
      resourceManager.addResource('test', createStubResource(Resource))
      resourceManager.addRef('test')

      assert.isTrue(resourceManager.hasResource('test'))
      resourceManager.removeResource('test')
      assert.isTrue(resourceManager.hasResource('test'))
    })
    it('should be a noop if resource ID does not exist', () => {
      resourceManager.removeResource('test')
    })
  })

  let graphicsDevice
  let resourceManager

  function createStubResource () {
    return sinon.createStubInstance(Resource)
  }

  // class TestResource extends Resource {
  //   _load (device) {
  //     this._setState(Resource.LOADING)
  //   }
  //
  //   _attach (device) {
  //     this._setState(Resource.ATTACHED)
  //   }
  //
  //   _detach (device) {
  //     this._setState(Resource.DETACHED)
  //   }
  // }

  beforeEach(() => {
    graphicsDevice = new StubGraphicsDevice()
    resourceManager = new ResourceManager({
      resWorkerTimeLimitMs: 1,
      resWorkerRescheduleDelayMs: 1,
      resImageThreadPoolSize: 4,
      resImageConcurrency: 2
    })
  })

  afterEach(() => {
    resourceManager && resourceManager.destroy()
    resourceManager = undefined
  })
})
