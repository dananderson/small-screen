/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SDLRenderingContextBase } from './small-screen-sdl'
import { Value } from '../Style/Value'

export class SDLRenderingContext extends SDLRenderingContextBase {
  pushStyle (style) {
    const { opacity, color, backgroundColor, borderColor, tintColor } = style

    super.pushStyle(
      opacity instanceof Value ? opacity.getValue() : opacity,
      color || 0,
      backgroundColor || 0,
      borderColor || 0,
      tintColor || 0xFFFFFF
    )
  }
}
