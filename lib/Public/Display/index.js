/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { application } from '..'

export class Display {
  static getWidth () {
    return application.width
  }

  static getHeight () {
    return application.height
  }

  static isFullscreen () {
    return application.fullscreen
  }
}
