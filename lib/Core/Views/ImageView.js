/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import { ImageResource } from '../Resource/ImageResource'
import { getSourceId } from '../Util'
import emptyObject from 'fbjs/lib/emptyObject'

const emptySize = Object.freeze({ width: 0, height: 0 })
const emptyImage = new ImageResource({})

export class ImageView extends View {
  constructor (props, app) {
    super(props, app)

    // TODO: should this move to the super class?
    const { focusDelegate, focusable, onKeyUp, onKeyDown, onFocus, onBlur } = this.props

    this.focusDelegate = focusDelegate
    this.focusable = focusable
    this.onKeyUp = onKeyUp
    this.onKeyDown = onKeyDown
    this.onFocus = onFocus
    this.onBlur = onBlur

    this.node.setMeasureFunc(() => {
      const image = this._res
      return (image && image.hasDimensions) ? image : emptySize
    })

    this._res = emptyImage
    this._src = emptyObject
    this._setImageResource(props.src)
  }

  draw (ctx) {
    const { node, _res, style } = this

    if (!_res.isAttached) {
      return
    }

    const paddingLeft = node.getComputedPadding(0 /* Yoga.EDGE_LEFT */)
    const paddingTop = node.getComputedPadding(1 /* Yoga.EDGE_TOP */)
    const clip = node.getOverflow() === 1 /* Yoga.OVERFLOW_HIDDEN */
    let { left, top, width, height } = node.getComputedLayout()

    left += paddingLeft
    top += paddingTop
    width -= (paddingLeft + node.getComputedPadding(2 /* Yoga.EDGE_RIGHT */))
    height -= (paddingTop + node.getComputedPadding(3 /* Yoga.EDGE_BOTTOM */))

    ctx.pushStyle(style)
    clip && ctx.pushClipRect(left, top, width, height)

    if (_res.capInsets) {
      ctx.blitCapInsets(_res.texture, _res.capInsets, left, top, width, height)
    } else {
      blit(ctx, _res, style.objectFit, left, top, width, height)
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
    let image = resource.acquireResourceBySource(src)

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
      if (image.hasDimensions) {
        this.node.markDirty()
      } else {
        image.once('loaded', (resource) => {
          if (resource === this._res) {
            this.node.markDirty()
          }
        })
      }
    }
  }

  updateProps (props) {
    super.updateProps(props)
    if (getSourceId(props.src) !== getSourceId(this._src)) {
      this._setImageResource(props.src)
    }
  }

  destroy () {
    this._clearImageResource()
    super.destroy()
  }

  _clearImageResource () {
    this._app.resource.releaseResourceBySource(this._src)
    this._res = emptyImage
    this._src = emptyObject
  }
}

function blit (ctx, image, objectFit, left, top, width, height) {
  let w = width
  let h = height

  if (objectFit === 'scale-down') {
    objectFit = (image.width > width || image.height > height) ? 'contain' : 'none'
  }

  if (objectFit === 'none') {
    w = image.width
    h = image.height
  } else if (objectFit === 'contain') {
    const { aspectRatio } = image

    if (aspectRatio > (width / height)) {
      h = width / aspectRatio
    } else {
      w = height * aspectRatio
    }
  } else if (objectFit === 'cover') {
    const { aspectRatio } = image

    if (aspectRatio > (width / height)) {
      w = height * aspectRatio
    } else {
      h = width / aspectRatio
    }
  }

  // TODO: object position is fixed at 50% 50%.
  ctx.blit(image.texture, left + (width * 0.5 - w * 0.5) << 0, top + (height * 0.5 - h * 0.5) << 0, w, h)
}
