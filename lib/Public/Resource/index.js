/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { application } from '..'
import { FontStore } from '../../Core/Util/small-screen-lib'
import { join, isAbsolute } from 'path'

export class Resource {
  static setResourcePath (path) {
    application.resource.path = path
  }

  static getResourcePath () {
    return application.resource.path
  }

  static addFont (src) {
    if (Array.isArray(src)) {
      src.forEach(Resource.addFont)
    } else {
      // TODO: validate source
      console.time('install font')
      FontStore.install(isAbsolute(src.uri) ? src.uri : join(application.resource.path, src.uri), src.fontFamily,
        src.fontStyle || 'normal', src.fontWeight || 'normal')
      console.timeEnd('install font')
    }
  }

  static addImage (src) {
    if (Array.isArray(src)) {
      src.forEach(Resource.addImage)
    } else {
      application.resource.addImage(src)
    }
  }

  static addSample (src) {
    if (Array.isArray(src)) {
      src.forEach(Resource.addSample)
    } else {
      application.resource.addAudio(src)
    }
  }
}
