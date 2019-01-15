/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { getInstance } from '../Core/Application'

const application = getInstance()

export function configure({width = 0, height = 0, fullscreen = true}) {
  // TODO: find compatible dimensions...

  if (width === 0) {
    width = 1280
  }

  if (height === 0) {
    height = 720
  }

  // TODO: this detaches / attaches.. not sure i want that here. maybe a config option?
  application.setSize(width, height, fullscreen)
}
