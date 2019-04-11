/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { resource } from '..'
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
      let fontMap

      if (src.fontMap) {
        fontMap = src.fontMap
      } else {
        fontMap = [{ index: 0, family: src.fontFamily, style: src.fontStyle, weight: src.fontWeight }]
      }

      // TODO: validate source
      resource()._devices.fontStore.add(isAbsolute(src.uri) ? src.uri : join(resource().path, src.uri), fontMap)
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
