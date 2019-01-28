/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import sinon from 'sinon'
import { Resource } from '../../../../lib/Core/Resource/Resource'
import { AudioResource } from '../../../../lib/Core/Resource/AudioResource'
import { SourceType } from '../../../../lib/Core/Util'

chai.use(chaiAsPromised)

describe('AudioResource', () => {
  let audio
  describe('_load()', () => {
    it('should set the resource to LOADED', () => {
      const audioResource = new AudioResource({ uri: 'test/resources/test.wav', type: SourceType.FILE })

      assert.isFulfilled(audioResource._load({ audio })
        .then(() => {
          assert.equal(audioResource._state, Resource.LOADED)
          assert.notExists(audioResource.sample)
          assert.notExists(audioResource._buffer)
          sinon.assert.notCalled(audio.createAudioSample)
          sinon.assert.notCalled(audio.destroyAudioSample)
        }))
    })
  })
  describe('_attach()', () => {
    it('should set resource to ATTACHED when audio sample creation succeeds', () => {
      const audioResource = new AudioResource({ uri: 'test/resources/test.wav', type: SourceType.FILE })

      audio.createAudioSample.returns('sample')

      assert.isFulfilled(audioResource._load({ audio })
        .then(() => {
          audioResource._attach({ audio })
          assert.equal(audioResource._state, Resource.ATTACHED)
          assert.equal(audioResource.sample, 'sample')
          assert.notExists(audioResource._buffer)
          sinon.assert.calledOnce(audio.createAudioSample)
          sinon.assert.notCalled(audio.destroyAudioSample)
        }))
    })
    it('should set the resource to ERROR when audio sample cannot be created', () => {
      const audioResource = new AudioResource({ uri: '-', type: SourceType.FILE })

      audio.createAudioSample.throws(Error())

      assert.isRejected(audioResource._load({ audio })
        .then(() => {
          audioResource._attach({ audio })
        })
        .finally(() => {
          assert.equal(audioResource._state, Resource.ERROR)
        }))
    })
  })
  describe('_detach()', () => {
    it('should set resource to INIT', () => {
      const audioResource = new AudioResource({ uri: 'test/resources/test.wav', type: SourceType.FILE })

      audio.createAudioSample.returns('sample')

      assert.isFulfilled(audioResource._load({ audio })
        .then(() => {
          audioResource._attach({ audio })
          audioResource._detach({ audio })
          assert.equal(audioResource._state, Resource.INIT)
          assert.notExists(audioResource.sample)
          assert.notExists(audioResource._buffer)
          sinon.assert.calledOnce(audio.destroyAudioSample)
        }))
    })
  })
  beforeEach(() => {
    audio = createAudio()
  })
})

class Audio {
  createAudioSample () {}
  destroyAudioSample () {}
}

function createAudio () {
  return sinon.createStubInstance(Audio)
}
