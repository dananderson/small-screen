/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Animation } from '../../Core/Animated/Animation'

export class SequenceAnimation extends Animation {
  constructor (manager, animations) {
    super(manager)

    this._animations = animations
  }

  start (callback) {
    this._runningIndex = 0
    return super.start(callback)
  }

  stop () {
    this._runningIndex = this._animations = undefined
    super.stop()
  }

  update (delta) {
    if (this.finished) {
      return false
    }

    const animation = this._animations[this._runningIndex]

    animation.update(delta)

    if (animation.finished) {
      this._runningIndex++
      if (this._runningIndex === this._animations.length) {
        this.stop()
      }
    }

    return true
  }
}
