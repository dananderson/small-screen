/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { testSetApplication } from '../../../lib/Public'
import { Audio } from '../../../lib/Public/Audio'
import sinon from 'sinon'
import { AudioResource } from '../../../lib/Core/Resource/AudioResource'
import { Resource } from '../../../lib/Core/Resource/Resource'
import { ResourceManager } from '../../../lib/Core/Resource/ResourceManager'

describe('Audio', () => {
  let app

  describe('play()', () => {
    it('should lookup resource id and play audio', () => {
      const mockAudioResource = addMockAudioResource(app.resource, 'id')

      Audio.play('id')

      sinon.assert.calledOnce(app.audio.play)
      sinon.assert.calledWith(app.audio.play, mockAudioResource.sample)
    })
    it('should not play if resource not found', () => {
      addMockAudioResource(app.resource, 'id')

      Audio.play('does-not-exist')

      sinon.assert.notCalled(app.audio.play)
    })
    it('should not play if resource not attached', () => {
      const mockAudioResource = addMockAudioResource(app.resource, 'id')

      mockAudioResource._state = Resource.INIT

      Audio.play('id')

      sinon.assert.notCalled(app.audio.play)
    })
  })
  beforeEach(() => {
    testSetApplication(app = {
      resource: sinon.createStubInstance(ResourceManager),
      audio: sinon.createStubInstance(class {
        play (sample) {

        }
      })
    })
  })
  afterEach(() => {
    testSetApplication()
  })
})

function addMockAudioResource (resource, id) {
  const mockAudioResource = sinon.createStubInstance(AudioResource)
  mockAudioResource.sample = {}
  mockAudioResource._state = Resource.ATTACHED

  resource.acquire.withArgs(id).returns(mockAudioResource)

  return mockAudioResource
}
