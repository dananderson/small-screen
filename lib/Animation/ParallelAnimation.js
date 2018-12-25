/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Animation } from './Animation'

export class ParallelAnimation extends Animation {
  constructor (owner, animations) {
    super(owner)

    this._animations = animations
  }

  update (delta) {
    if (this.finished) {
      return false
    }

    let running = false

    for (const animation of this._animations) {
      if (!animation.finished) {
        animation.update(delta)
        running || (running = !animation.finished)
      }
    }

    if (!running) {
      this.stop()
    }

    return true
  }
}
