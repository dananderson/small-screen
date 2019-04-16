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
import {
  COMPUTED_BORDER_BOTTOM, COMPUTED_BORDER_LEFT, COMPUTED_BORDER_RIGHT, COMPUTED_BORDER_TOP,
  COMPUTED_LAYOUT_HEIGHT, COMPUTED_LAYOUT_LEFT, COMPUTED_LAYOUT_TOP, COMPUTED_LAYOUT_WIDTH,
  COMPUTED_PADDING_BOTTOM, COMPUTED_PADDING_LEFT, COMPUTED_PADDING_RIGHT, COMPUTED_PADDING_TOP,
  EDGE_ALL,
  OVERFLOW_HIDDEN
} from '../Util/Yoga'
import {
  BACKGROUND_CLIP_PADDING_BOX,
  HINT_HAS_BORDER,
  HINT_HAS_BORDER_RADIUS,
  HINT_LAYOUT_ONLY
} from '../Style/Constants'

// Force minifier to use variable.
let ZEROES = [0, 0, 0, 0]
let OFFSETS = [0, 0, 0, 0]
let emptyImage = ImageResource.EMPTY

export class BoxView extends View {
  static propTypes = {
    style: PropTypes.object
  }

  static defaultProps = {
    style: {}
  }

  constructor (props, app) {
    super(props, app, true)

    const { focusDelegate, focusable, onKeyUp, onKeyDown, onFocus, onBlur } = this.props

    this.focusDelegate = focusDelegate
    this.focusable = focusable
    this.onKeyUp = onKeyUp
    this.onKeyDown = onKeyDown
    this.onFocus = onFocus
    this.onBlur = onBlur

    this._res = emptyImage
    this._src = emptyObject
    this._resListener = null

    const { backgroundImage } = this.style

    backgroundImage && this._setImageResource(backgroundImage)
  }

  draw (ctx) {
    const { node, style } = this
    const clip = node.getOverflow() === OVERFLOW_HIDDEN

    ctx.pushStyle(style)
    clip && ctx.pushClipRect(node[COMPUTED_LAYOUT_LEFT], node[COMPUTED_LAYOUT_TOP], node[COMPUTED_LAYOUT_WIDTH], node[COMPUTED_LAYOUT_HEIGHT])

    if (!style[HINT_LAYOUT_ONLY]) {
      style[HINT_HAS_BORDER_RADIUS] ? this._drawRoundedBackground(ctx) : this._drawBackground(ctx)
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

    const { resource } = this._app

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
            this._markDirty()
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

  _destroyHook () {
    this._clearImageResource()
    super._destroyHook()
  }

  _clearImageResource () {
    this._app.resource.releaseBySource(this._src)
    this._removeResourceListener()
    this._res = emptyImage
    this._src = emptyObject
  }

  _removeResourceListener () {
    this._res.off(this._resListener)
    this._resListener = null
  }

  _drawBackground (ctx) {
    const { style, node, _res } = this
    const { borderColor, backgroundColor, backgroundImage } = style
    const [ dx, dy, dw, dh ] = getBackgroundClipOffsets(style, node)
    const left = node[COMPUTED_LAYOUT_LEFT]
    const top = node[COMPUTED_LAYOUT_TOP]
    const width = node[COMPUTED_LAYOUT_WIDTH]
    const height = node[COMPUTED_LAYOUT_HEIGHT]

    if (backgroundImage && _res.isAttached) {
      // TODO: add opacity, size, position and tint color support
      ctx.blit(
        _res.texture,
        _res.capInsets,
        undefined,
        0,
        0,
        left + dx,
        top + dy,
        width + dw,
        height + dh
      )
    } else if (backgroundColor >= 0) {
      ctx.fillRect(
        left + dx,
        top + dy,
        width + dw,
        height + dh
      )
    }

    if (style[HINT_HAS_BORDER] && borderColor >= 0) {
      ctx.border(
        left,
        top,
        width,
        height,
        node[COMPUTED_BORDER_TOP],
        node[COMPUTED_BORDER_RIGHT],
        node[COMPUTED_BORDER_BOTTOM],
        node[COMPUTED_BORDER_LEFT])
    }
  }

  _drawRoundedBackground (ctx) {
    const { style, node } = this
    const {
      borderColor,
      backgroundColor,
      borderRadius,
      borderRadiusTopLeft,
      borderRadiusTopRight,
      borderRadiusBottomRight,
      borderRadiusBottomLeft
    } = style
    const left = node[COMPUTED_LAYOUT_LEFT]
    const top = node[COMPUTED_LAYOUT_TOP]
    const width = node[COMPUTED_LAYOUT_WIDTH]
    const height = node[COMPUTED_LAYOUT_HEIGHT]
    const shouldDrawBorder = style[HINT_HAS_BORDER] && borderColor >= 0
    const topLeft = borderRadiusTopLeft || borderRadius || 0
    const topRight = borderRadiusTopRight || borderRadius || 0
    const bottomRight = borderRadiusBottomRight || borderRadius || 0
    const bottomLeft = borderRadiusBottomLeft || borderRadius || 0

    if (backgroundColor >= 0) {
      const [ dx, dy, dw, dh ] = getBackgroundClipOffsets(style, node)

      // When the SVG renderer draws the border, the outer edges have anti-aliased pixels where the background
      // can be seen (creating a slight halo effect). So, shrink the background just a little to avoid poke through.
      // This is probably a bug in the SVG renderer.
      const adjust = shouldDrawBorder ? 1 : 0

      ctx.fillRectRounded(
        left + dx + adjust,
        top + dy + adjust,
        width + dw - adjust * 2,
        height + dh - adjust * 2,
        topLeft,
        topRight,
        bottomRight,
        bottomLeft)
    }

    if (shouldDrawBorder) {
      ctx.borderRounded(
        left,
        top,
        width,
        height,
        node.getBorder(EDGE_ALL) || 0,
        topLeft,
        topRight,
        bottomRight,
        bottomLeft)
    }
  }
}

function getBackgroundClipOffsets (style, node) {
  if (style.backgroundClip === BACKGROUND_CLIP_PADDING_BOX) {
    const dx = node[COMPUTED_PADDING_LEFT] + node[COMPUTED_BORDER_LEFT]
    const dy = node[COMPUTED_PADDING_TOP] + node[COMPUTED_BORDER_TOP]

    OFFSETS[0] = dx
    OFFSETS[1] = dy
    OFFSETS[2] = -(dx + node[COMPUTED_PADDING_RIGHT] + node[COMPUTED_BORDER_RIGHT])
    OFFSETS[3] = -(dy + node[COMPUTED_PADDING_BOTTOM] + node[COMPUTED_BORDER_BOTTOM])

    return OFFSETS
  }

  return ZEROES
}
