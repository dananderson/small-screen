/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { factory } from '../Platform/'

export class AudioManager {
  constructor (app) {
    this._app = app
    this._audio = undefined
  }

  _attach () {
    // TODO: assert !_audio
    this._audio = factory.createAudio()
  }

  _detach () {
    this._audio && this._audio.destroy()
    this._audio = undefined
  }

  play (id) {
    const audioResource = this._app.resource.getResource(id)

    audioResource && audioResource.getAudioBuffer && this._audio.play(audioResource.getAudioBuffer())
  }

  destroy () {
    this._detach()
    this._audio = undefined
  }
}
