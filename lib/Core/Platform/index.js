/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SDLWindow } from './SDLWindow'
import { verifyLibrarySmallScreenSDL, SDL, SDLAudioContext } from './small-screen-sdl'
import { SDLMixerAudioContext } from './small-screen-sdl-mixer'

export function createWindow () {
  verifyLibrarySmallScreenSDL()
  return new SDLWindow(SDL)
}

export function createAudioContext () {
  if (SDLMixerAudioContext) {
    try {
      return new SDLMixerAudioContext()
    } catch (err) {
      console.log('Cannot create sdl_mixer audio, falling back to sdl audio', err)
    }
  }

  return new SDLAudioContext();
}

export function shutdown () {
  SDL.quit()
}
