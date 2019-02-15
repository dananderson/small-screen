/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { resource } from '..'
import { FontStore } from '../../Core/Util/small-screen-lib'
import { join, isAbsolute } from 'path'

export class Resource {
  /**
   * Set the resource directory for relative paths.
   */
  static setResourcePath (path) {
    resource().path = path
  }

  /**
   * Get the resource directory for relative paths.
   */
  static getResourcePath () {
    return resource().path
  }

  /**
   * Add a font face.
   */
  static addFont (src) {
    if (Array.isArray(src)) {
      src.forEach(Resource.addFont)
    } else {
      // TODO: validate source
      console.time('install font')
      FontStore.install(isAbsolute(src.uri) ? src.uri : join(resource().path, src.uri), src.fontFamily,
        src.fontStyle || 'normal', src.fontWeight || 'normal')
      console.timeEnd('install font')
    }
  }

  /**
   * Add an image.
   */
  static addImage (src) {
    if (Array.isArray(src)) {
      src.forEach(Resource.addImage)
    } else {
      resource().addImage(src)
    }
  }

  /**
   * Add an audio sample.
   */
  static addSample (src) {
    if (Array.isArray(src)) {
      src.forEach(Resource.addSample)
    } else {
      resource().addAudio(src)
    }
  }
}
