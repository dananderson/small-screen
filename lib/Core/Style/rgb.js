/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Creates a 24-bit color from 8-bit RGB color components.
 *
 * @returns {number} 24-bit color integer
 */
export function rgb (r, g, b) {
  return (((r & 0xFF) << 16) | ((g & 0xFF) << 8) | (b & 0xFF)) >>> 0
}
