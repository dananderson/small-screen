/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Value } from '../../Core/Style/Value'
import { BoxView } from '../../Core/Views/BoxView'
import { TimingAnimation } from '../../Core/Animated/TimingAnimation'
import { Style } from '../../Core/Style'
import { Easing } from '../../Core/ThirdParty/Easing'

export class CurtainView extends BoxView {
  constructor (props, app) {
    const obj = {
      ...props,
      style: {
        ...Style.absoluteFillObject,
        backgroundColor: 'black',
        opacity: new Value(0)
      }
    }

    if (props.fadeOutMs === undefined) {
      obj.fadeOutMs = 500
    }

    if (props.fadeInMs === undefined) {
      obj.fadeInMs = 500
    }

    if (props.opacity === undefined) {
      obj.opacity = 255
    }

    super(obj, app)
  }

  show (callback) {
    const { opacity, fadeOutMs } = this.props
    const anim = new TimingAnimation(
      this._app.animation,
      this.style.opacity,
      {
        to: opacity,
        easing: Easing.quad,
        duration: fadeOutMs
      }
    )

    this.visible = true
    anim.start(() => callback && process.nextTick(callback))
  }

  hide (callback) {
    const anim = new TimingAnimation(
      this._app.animation,
      this.style.opacity,
      {
        to: 0,
        easing: Easing.quad,
        duration: this.props.fadeInMs
      }
    )

    anim.start(() => {
      this.visible = false
      callback && process.nextTick(callback)
    })
  }
}
