/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Resource } from './Resource'

const INIT = Resource.INIT
const LOADING = Resource.LOADING
const LOADED = Resource.LOADED
const ATTACHED = Resource.ATTACHED
const ERROR = Resource.ERROR

/**
 * Audio resource.
 */
export class AudioResource extends Resource {
  constructor (src) {
    super()

    this._src = src
    this.sample = null
  }

  _load ({ audio }) {
    this._transition(LOADING)

    let err

    try {
      this.sample = audio.createAudioSample(this._src.uri)
    } catch (e) {
      err = e
    }

    if (!this.sample || err) {
      this.sample = undefined
      this._transition(ERROR)
      return Promise.reject(err)
    }

    this._transition(LOADED)

    return Promise.resolve()
  }

  _attach ({ audio }) {
    this._transition(ATTACHED)
  }

  _detach ({ audio }) {
    audio.destroyAudioSample(this.sample)
    this.sample = undefined
    this._transition(INIT)
  }
}
