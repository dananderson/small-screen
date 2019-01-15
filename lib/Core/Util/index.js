/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { FastEventEmitter } from './FastEventEmitter'
import os from 'os'

/**
 * Alias endian specific the read and write methods of the Buffer class. If the system is little endian, an
 * alias method named writeInt32 will be added for writeInt32LE. This reduces code when dealing with Buffer
 * reads and writes.
 */
export function bufferEndianPatch () {
  Object.getOwnPropertyNames(Buffer.prototype)
    .filter(name => name.endsWith(os.endianness()))
    .forEach(name => {
      Buffer.prototype[name.slice(0, -2)] = Buffer.prototype[name]
    })
}

/**
 * Get the current high resolution time in milliseconds relative to an arbitrary time in the past.
 *
 * @returns {number}
 */
export function now () {
  let time = process.hrtime()
  return time[0] * 1e3 + time[1] / 1e6
}

/**
 * Creates a font ID used for identifying font resources.
 *
 * @param family Font family string.
 * @param size Font size.
 * @returns {string}
 */
export const fontId = (family, size) => family + '-' + size

/**
 *
 */
export const messageQueue = new FastEventEmitter()

export const emptyObject = Object.freeze({})