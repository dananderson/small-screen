/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import { Resource } from '../Resource/Resource'
import { ImageResource } from '../Resource/ImageResource'
import { getSourceId } from '../Util'
import emptyObject from 'fbjs/lib/emptyObject'
import { OVERFLOW_HIDDEN } from '../Util/Yoga'
import { TYPE_POINT, TYPE_PERCENT, TYPE_RIGHT, TYPE_BOTTOM } from '../Style/ObjectPosition'
import { Value } from '../Style/Value'

// Force minifier to inline these constants.
const emptyImage = ImageResource.EMPTY
const RESOURCE_ERROR = Resource.ERROR
const RESOURCE_ATTACHED = Resource.ATTACHED

// Force minifier to use variable.
let emptyCallback = (view) => {}

export class ImageView extends View {
  constructor (props, app) {
    super(props, app, false)

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

    this.node.setMeasureFunc((/* width, widthMeasureMode, height, heightMeasureMode */) => {
      const { _res } = this

      if (_res && _res.hasDimensions) {
        // Yoga will layout correctly, even if the image exceeds the constraints of the measure modes. So, just report
        // the full image size, regardless.
        return _res
      }

      // return undefined is equivalent to { width: 0, height: 0 }
    })

    this._loadListener = this._errorListener = null
    this._res = emptyImage
    this._src = emptyObject
    src && this._setImageResource(src)
  }

  draw (ctx) {
    const { node, _res, style } = this

    if (!_res.isAttached) {
      return
    }

    const clip = node.getOverflow() === OVERFLOW_HIDDEN
    const [ left, top, width, height ] = node.getPaddingBox()

    ctx.setStyle(style)
    clip && ctx.pushClipRect(left, top, width, height)

    blit(ctx, _res, style, left, top, width, height)

    this._isDirty = false

    clip && ctx.popClipRect()
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

  _destroyHook () {
    this._clearImageResource()
    super._destroyHook()
  }

  _clearImageResource () {
    this._removeImageListeners()
    this._app.resource.releaseBySource(this._src)
    this._res = emptyImage
    this._src = emptyObject
  }

  _removeImageListeners () {
    const { _res, _errorListener, _loadListener } = this

    _res.off('error', _errorListener)
    _res.off('attached', _loadListener)

    this._loadListener = this._errorListener = null
  }
}

function blit (ctx, { texture, width, height, aspectRatio, capInsets }, { objectFit, objectPositionX, objectPositionY, rotate }, x, y, boxWidth, boxHeight) {
  let fitWidth = boxWidth
  let fitHeight = boxHeight

  // When the image resource has capInsets, dimensions are unknown. object-fit is forced to fill in this case.

  if (objectFit && !capInsets && objectFit !== 'fill') {
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

  if (objectPositionX) {
    const { type, value } = objectPositionX

    switch (type) {
      case TYPE_POINT:
        dx = value
        break
      case TYPE_PERCENT:
        dx = (boxWidth * value - fitWidth * value)
        break
      case TYPE_RIGHT:
        dx = boxWidth - fitWidth
        break
    }
  } else {
    dx = boxWidth * 0.5 - fitWidth * 0.5
  }

  let dy

  if (objectPositionY) {
    const { type, value } = objectPositionY

    switch (type) {
      case TYPE_POINT:
        dy = value
        break
      case TYPE_PERCENT:
        dy = (boxHeight * value - fitHeight * value)
        break
      case TYPE_BOTTOM:
        dy = boxHeight - fitHeight
        break
    }
  } else {
    dy = boxHeight * 0.5 - fitHeight * 0.5
  }

  ctx.blit(
    texture,
    capInsets,
    rotate instanceof Value ? rotate._value : rotate,
    boxWidth / 2,
    boxHeight / 2,
    x + dx,
    y + dy,
    fitWidth,
    fitHeight)
}
