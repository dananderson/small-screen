/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export function hatToButton (gamepad, hatIndex, value) {
  const exp = Math.log2(value)
  return (Number.isInteger(exp) && exp >= 0 && exp < 4) ? gamepad._physicalButtonCount + (hatIndex * 4) + exp : -1
}
