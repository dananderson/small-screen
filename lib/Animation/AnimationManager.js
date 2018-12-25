/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

'use strict'

import { TimingAnimation } from './TimingAnimation'
import { SequenceAnimation } from './SequenceAnimation'
import { ParallelAnimation } from './ParallelAnimation'

/**
 * Animation controller.
 */
export class AnimationManager {
  _animations = []

  /**
   * Animates a value along a timed easing curve. The Easing module has tons of
   * predefined curves, or you can use your own function.
   *
   * @param value
   * @param options
   * @returns {Animation}
   */
  timing (value, options) {
    return new TimingAnimation(this, value, options)
  }

  /**
   * Starts an array of animations in order, waiting for each to complete
   * before starting the next. If the current running animation is stopped, no
   * following animations will be started.
   *
   * @param animations
   * @returns {Animation}
   */
  sequence (animations) {
    return new SequenceAnimation(this, animations)
  }

  /**
   * Starts an array of animations all at the same time. By default, if one
   * of the animations is stopped, they will all be stopped.
   *
   * @param animations
   * @returns {Animation}
   */
  parallel (animations) {
    return new ParallelAnimation(this, animations)
  }

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

  destroy () {

  }
}
