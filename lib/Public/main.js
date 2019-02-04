/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { addFont, addImage, addSample } from './Resource'
import { application } from './index'

export function main ({ width, height, fullscreen, title, resourcePath, images, fonts, samples, app, start }) {
  if (resourcePath) {
    application.resource.path = resourcePath
  }

  if (Array.isArray(images)) {
    addImage(images)
  }

  if (Array.isArray(fonts)) {
    addFont(fonts)
  }

  if (Array.isArray(samples)) {
    addSample(samples)
  }

  if (title) {
    application.title = title
  }

  application.resize(width, height, fullscreen)

  application.render(app)

  if (start) {
    application.start()
  }
}
