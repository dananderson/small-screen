/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Mapped key codes for a 'standard' input device. This mapping closely matches the standard mapping of the Gamepad
 * specification (https://w3c.github.io/gamepad/#remapping).
 */
export class StandardKey {
  // Use the Nintendo controller A, B, X, Y order.
  static B = 0
  static A = 1
  static Y = 2
  static X = 3

  static L1 = 4
  static R1 = 5
  static L2 = 6
  static R2 = 7

  static SELECT = 8 // back
  static START = 9 // forward

  static LS = 10
  static RS = 11

  static UP = 12
  static DOWN = 13
  static LEFT = 14
  static RIGHT = 15

  static HOME = 16

  static LS_UP = 17
  static LS_DOWN = 18
  static LS_LEFT = 19
  static LS_RIGHT = 20

  static RS_UP = 21
  static RS_DOWN = 22
  static RS_LEFT = 23
  static RS_RIGHT = 24
}
