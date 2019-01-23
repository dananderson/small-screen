/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { TimingAnimation } from '../../Core/Animated/TimingAnimation'
import { SequenceAnimation } from '../../Core/Animated/SequenceAnimation'
import { ParallelAnimation } from '../../Core/Animated/ParallelAnimation'
import { application } from '..'

/**
 * Animates a value along a timed easing curve. The Easing module has tons of
 * predefined curves, or you can use your own function.
 *
 * @param value
 * @param options
 * @returns {Animation}
 */
export function timing (value, options) {
  return new TimingAnimation(application.animation, value, options)
}

/**
 * Starts an array of animations in order, waiting for each to complete
 * before starting the next. If the current running animation is stopped, no
 * following animations will be started.
 *
 * @param animations
 * @returns {Animation}
 */
export function sequence (animations) {
  return new SequenceAnimation(application.animation, animations)
}

/**
 * Starts an array of animations all at the same time. By default, if one
 * of the animations is stopped, they will all be stopped.
 *
 * @param animations
 * @returns {Animation}
 */
export function parallel (animations) {
  return new ParallelAnimation(application.animation, animations)
}
