/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { createAudio, createGraphics } from '.'
import { ResourceManager } from '../../../../lib/Core/Resource/ResourceManager'

const IMAGE_URI = 'test/resources/one.png'
const AUDIO_URI = 'test/resources/test.wav'

describe('ResourceManager', () => {
  let resourceManager
  let devices

  describe('addImage()', () => {
    it('should add a new image resource', () => {
      const resource = resourceManager.addImage(IMAGE_URI)

      assert.equal(resource._ref, 1)
      assert.equal(resourceManager.get(IMAGE_URI), resource)
    })
  })
  describe('addAudio()', () => {
    it('should add a new audio resource', () => {
      const resource = resourceManager.addAudio(AUDIO_URI)

      assert.equal(resource._ref, 1)
      assert.equal(resourceManager.get(AUDIO_URI), resource)
    })
  })
  describe('acquire()', () => {
    it('should return resource and increment ref count', () => {
      const resource = resourceManager.addAudio(AUDIO_URI)

      assert.equal(resource._ref, 1)

      const result = resourceManager.acquire(AUDIO_URI)

      assert.equal(result, resource)
      assert.equal(resource._ref, 2)
    })
  })
  describe('acquireBySource()', () => {
    it('should return resource and increment ref count', () => {
      const resource = resourceManager.addAudio(AUDIO_URI)

      assert.equal(resource._ref, 1)

      const result = resourceManager.acquireBySource(AUDIO_URI)

      assert.equal(result, resource)
      assert.equal(resource._ref, 2)
    })
  })
  describe('release()', () => {
    it('should remove a resource when ref count = 1', () => {
      const resource = resourceManager.addAudio(AUDIO_URI)

      assert.equal(resource._ref, 1)
      resourceManager.release(AUDIO_URI)
      assert.notExists(resourceManager.get(AUDIO_URI))
    })
    it('should decrement ref count when ref count > 1', () => {
      const resource = resourceManager.addAudio(AUDIO_URI)

      resourceManager.acquire(AUDIO_URI)
      resourceManager.release(AUDIO_URI)
      assert.equal(resource._ref, 1)
      assert.exists(resourceManager.get(AUDIO_URI))
    })
  })
  describe('releaseBySource()', () => {
    it('should remove a resource when ref count = 1', () => {
      const resource = resourceManager.addAudio(AUDIO_URI)

      assert.equal(resource._ref, 1)
      resourceManager.releaseBySource({ uri: AUDIO_URI })
      assert.notExists(resourceManager.get(AUDIO_URI))
    })
    it('should decrement ref count when ref count > 1', () => {
      const resource = resourceManager.addAudio(AUDIO_URI)

      resourceManager.acquire(AUDIO_URI)
      resourceManager.releaseBySource({ uri: AUDIO_URI })
      assert.equal(resource._ref, 1)
      assert.exists(resourceManager.get(AUDIO_URI))
    })
  })
  beforeEach(() => {
    devices = {
      graphics: createGraphics(),
      audio: createAudio()
    }
    resourceManager = new ResourceManager(devices)
  })
})
