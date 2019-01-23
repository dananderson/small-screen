/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export class AudioManager {
  constructor (driver) {
    this._driver = driver
  }

  attach () {
    this._driver.attach()
  }

  detach () {
    this._driver.detach()
  }

  play (id) {
    // const audioResource = this._app.resource.getResource(id)
    //
    // audioResource && audioResource.getAudioBuffer && this._audio.play(audioResource.getAudioBuffer())
  }
}
