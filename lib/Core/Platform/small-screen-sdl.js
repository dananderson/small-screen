/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import bindings from 'bindings'

let lib

try {
  lib = bindings('small-screen-sdl')
} catch (e) {

}

if (!lib) {
  lib = {
    capabilities: {
      driverName: '',
      defaultResolution: { width: 0, height: 0 },
      windowManagerBounds: { x: 0, y: 0, width: 0, height: 0 },
      availableResolutions: []
    },
    eventSize: 0,
    attach () {
      throw Error('SDL is not available on this system.')
    },
    detach () {

    }
  }
}

export const SDL = lib
export const SDLRenderingContext = lib.SDLRenderingContext || (() => { throw Error('SDLRenderingContext was not loaded') })
export const SDLAudioContext = lib.SDLAudioContext || (() => { throw Error('SDLAudioContext was not loaded') })
export const SDLGamepad = lib.SDLGamepad || (() => { throw Error('SDLGamepad was not loaded') })
export const SDLClient = lib.SDLClient || (() => { throw Error('SDLClient was not loaded') })
