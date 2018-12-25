/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Get the current high resolution time in milliseconds relative to an arbitrary time in the past.
 *
 * @returns {number}
 */
export function now () {
  let time = process.hrtime()
  return time[0] * 1e3 + time[1] / 1e6
}
