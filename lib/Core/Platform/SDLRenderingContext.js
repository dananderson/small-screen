/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SDLRenderingContextBase } from './small-screen-sdl'

export class SDLRenderingContext extends SDLRenderingContextBase {
  pushStyle (style) {
    let { opacity, color, backgroundColor, borderColor, tintColor } = style

    if (opacity && opacity.getValue) {
      opacity = opacity.getValue()
    }

    super.pushStyle(
      opacity,
      color || 0,
      backgroundColor || 0,
      borderColor || 0,
      tintColor || 0xFFFFFF
    )
  }
}
