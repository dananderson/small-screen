/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

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
