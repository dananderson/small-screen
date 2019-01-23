/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Style } from '../../Core/Style'
import { application } from '..'

function vh (percentage) {
  if (typeof percentage === 'string') {
    percentage = parseFloat(percentage)
  }

  return (percentage / 100 * application.height) >> 0
}

function vw (percentage) {
  if (typeof percentage === 'string') {
    percentage = parseFloat(percentage)
  }

  return (percentage / 100 * application.width) >> 0
}

function vmin (percentage) {
  if (typeof percentage === 'string') {
    percentage = parseFloat(percentage)
  }

  return (percentage / 100 * Math.min(application.height, application.width)) >> 0
}

function vmax (percentage) {
  if (typeof percentage === 'string') {
    percentage = parseFloat(percentage)
  }

  return (percentage / 100 * Math.max(application.height, application.width)) >> 0
}

function flatten (style) {
  return Style(style)
}

const absoluteFillObject = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
}

const absoluteFill = Style(absoluteFillObject)

function StyleSheet (template) {
  const sheet = {}

  for (const key in template) {
    sheet[key] = Style(template[key])
  }

  return sheet
}

Object.assign(Style, {
  vw,
  vh,
  vmin,
  vmax,
  flatten,
  absoluteFill,
  absoluteFillObject
})

export {
  vw,
  vh,
  vmin,
  vmax,
  Style,
  StyleSheet
}
