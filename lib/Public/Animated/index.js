/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { TimingAnimation } from '../../Core/Animated/TimingAnimation'
import { SequenceAnimation } from '../../Core/Animated/SequenceAnimation'
import { ParallelAnimation } from '../../Core/Animated/ParallelAnimation'
import emptyObject from 'fbjs/lib/emptyObject'
import { animation } from '..'

export class Animated {
  /**
   * Animates a value along a timed easing curve. The Easing module has tons of
   * predefined curves, or you can use your own function.
   *
   * @arg {Value} value Value object to animate.
   * @arg {Object} [options]
   * @arg {number} options.to End value.
   * @arg {number} options.from Start value.
   * @arg {number} options.duration Duration of animation in milliseconds.
   * @arg {function} options.easing Easing function.
   * @returns {Animation}
   */
  static timing (value, options) {
    return new TimingAnimation(animation(), value, options || emptyObject)
  }

  /**
   * Starts an array of animations in order, waiting for each to complete
   * before starting the next. If the current running animation is stopped, no
   * following animations will be started.
   *
   * @param {Animation[]} animations Array of animations to run.
   * @returns {Animation}
   */
  static sequence (animations) {
    return new SequenceAnimation(animation(), animations)
  }

  /**
   * Starts an array of animations all at the same time. By default, if one
   * of the animations is stopped, they will all be stopped.
   *
   * @param {Animation[]} animations Array of animations to run.
   * @returns {Animation}
   */
  static parallel (animations) {
    return new ParallelAnimation(animation(), animations)
  }
}
