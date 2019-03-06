/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import PropTypes from 'prop-types'
import emptyObject from 'fbjs/lib/emptyObject'
import { ImageResource } from '../Resource/ImageResource'
import { getSourceId } from '../Util'

const emptyImage = ImageResource.EMPTY

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

    this._res = emptyImage
    this._src = emptyObject
    this._setImageResource(this.style.backgroundImage)
  }

  draw (ctx) {
    const { node, style } = this
    const { borderColor, backgroundColor, backgroundImage } = style
    const { left, top, width, height } = node.getComputedLayout()
    const clip = node.getOverflow() === 1 /* Yoga.OVERFLOW_HIDDEN */

    ctx.pushStyle(style)
    clip && ctx.pushClipRect(left, top, width, height)

    const res = this._res

    if (backgroundImage && !res.hasError) {
      // TODO: add opacity, size, position and tint color support
      if (res.isAttached) {
        if (res.capInsets) {
          ctx.blitCapInsets(res.texture, res.capInsets, left, top, width, height)
        } else {
          ctx.blit(res.texture, left, top, width, height)
        }
      }
    } else if (backgroundColor !== undefined) {
      ctx.fillRect(left, top, width, height)
    }

    if (borderColor !== undefined) {
      const borderWidth = node.getBorder(8 /* Yoga.EDGE_ALL */) || 0

      ctx.border(
        left,
        top,
        width,
        height,
        node.getBorder(0 /* Yoga.EDGE_LEFT */) || borderWidth,
        node.getBorder(1 /* Yoga.EDGE_TOP */) || borderWidth,
        node.getBorder(2 /* Yoga.EDGE_RIGHT */) || borderWidth,
        node.getBorder(3 /* Yoga.EDGE_BOTTOM */) || borderWidth
      )
    }

    super.draw(ctx)

    clip && ctx.popClipRect()
    ctx.popStyle()
  }

  _setImageResource (src) {
    this._clearImageResource()

    if (!src) {
      return
    }

    const resource = this._app.resource
    let image = resource.acquireBySource(src)

    if (!image) {
      try {
        image = resource.addImage(src)
      } catch (e) {
        console.log(`Invalid src attribute: ${getSourceId(src)}`, e)
        image = emptyImage
        src = emptyObject
      }
    }

    this._res = image
    this._src = src

    if (image !== emptyImage) {
      if (!image.hasDimensions && !image.hasError) {
        image.once('loaded', (resource) => {
          if (resource === this._res) {
            this.markDirty()
          }
        })
      }
    }
  }

  updateProps (props) {
    super.updateProps(props)

    const { onKeyUp, onKeyDown, onFocus, onBlur } = this.props

    this.onKeyUp = onKeyUp
    this.onKeyDown = onKeyDown
    this.onFocus = onFocus
    this.onBlur = onBlur

    const { backgroundImage } = props.style || emptyObject

    if (getSourceId(backgroundImage) !== getSourceId(this.style.backgroundImage)) {
      this._setImageResource(backgroundImage)
    }
  }

  destroy () {
    this._clearImageResource()
    super.destroy()
  }

  _clearImageResource () {
    this._app.resource.releaseBySource(this._src)
    this._res = emptyImage
    this._src = emptyObject
  }
}
