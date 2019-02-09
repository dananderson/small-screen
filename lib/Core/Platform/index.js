/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SDLWindow } from './SDLWindow'
import { SDL, SDLAudioContext } from './small-screen-sdl'
import { SDLMixerAudioContext } from './small-screen-sdl-mixer'
import { AudioContext } from './AudioContext'

class Platform {
  attach () {

  }

  detach () {

  }

  createWindow () {

  }

  createAudioContext () {

  }

  get capabilities () {

  }
}

export class SDLPlatform extends Platform {
  attach () {
    SDL.attach()
  }

  detach () {
    SDL.detach()
  }

  createWindow () {
    return new SDLWindow(SDL)
  }

  createAudioContext () {
    if (SDLMixerAudioContext) {
      try {
        return new SDLMixerAudioContext()
      } catch (err) {
        console.log(err.message)
      }
    }

    if (SDL.hasAudio) {
      try {
        return new SDLAudioContext()
      } catch (err) {
        console.log(err.message)
      }
    }

    return new AudioContext()
  }

  get capabilities () {
    return SDL.capabilities
  }
}
