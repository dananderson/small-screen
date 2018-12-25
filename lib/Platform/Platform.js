/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SDL } from './SDL'
import { SDLInput } from './SDLInput'
import { SDLAudio } from './SDLAudio'
import { SDLVideo } from './SDLVideo'

export function createVideo (events, options) {
  return new SDLVideo(SDL, events, options)
}

export function createInput (options) {
  return new SDLInput(SDL, options)
}

export function createAudio (options) {
  if (SDL.SDL_InitSubSystem(SDL.SDL_INIT_AUDIO)) {
    throw Error(`Error initializing SDL Audio: ${SDL.SDL_GetError()}`)
  }

  return new SDLAudio(SDL, options)
}

export function platformQuit () {
  SDL.SDL_Quit()
}
