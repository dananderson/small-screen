/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Style } from '../../Core/Style'
import { window } from '../index'

/**
 * Converts a viewport height percentage units to pixels. 1 vh is 1/100th viewport height.
 *
 * @param {number|string} percentage Percentage value.
 * @return {number} Computed pixel value.
 */
function vh (percentage) {
  if (typeof percentage === 'string') {
    percentage = parseFloat(percentage)
  }

  return (percentage / 100 * window().height) >> 0
}

/**
 * Converts a viewport width percentage units to pixels. 1 vh is 1/100th viewport width.
 *
 * @param {number|string} percentage Percentage value.
 * @return {number} Computed pixel value.
 */
function vw (percentage) {
  if (typeof percentage === 'string') {
    percentage = parseFloat(percentage)
  }

  return (percentage / 100 * window().width) >> 0
}

/**
 * Converts a viewport percentage units to pixels. 1 vmin is 1/100th of the smallest side of the viewport.
 *
 * @param {number|string} percentage Percentage value.
 * @return {number} Computed pixel value.
 */
function vmin (percentage) {
  if (typeof percentage === 'string') {
    percentage = parseFloat(percentage)
  }

  const { width, height } = window()

  return (percentage / 100 * Math.min(width, height)) >> 0
}

/**
 * Converts a viewport percentage units to pixels. 1 vmax is 1/100th of the longest side of the viewport.
 *
 * @param {number|string} percentage Percentage value.
 * @return {number} Computed pixel value.
 */
function vmax (percentage) {
  if (typeof percentage === 'string') {
    percentage = parseFloat(percentage)
  }

  const { width, height } = window()

  return (percentage / 100 * Math.max(width, height)) >> 0
}

/**
 * Flattens an array of style objects into one aggregated style object.
 *
 * @param {*[]} style Array of style objects.
 * @return {Style} Flattened style object.
 */
function flatten (style) {
  return Style(style)
}

/**
 * Sometimes you may want `absoluteFill` but with a couple tweaks - `absoluteFillObject` can be
 * used to create a customized entry in a Style.
 */
const absoluteFillObject = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0
}

/**
 * A very common pattern is to create overlays with position absolute and zero positioning, so `absoluteFill` can be
 * used for convenience and to reduce duplication of these repeated styles.
 *
 * @type {Style}
 */
const absoluteFill = Style(absoluteFillObject)

/**
 * This is defined as the width of a thin line on the platform. It can be used as the thickness of a border or division
 * between two elements.
 *
 * @type {number}
 */
const hairlineWidth = 1

/**
 * Creates a StyleSheet style reference from the given object.
 *
 * @param template Stylesheet template.
 */
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
  hairlineWidth,
  absoluteFill,
  absoluteFillObject
})

const { rgb, rgba } = Style

export {
  vw,
  vh,
  vmin,
  vmax,
  rgb,
  rgba,
  Style,
  StyleSheet
}
