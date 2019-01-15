/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Resource } from './Resource'

/**
 * Audio resource.
 */
export class AudioResource extends Resource {
  constructor (filename) {
    super()

    this._filename = filename
    this._audioBuffer = null
  }

  /**
   * Get the AudioBuffer that can be submitted to the Audio Manager for sound playback.
   *
   * @returns {AudioBuffer}
   */
  getAudioBuffer () {
    return this._audioBuffer
  }

  _load ({ audioDevice }) {
    this._setState(Resource.LOADING)

    if (this._audioBuffer) {
      return Promise.resolve()
    }

    this._audioBuffer = audioDevice.createAudioBuffer(this._filename)

    if (!this._audioBuffer) {
      this._audioBuffer = null
      this._setState(Resource.ERROR)
    }

    return Promise.resolve()
  }

  _attach ({ audioDevice }) {
    this._setState(Resource.ATTACHED)
  }

  _detach ({ audioDevice }) {
    this._audioBuffer && audioDevice.destroyAudioBuffer(this._audioBuffer)
    this._audioBuffer = undefined
    this._setState(Resource.DETACHED)
  }
}
