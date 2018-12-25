/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import PropTypes from 'prop-types'
import Yoga from 'yoga-layout'

export class BoxView extends View {
  static propTypes = {
    style: PropTypes.object
  }

  static defaultProps = {
    style: {}
  }

  constructor (props, app) {
    super(props, app)

    this.focusDelegate = this.props.focusDelegate
    this.focusable = this.props.focusable
    this.onKeyUp = this.props.onKeyUp
    this.onKeyDown = this.props.onKeyDown
    this.onFocus = this.props.onFocus
    this.onBlur = this.props.onBlur
  }

  draw (ctx) {
    const layout = this.layout
    const { borderColor, backgroundColor } = this.style
    const { left, top, width, height } = layout.getComputedLayout()
    const { clipToBounds } = this.props

    ctx.setStyle(this.style)
    clipToBounds && ctx.pushClipRect(ctx._x + left, ctx._y + top, width, height)

    backgroundColor !== undefined && ctx.fillRect(left, top, width, height)

    let borderWidth

    if (borderColor !== undefined) {
      ctx.border(
        left,
        top,
        width,
        height,
        layout.getBorder(Yoga.EDGE_LEFT) || (borderWidth = layout.getBorder(Yoga.EDGE_ALL) || 0),
        layout.getBorder(Yoga.EDGE_TOP) || borderWidth,
        layout.getBorder(Yoga.EDGE_RIGHT) || borderWidth,
        layout.getBorder(Yoga.EDGE_BOTTOM) || borderWidth
      )
    }

    super.draw(ctx)

    ctx.clearStyle()
    clipToBounds && ctx.popClipRect()
  }
}
