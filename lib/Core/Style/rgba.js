/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Creates a 32-bit color from 8-bit RGBA color components.
 *
 * Note: The returned value should be considered an opaque object to be passed to css. 32 bits are normally packed
 * ARGB color, but a 33rd bit is added to indicate to the graphics subsystem that there is an alpha channel.
 *
 * @returns {number} 32 bit color integer
 */
export function rgba (r, g, b, a) {
  // 4294967296 = 0xFFFFFFFF + 1 = 0x100000000
  return (((r & 0xFF) << 16 | (g & 0xFF) << 8 | b & 0xFF | (a & 0xFF) << 24) >>> 0) + 4294967296
}
