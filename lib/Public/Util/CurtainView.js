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
    const obj = { ...props }

    obj.style = {
      ...Style.absoluteFillObject,
      backgroundColor: 'black',
      opacity: new Value(0)
    }

    if (obj.fadeOutMs === undefined) {
      obj.fadeOutMs = 500
    }

    if (obj.fadeInMs === undefined) {
      obj.fadeInMs = 500
    }

    if (obj.opacity === undefined) {
      obj.opacity = 255
    }

    super(obj, app)
  }

  show (callback) {
    const app = this._app

    this.visible = true
    app.animation.add(new TimingAnimation(
      app.animation,
      this.style.opacity,
      {
        to: this.props.opacity,
        easing: Easing.quad,
        duration: this.props.fadeOutMs
      })).start(() => callback && process.nextTick(callback))
  }

  hide (callback) {
    const app = this._app

    app.animation.add(new TimingAnimation(
      this.style.opacity,
      {
        to: 0,
        easing: Easing.quad,
        duration: this.props.fadeInMs
      }))
      .start(() => {
        this.visible = false
        callback && process.nextTick(callback)
      })
  }
}
