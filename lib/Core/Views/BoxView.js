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
import { EDGE_ALL, OVERFLOW_HIDDEN } from '../Util/Yoga'
import { HINT_HAS_BORDER, HINT_HAS_BORDER_RADIUS, HINT_HAS_PADDING, HINT_LAYOUT_ONLY } from '../Style/Style'

// Force minifier to inline these constants.
const emptyImage = ImageResource.EMPTY

// Force minifier to use variable.
let ZEROES = [0, 0, 0, 0]

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
    const [ left, top, width, height ] = node.getBorderBox()
    const clip = node.getOverflow() === OVERFLOW_HIDDEN

    ctx.pushStyle(style)
    clip && ctx.pushClipRect(left, top, width, height)

    style[HINT_LAYOUT_ONLY] || this._drawBackground(ctx, left, top, width, height)
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

  _drawBackground (ctx, left, top, width, height) {
    const { style, node, _res } = this
    const { borderColor, backgroundColor, backgroundImage } = style
    const border = getBorder(style, node)
    const shouldDrawBorder = style[HINT_HAS_BORDER] && borderColor >= 0
    const [ dx, dy, dw, dh ] = getBackgroundClipOffsets(style, node, border)

    if (backgroundImage && _res.isAttached) {
      // TODO: add opacity, size, position and tint color support
      ctx.blit(_res.texture, _res.capInsets, undefined, 0, 0, left + dx, top + dy, width + dw, height + dh)

      if (shouldDrawBorder) {
        ctx.border(left, top, width, height, ...border)
      }
    } else if (style[HINT_HAS_BORDER_RADIUS]) {
      const borderRadius = getBorderRadius(style)

      if (backgroundColor >= 0) {
        // When the SVG renderer draws the border, the outer edges have anti-aliased pixels where the background
        // can be seen (creating a slight halo effect). So, shrink the background just a little to avoid poke through.
        // This is probably a bug in the SVG renderer.
        const adjust = shouldDrawBorder ? 1 : 0

        ctx.fillRectRounded(left + dx + adjust, top + dy + adjust, width + dw - adjust * 2, height + dh - adjust * 2, ...borderRadius)
      }

      if (shouldDrawBorder) {
        ctx.borderRounded(left, top, width, height, node.getBorder(EDGE_ALL) || 0, ...borderRadius)
      }
    } else {
      if (backgroundColor >= 0) {
        ctx.fillRect(left + dx, top + dy, width + dw, height + dh)
      }

      if (shouldDrawBorder) {
        ctx.border(left, top, width, height, ...border)
      }
    }
  }
}

function getPadding (style, node) {
  return style[HINT_HAS_PADDING] ? node.getComputedPadding() : ZEROES
}

function getBorder (style, node) {
  return style[HINT_HAS_BORDER] ? node.getComputedBorder() : ZEROES
}

function getBorderRadius ({ borderRadius, borderRadiusTopLeft, borderRadiusTopRight, borderRadiusBottomRight, borderRadiusBottomLeft }) {
  return [
    borderRadiusTopLeft || borderRadius,
    borderRadiusTopRight || borderRadius,
    borderRadiusBottomRight || borderRadius,
    borderRadiusBottomLeft || borderRadius
  ]
}

function getBackgroundClipOffsets (style, node, border) {
  if (style.backgroundClip === 'padding-box') {
    const [ bTop, bRight, bBottom, bLeft ] = border
    const [ pTop, pRight, pBottom, pLeft ] = getPadding(style, node)
    const dx = pLeft + bLeft
    const dy = pTop + bTop

    return [ dx, dy, -(dx + pRight + bRight), -(dy + pBottom + bBottom) ]
  }

  return ZEROES
}
