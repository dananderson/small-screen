/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Resource } from './Resource'
import { SmallScreenError } from '../Util/SmallScreenError'
import { abortController, SourceType } from '../Util'
import fetch from 'node-fetch'

let { INIT, LOADING, LOADED, ATTACHED, ERROR } = Resource

/**
 * Audio resource.
 */
export class AudioResource extends Resource {
  constructor (src) {
    super()

    this._src = src
    this._buffer = null
    this.sample = null
  }

  async _load ({ audio }) {
    this._transition(LOADING)

    switch (this._src.type) {
      case SourceType.REMOTE:
        const uri = this._src.uri
        try {
          const res = await fetch(uri, { signal: abortController.signal })

          // If state changed after await, bail.
          if (this._state !== LOADING) {
            return
          }

          this._buffer = await res.buffer()

          // If state changed after await, bail.
          if (this._state !== LOADING) {
            return
          }
        } catch (err) {
          if (err.name !== 'AbortError' && this._state === LOADING) {
            this._buffer = this.sample = undefined
            this._transition(ERROR, err)
            throw new SmallScreenError(`Cannot fetch audio sample from ${uri}`, err)
          } else {
            // If state changed after await, bail.
            return
          }
        }
        break
      case SourceType.BASE64:
        this._buffer = Buffer.from(this._src.data, 'base64')
        break
      case SourceType.FILE:
        // load file in attach()
        break
      default:
        throw Error(`Unsupported source type: ${this._src.type}`)
    }

    this._transition(LOADED)
  }

  _attach ({ audio }) {
    try {
      this.sample = audio.createAudioSample(this._buffer || this._src.uri)
    } catch (err) {
      this.sample = this._buffer = undefined
      this._transition(ERROR)
      throw SmallScreenError('Failed to attach resource: ', err)
    }

    this._transition(ATTACHED)
  }

  _detach ({ audio }) {
    audio.destroyAudioSample(this.sample)
    this.sample = this._buffer = undefined
    this._transition(INIT)
  }
}
