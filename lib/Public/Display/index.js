/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { application } from '..'

export function getWidth () {
  return application.width
}

export function getHeight () {
  return application.height
}

export function isFullscreen () {
  return application.fullscreen
}
