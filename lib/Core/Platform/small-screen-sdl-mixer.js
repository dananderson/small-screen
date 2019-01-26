/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import bindings from 'bindings'

let lib

try {
  lib = bindings('small-screen-sdl-mixer')
} catch (err) {
  console.log('sdl_mixer is unavailable', err)
}

export const SDLMixerAudioContext = lib && lib.SDLMixerAudioContext
