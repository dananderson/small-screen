/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

'use strict'

/**
 * Animation controller.
 */
export class AnimationManager {
  _animations = []

  run (delta) {
    const animations = this._animations
    let i = animations.length
    let dirty = false

    while (i--) {
      if (animations[i].update(delta)) {
        dirty = true
      } else {
        animations.splice(i, 1)
      }
    }

    return dirty
  }

  add (animation) {
    this._animations.push(animation)
  }

  attach () {

  }

  detach () {

  }
}
