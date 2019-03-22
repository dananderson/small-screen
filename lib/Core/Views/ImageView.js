/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import { Resource } from '../Resource/Resource'
import { ImageResource } from '../Resource/ImageResource'
import { emptySize, getSourceId } from '../Util'
import emptyObject from 'fbjs/lib/emptyObject'
import Yoga from 'yoga-layout'

// Force minifier to inline these constants.
const emptyImage = ImageResource.EMPTY
const RESOURCE_ERROR = Resource.ERROR
const RESOURCE_ATTACHED = Resource.ATTACHED
const EDGE_LEFT = Yoga.EDGE_LEFT
const EDGE_TOP = Yoga.EDGE_TOP
const EDGE_RIGHT = Yoga.EDGE_RIGHT
const EDGE_BOTTOM = Yoga.EDGE_BOTTOM
const OVERFLOW_HIDDEN = Yoga.OVERFLOW_HIDDEN
const UNIT_PERCENT = Yoga.UNIT_PERCENT

// Force minifier to use variable.
let emptyCallback = (view) => {}

export class ImageView extends View {
  constructor (props, app) {
    super(props, app)

    // TODO: should this move to the super class?
    const { focusDelegate, focusable, onKeyUp, onKeyDown, onFocus, onBlur, onLoad, onError, src } = this.props

    this.focusDelegate = focusDelegate
    this.focusable = focusable
    this.onKeyUp = onKeyUp
    this.onKeyDown = onKeyDown
    this.onFocus = onFocus
    this.onBlur = onBlur

    this._onLoad = onLoad || emptyCallback
    this._onError = onError || emptyCallback

    this.node.setMeasureFunc(() => {
      const { _res } = this
      return (_res && _res.hasDimensions) ? _res : emptySize
    })

    this._loadListener = this._errorListener = null
    this._res = emptyImage
    this._src = emptyObject
    this._setImageResource(src)
  }

  draw (ctx) {
    const { node, _res, style } = this

    if (!_res.isAttached) {
      return
    }

    const paddingLeft = node.getComputedPadding(EDGE_LEFT)
    const paddingTop = node.getComputedPadding(EDGE_TOP)
    const clip = node.getOverflow() === OVERFLOW_HIDDEN
    let { left, top, width, height } = node.getComputedLayout()

    left += paddingLeft
    top += paddingTop
    width -= (paddingLeft + node.getComputedPadding(EDGE_RIGHT))
    height -= (paddingTop + node.getComputedPadding(EDGE_BOTTOM))

    ctx.pushStyle(style)
    clip && ctx.pushClipRect(left, top, width, height)

    const { capInsets, texture } = _res

    if (capInsets) {
      ctx.blit(texture, capInsets, left, top, width, height)
    } else {
      ctx.blit(texture, undefined, ...calculateImageRectangle(_res, style, left, top, width, height))
    }

    this._isDirty = false

    clip && ctx.popClipRect()
    ctx.popStyle()
  }

  appendChild (child) {
    throw Error('Image element cannot append child elements.')
  }

  removeChild (child) {
    throw Error('Image element does not support child elements')
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
      const { hasDimensions, _state } = image

      if (hasDimensions) {
        this.node.markDirty()
      }

      if (_state === RESOURCE_ERROR) {
        this._onError(this)
      } else if (_state === RESOURCE_ATTACHED) {
        this._onLoad(this)
      } else {
        image.on('attached', this._errorListener = (resource) => {
          if (resource === this._res) {
            this.node.markDirty()
            this._removeImageListeners()
            this._onLoad(this)
          }
        })
        image.on('error', this._loadListener = (resource) => {
          if (resource === this._res) {
            this.node.markDirty()
            this._removeImageListeners()
            this._onError(this)
          }
        })
      }
    }
  }

  updateProps (props) {
    super.updateProps(props)

    // TODO: should this move to the super class?
    const { focusDelegate, focusable, onKeyUp, onKeyDown, onFocus, onBlur, onLoad, onError } = this.props

    this.focusDelegate = focusDelegate
    this.focusable = focusable
    this.onKeyUp = onKeyUp
    this.onKeyDown = onKeyDown
    this.onFocus = onFocus
    this.onBlur = onBlur

    this._onLoad = onLoad || emptyCallback
    this._onError = onError || emptyCallback

    if (getSourceId(props.src) !== getSourceId(this._src)) {
      this._setImageResource(props.src)
    }
  }

  destroy () {
    this._clearImageResource()
    super.destroy()
  }

  _clearImageResource () {
    this._removeImageListeners()
    this._app.resource.releaseBySource(this._src)
    this._res = emptyImage
    this._src = emptyObject
  }

  _removeImageListeners () {
    const { _res, _errorListener, _loadListener } = this

    if (_res) {
      _res.off('error', _errorListener)
      _res.off('attached', _loadListener)
    }

    this._loadListener = this._errorListener = null
  }
}

function calculateImageRectangle ({ width, height, aspectRatio }, { objectFit, objectPositionX, objectPositionY }, x, y, boxWidth, boxHeight) {
  let fitWidth = boxWidth
  let fitHeight = boxHeight

  if (objectFit && objectFit !== 'fill') {
    switch (objectFit) {
      case 'none':
        fitWidth = width
        fitHeight = height
        break
      case 'contain':
        if (aspectRatio > (boxWidth / boxHeight)) {
          fitHeight = boxWidth / aspectRatio
        } else {
          fitWidth = boxHeight * aspectRatio
        }
        break
      case 'cover':
        if (aspectRatio > (boxWidth / boxHeight)) {
          fitWidth = boxHeight * aspectRatio
        } else {
          fitHeight = boxWidth / aspectRatio
        }
        break
      default: // scale-down
        if (width > boxWidth || height > boxHeight) {
          // contain
          if (aspectRatio > (boxWidth / boxHeight)) {
            fitHeight = boxWidth / aspectRatio
          } else {
            fitWidth = boxHeight * aspectRatio
          }
        } else {
          // none
          fitWidth = width
          fitHeight = height
        }
        break
    }
  }

  let dx
  let dy

  if (objectPositionX) {
    if (objectPositionX === 'right') {
      dx = boxWidth - fitWidth
    } else {
      const { unit, value } = objectPositionX

      dx = (unit === UNIT_PERCENT) ? (boxWidth * value - fitWidth * value) << 0 : value
    }
  } else {
    dx = (boxWidth * 0.5 - fitWidth * 0.5) << 0
  }

  if (objectPositionY) {
    if (objectPositionY === 'bottom') {
      dy = boxHeight - fitHeight
    } else {
      const { unit, value } = objectPositionY

      dy = (unit === UNIT_PERCENT) ? (boxHeight * value - fitHeight * value) << 0 : value
    }
  } else {
    dy = (boxHeight * 0.5 - fitHeight * 0.5) << 0
  }

  return [ x + dx, y + dy, fitWidth, fitHeight ]
}
