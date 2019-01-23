/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import bindings from 'bindings'
import { SmallScreenError } from '../Util/SmallScreenError'

let lib
let error

try {
  lib = bindings('small-screen-sdl')
  console.log(`SDL ${lib.SDL_VERSION}`)
} catch (e) {
  error = e
}

if (!lib) {
  lib = {
    // SDL: {
    quit () {

    },

    // },
    RenderingContext () {

    }
  }
}

export function verifyLibrarySmallScreenSDL () {
  if (error) {
    throw new SmallScreenError('Failed to load SDL library.', error)
  }
}

export const SDL = lib
export const SDLRenderingContextBase = lib.RenderingContext
export const SDLGamepad = lib.Gamepad
