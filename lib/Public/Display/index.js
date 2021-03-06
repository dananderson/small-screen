/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { window } from '..'

export class Display {
  static getWidth () {
    return window().width
  }

  static getHeight () {
    return window().height
  }

  static resize (width, height, options) {
    window().resize(width, height, options)
  }

  static getDefaultResolution () {
    return window().caps.defaultResolution
  }

  static getAvailableResolutions () {
    return [ ...window().caps.availableResolutions ]
  }
}
