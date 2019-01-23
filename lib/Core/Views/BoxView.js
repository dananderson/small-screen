/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import PropTypes from 'prop-types'

export class BoxView extends View {
  static propTypes = {
    style: PropTypes.object
  }

  static defaultProps = {
    style: {}
  }

  constructor (props, app) {
    super(props, app)

    const { focusDelegate, focusable, onKeyUp, onKeyDown, onFocus, onBlur } = this.props

    this.focusDelegate = focusDelegate
    this.focusable = focusable
    this.onKeyUp = onKeyUp
    this.onKeyDown = onKeyDown
    this.onFocus = onFocus
    this.onBlur = onBlur
  }

  draw (ctx) {
    const { node, style } = this
    const { borderColor, backgroundColor } = style
    const { left, top, width, height } = node.getComputedLayout()
    const clip = node.getOverflow() === 1 /* Yoga.OVERFLOW_HIDDEN */

    ctx.pushStyle(style)
    clip && ctx.pushClipRect(left, top, width, height)

    backgroundColor !== undefined && ctx.fillRect(left, top, width, height)

    let borderWidth

    if (borderColor !== undefined) {
      ctx.border(
        left,
        top,
        width,
        height,
        node.getBorder(0 /* Yoga.EDGE_LEFT */) || (borderWidth = node.getBorder(8 /* Yoga.EDGE_ALL */) || 0),
        node.getBorder(1 /* Yoga.EDGE_TOP */) || borderWidth,
        node.getBorder(2 /* Yoga.EDGE_RIGHT */) || borderWidth,
        node.getBorder(3 /* Yoga.EDGE_BOTTOM */) || borderWidth
      )
    }

    super.draw(ctx)

    clip && ctx.popClipRect()
    ctx.popStyle()
  }
}
