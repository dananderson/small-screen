/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export class SDLAudioDriver {
  constructor (SDL) {
    this._SDL = SDL
    SDL.init(SDL.SDL_INIT_AUDIO)
  }

  play (clip) {
    this._SDL.SDL_ClearQueuedAudio(1)
    this._SDL.SDL_QueueAudio(1, clip, clip.length)
  }

  attach () {
    const SDL = this._SDL

    SDL.init(SDL.SDL_INIT_AUDIO)
    SDL.SDL_OpenAudio()
    SDL.SDL_PauseAudio(0)
  }

  detach () {
    this._SDL.SDL_CloseAudio()
  }

  createAudioClip (filename) {
    // TODO: support url + buffer + data uri (?)
    return this._SDL.SDL_LoadWAV(filename)
  }

  destroyAudioClip (clip) {
    clip && this._SDL.SDL_FreeWAV(clip)
  }
}
