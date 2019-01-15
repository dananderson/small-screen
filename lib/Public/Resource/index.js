/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { getInstance } from '../../Core/Application'

const application = getInstance()

export function install (src) {
  if (Array.isArray(src)) {
    src.forEach(s => application.resource.addBitmapFontResource(s))
  } else {
    application.resource.addBitmapFontResource(src)
  }
}
