/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export class SDLAudio {
  constructor (SDL) {
    this.SDL = SDL

    if (SDL.SDL_InitSubSystem(SDL.SDL_INIT_AUDIO) !== 0) {
      throw Error(`Error initializing SDL Audio: ${SDL.SDL_GetError()}`)
    }
    
    SDL.SDL_OpenAudio()
    SDL.SDL_PauseAudio(0)
  }

  play (buffer) {
    this.SDL.SDL_ClearQueuedAudio(1)
    this.SDL.SDL_QueueAudio(1, buffer, buffer.length)
  }

  destroy () {
    this.SDL.SDL_CloseAudio()
  }

  createAudioBuffer (filename) {
    return this.SDL.SDL_LoadWAV(filename)
  }

  destroyAudioBuffer (buffer) {
    buffer && this.SDL.SDL_FreeWAV(buffer)
  }
}
