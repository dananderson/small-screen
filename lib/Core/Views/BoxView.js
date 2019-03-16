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
import Yoga from 'yoga-layout'

// Force minifier to inline these constants.
const emptyImage = ImageResource.EMPTY
const EDGE_LEFT = Yoga.EDGE_LEFT
const EDGE_TOP = Yoga.EDGE_TOP
const EDGE_RIGHT = Yoga.EDGE_RIGHT
const EDGE_BOTTOM = Yoga.EDGE_BOTTOM
const EDGE_ALL = Yoga.EDGE_ALL
const OVERFLOW_HIDDEN = Yoga.OVERFLOW_HIDDEN

// Force minifier to use variable.
let borderBoxDeltas = [0, 0, 0, 0]

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
    this._resListener = null
    this._src = emptyObject
    this._setImageResource(this.style.backgroundImage)
  }

  draw (ctx) {
    const { node, style } = this
    const { borderColor, backgroundColor, backgroundImage } = style
    const { left, top, width, height } = node.getComputedLayout()
    const { isAttached, capInsets, texture, hasError } = this._res
    const [ dx, dy, dw, dh ] = getBoxDeltas(style, node)
    const clip = node.getOverflow() === OVERFLOW_HIDDEN

    ctx.pushStyle(style)
    clip && ctx.pushClipRect(left, top, width, height)

    if (backgroundImage && !hasError) {
      // TODO: add opacity, size, position and tint color support
      if (isAttached) {
        if (capInsets) {
          ctx.blitCapInsets(texture, capInsets, left + dx, top + dy, width + dw, height + dh)
        } else {
          ctx.blit(texture, left + dx, top + dy, width + dw, height + dh)
        }
      }
    } else if (backgroundColor !== undefined) {
      ctx.fillRect(left + dx, top + dy, width + dw, height + dh)
    }

    if (borderColor !== undefined) {
      const borderWidth = node.getBorder(EDGE_ALL) || 0

      ctx.border(
        left,
        top,
        width,
        height,
        node.getBorder(EDGE_LEFT) || borderWidth,
        node.getBorder(EDGE_TOP) || borderWidth,
        node.getBorder(EDGE_RIGHT) || borderWidth,
        node.getBorder(EDGE_BOTTOM) || borderWidth
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
        image.on('loaded', this._resListener = (resource) => {
          if (resource === this._res) {
            this._removeResourceListener()
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
    this._removeResourceListener()
    this._res = emptyImage
    this._src = emptyObject
  }

  _removeResourceListener () {
    const { _res, _resListener } = this

    if (_res) {
      _res.off(_resListener)
    }

    this._resListener = null
  }
}

function getBoxDeltas ({ backgroundClip }, node) {
  if (backgroundClip === 'padding-box') {
    const borderWidth = node.getBorder(EDGE_ALL) || 0
    const dx = node.getComputedPadding(EDGE_LEFT) + (node.getBorder(EDGE_LEFT) || borderWidth)
    const dy = node.getComputedPadding(EDGE_TOP) + (node.getBorder(EDGE_TOP) || borderWidth)

    return [
      dx,
      dy,
      -(dx + node.getComputedPadding(EDGE_RIGHT) + (node.getBorder(EDGE_RIGHT) || borderWidth)),
      -(dy + node.getComputedPadding(EDGE_BOTTOM) + (node.getBorder(EDGE_BOTTOM) || borderWidth))
    ]
  }

  return borderBoxDeltas
}
