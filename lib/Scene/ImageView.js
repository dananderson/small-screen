/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import { ImageResource } from '../Resource/ImageResource'

const emptySize = { width: 0, height: 0 }
const emptyImage = new ImageResource('empty')

export class ImageView extends View {
  constructor (props, app) {
    super(props, app)

    // TODO: should this move to the super class?
    this.focusDelegate = props.focusDelegate
    this.focusable = props.focusable
    this.onKeyUp = props.onKeyUp
    this.onKeyDown = props.onKeyDown
    this.onFocus = props.onFocus
    this.onBlur = props.onBlur

    this.layout.setMeasureFunc((width, widthMeasureMode, height, heightMeasureMode) => {
      // MEASURE_MODE_UNDEFINED: 0,
      // MEASURE_MODE_EXACTLY: 1,
      // MEASURE_MODE_AT_MOST: 2,
      const image = this.imageResource

      if (image && image.hasDimensions) {
        return image
      }

      return emptySize
    })

    this._setImageResource(props.src)
  }

  draw (ctx) {
    const image = this.imageResource

    if (!image.isAttached) {
      return
    }

    const { capInsets } = this.style
    let { left, top, width, height } = this.layout.getComputedLayout()

    ctx.setStyle(this.style)

    // TODO: draw stretched..
    if (capInsets) {
      ctx.blitCapInsets(image, left, top, width, height, capInsets.left, capInsets.top, capInsets.right, capInsets.bottom)
    } else {
      // TODO: move display options to the style sheet or properties
      const { width: iwidth, height: iheight } = image
      const aspectRatio = iwidth / iheight

      if (iwidth > iheight) {
        const h = width / aspectRatio << 0 // Math.floor

        top += (height / 2 - h / 2) << 0 // Math.floor
        height = h
      } else {
        const w = height * aspectRatio << 0 // Math.floor

        left += (width / 2 - w / 2) << 0 // Math.floor
        width = w
      }

      ctx.blit(image, left, top, width, height)
    }

    this._isDirty = false

    ctx.clearStyle()
  }

  appendChild (child) {
    throw Error('Image element cannot append child elements.')
  }

  removeChild (child) {
    throw Error('Image element does not support child elements')
  }

  _setImageResource (src) {
    if (this.imageResource === src || this.imageResourceId === src) {
      return
    }

    this._clearImageResource()

    if (typeof src === 'string') {
      const resource = this._app.resource

      if (resource.hasResource(src)) {
        this.imageResource = resource.getResource(src)
        resource.addRef(src)
      } else {
        this.imageResource = resource.addImageResource(src, src)
      }

      this.imageResourceId = src
    } else if (src instanceof ImageResource) {
      this.imageResource = src
    } else {
      this.imageResource = emptyImage
    }

    this._addDimensionsListener()
  }

  updateProps (props) {
    super.updateProps(props)
    this._setImageResource(props.src)
  }

  destroy () {
    super.destroy()
    this._clearImageResource()
  }

  _addDimensionsListener () {
    if (this.imageResource && this.imageResource !== emptyImage) {
      if (this.imageResource.hasDimensions) {
        this.layout.markDirty()
      } else {
        this.imageResource.on('dimensions', this.imageResourceListener = (resource) => {
          if (resource === this.imageResource) {
            this._removeDimensionsListener()
            this.layout.markDirty()
          }
        })
      }
    }
  }

  _removeDimensionsListener () {
    if (this.imageResource && this.imageResourceListener) {
      this.imageResource.removeListener('dimensions', this.imageResourceListener)
      this.imageResourceListener = undefined
    }
  }

  _clearImageResource () {
    if (this.imageResource === emptyImage) {
      return
    }

    this._app.resource.removeResource(this.imageResourceId)
    this.imageResourceId = undefined

    this._removeDimensionsListener()
    this.imageResource = undefined
  }
}
