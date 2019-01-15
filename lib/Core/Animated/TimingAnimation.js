/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Animation } from '../../Core/Animated/Animation'
import { Easing } from '../../Core/ThirdParty/Easing'

export class TimingAnimation extends Animation {
  constructor (manager, value, options) {
    super(manager)

    this._value = value

    if (options.from === undefined) {
      this._from = value.getValue()
    } else {
      value.setValue(this._from = options.from)
    }

    this._to = options.to
    this._easing = options.easing || Easing.linear
    this._duration = options.duration
    this._accumulatedDuration = 0
  }

  update (delta) {
    if (this.finished) {
      return false
    }

    this._accumulatedDuration += delta

    const diff = this._to - this._from

    if (this._accumulatedDuration >= this._duration) {
      this._value.setValue((this._from + (this._easing(1) * diff)) << 0)
      this.stop()
    } else {
      this._value.setValue((this._from + (this._easing(this._accumulatedDuration / this._duration) * diff)) << 0)
    }

    return true
  }
}
