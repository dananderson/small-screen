/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Animation } from '../../Core/Animated/Animation'
import { Easing } from '../../Core/ThirdParty/Easing'

export class TimingAnimation extends Animation {
  constructor (manager, value, { from, to, easing, duration }) {
    super(manager)

    this._value = value

    if (from === undefined) {
      this._from = value.getValue()
    } else {
      value.setValue(this._from = from)
    }

    this._to = to
    this._easing = easing || Easing.linear
    this._duration = duration
    this._accumulatedDuration = 0
  }

  update (delta) {
    if (this.finished) {
      return false
    }

    const { _value, _to, _from, _duration, _easing } = this
    const accumulatedDuration = (this._accumulatedDuration += delta)

    const diff = _to - _from

    if (accumulatedDuration >= _duration) {
      _value.setValue((_from + (_easing(1) * diff)) << 0)
      this.stop()
    } else {
      _value.setValue((_from + (_easing(accumulatedDuration / _duration) * diff)) << 0)
    }

    return true
  }
}
