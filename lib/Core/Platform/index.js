/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SDLAudioDriver } from './SDLAudioDriver'
import { SDLWindow } from './SDLWindow'
import { verifyLibrarySmallScreenSDL, SDL } from './small-screen-sdl'

export function createWindow () {
  verifyLibrarySmallScreenSDL()
  return new SDLWindow(SDL)
}

export function createAudioDriver () {
  verifyLibrarySmallScreenSDL()
  return new SDLAudioDriver(SDL)
}

export function shutdown () {
  SDL.quit()
}
