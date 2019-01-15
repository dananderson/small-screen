/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import { TextLayout } from './TextLayout'
import { Style } from '../Style/Style'
import { fontId as fontIdFunc } from '../Util'

const emptySize = { width: 0, height: 0 }

export class TextView extends View {
  constructor (props, app) {
    super(props, app)

    this.numberOfLines = this.props.numberOfLines === undefined ? 1 : this.props.numberOfLines

    // MEASURE_MODE_UNDEFINED: 0,
    // MEASURE_MODE_EXACTLY: 1,
    // MEASURE_MODE_AT_MOST: 2,

    // TODO: consider style.lineHeight
    // TODO: measure assumes a width of 'exactly' and a height of 'at most' or 'undefined', which is the common case.
    // TODO: this implementation assumes width === exactly and height === undefined / at most. this covers the
    //       gallery use cases, but the css style spec is not fully supported

    this.layout.setMeasureFunc((width, widthMeasureMode, height, heightMeasureMode) => {
      const font = this.fontResource

      if (!font || !font.metrics) {
        return emptySize
      }

      const { metrics } = font

      return this.textLayout.render(metrics, width, height, this._getMaxNumberOfLines(metrics, height))
    })

    this._setText(props.children, this.style)
  }

  draw (ctx) {
    const font = this.fontResource

    if (!font || !font.isAttached) {
      return
    }

    const { left, top, width, height } = this.layout.getComputedLayout()
    const { metrics } = font

    ctx.setStyle(this.style)

    const { stream, lineOffset } = this.textLayout.render(
      metrics,
      width,
      height,
      this._getMaxNumberOfLines(metrics, height)
    )

    ctx.drawGlyphs(
      font,
      left,
      top,
      stream,
      lineOffset
    )

    this._isDirty = false

    ctx.clearStyle()
  }

  _getMaxNumberOfLines (metrics, height) {
    if (height <= 0) {
      return 0
    }

    const maxLines = (height / metrics.lineHeight) << 0 // Math.floor

    return this.numberOfLines ? Math.min(maxLines, this.numberOfLines) : maxLines
  }

  appendChild (child) {

  }

  removeChild (child) {

  }

  _setText (text, style) {
    if (typeof text !== 'string') {
      throw Error('Expected a string. <text> elements should only have 1 text node child.')
    }

    if (text !== this.text) {
      switch (style.textTransform) {
        case 'uppercase':
          text = text.toUpperCase()
          break
        case 'lowercase':
          text = text.toLowerCase()
          break
      }

      this.textLayout = new TextLayout(text)
      this.layout.markDirty()
    }

    const fontId = (style.fontFamily && style.fontSize) ? fontIdFunc(style.fontFamily, style.fontSize) : undefined

    if (fontId !== this.fontId) {
      this._clearFontResource()

      if (fontId) {
        const resource = this._app.resource

        if (resource.hasResource(fontId)) {
          this.fontResource = resource.getResource(fontId)
          resource.addRef(fontId)
        } else {
          this.fontResource = resource.addBitmapFontResourceByFontId(fontId)
          this.removeFontResource = true
        }

        this.fontId = fontId
        this._addMetricsListener()
      }
    }
  }

  _clearFontResource () {
    if (this.removeFontResource) {
      this._app.resource.removeResource(this.fontId)
      this.fontId = this.removeFontResource = undefined
    }

    this._removeMetricsListener()
    this.fontResource = undefined
  }

  _addMetricsListener () {
    if (this.fontResource) {
      if (this.fontResource.metrics) {
        this.layout.markDirty()
      } else {
        this.fontResource.on('metrics', this.fontResourceListener = (resource) => {
          if (resource === this.fontResource) {
            this._removeMetricsListener()
            this.layout.markDirty()
          }
        })
      }
    }
  }

  _removeMetricsListener () {
    if (this.fontResource && this.fontResourceListener) {
      this.fontResource.removeListener('metrics', this.fontResourceListener)
      this.fontResourceListener = undefined
    }
  }

  updateProps (props) {
    this.props = props
    this.style = props.style || Style.EMPTY
    this._setText(props.children, this.style)
  }

  destroy () {
    super.destroy()
    this._clearFontResource()
  }
}
