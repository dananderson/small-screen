/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

const reverseMap = []

export class Key {
  // Use the Nintendo controller A, B, X, Y order.
  static A = 1
  static B = 0
  static X = 3
  static Y = 2
  static SELECT = 4
  static HOME = 5
  static START = 6
  static LEFT_STICK = 7
  static RIGHT_STICK = 8
  static L1 = 9
  static R1 = 10
  static UP = 11
  static DOWN = 12
  static LEFT = 13
  static RIGHT = 14

  static L2 = 100
  static R2 = 101

  static LEFT_AXIS_UP = 200
  static LEFT_AXIS_DOWN = 201
  static LEFT_AXIS_LEFT = 202
  static LEFT_AXIS_RIGHT = 203

  static RIGHT_AXIS_UP = 204
  static RIGHT_AXIS_DOWN = 205
  static RIGHT_AXIS_LEFT = 206
  static RIGHT_AXIS_RIGHT = 207

  static id (key) {
    return reverseMap[key]
  }
}

for (const k in Key) {
  reverseMap[Key[k]] = k
}
