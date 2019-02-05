/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { app } from '..'

export class Display {
  static getWidth () {
    return app().width
  }

  static getHeight () {
    return app().height
  }

  static isFullscreen () {
    return app().fullscreen
  }
}
