/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Resource } from './Resource'
import { app as getApp } from './index'

export function main ({ width, height, fullscreen, title, resourcePath, images, fonts, samples, app, start }) {
  const application = getApp()

  if (resourcePath) {
    application.resource.path = resourcePath
  }

  if (Array.isArray(images)) {
    Resource.addImage(images)
  }

  if (Array.isArray(fonts)) {
    Resource.addFont(fonts)
  }

  if (Array.isArray(samples)) {
    Resource.addSample(samples)
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
