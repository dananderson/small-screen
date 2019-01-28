/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import { Style } from '../Style/Style'
import { TextLayout } from '../Util/small-screen-lib'

const emptySize = { width: 0, height: 0 }
const FONT_STYLE_KEYS = [ 'fontFamily', 'fontWeight', 'fontStyle', 'fontSize' ]
const FONT_DISPLAY_KEYS = [ 'maxLines', 'textOverflow', 'lineHeight' ]
const TEXT_ALIGN = {
  left: 0,
  center: 1,
  right: 2
}

export class TextView extends View {
  constructor (props, app) {
    super(props, app)

    this.node.setMeasureFunc((width, widthMeasureMode, height, heightMeasureMode) => {
      const font = this._res

      if (!font || !font.font) {
        return emptySize
      }

      const { maxLines, textOverflow } = this.style

      return this._layout.layout(
        this.text,
        font.font,
        maxLines,
        textOverflow === 'ellipsis',
        width,
        widthMeasureMode,
        height,
        heightMeasureMode
      )
    })

    this.text = ''
    this._res = null
    this._layout = new TextLayout()

    this._update(props.children, this.style)
  }

  draw (ctx) {
    const font = this._res

    if (!font || !font.isAttached || !this.text) {
      return
    }

    const { left, top, width, height } = this.node.getComputedLayout()
    const textLayout = this._layout
    const { maxLines, textOverflow, textAlign } = this.style

    ctx.pushStyle(this.style)

    ctx.drawText(
      this.text,
      left,
      top,
      width,
      height,
      font.font,
      font.texture,
      textLayout,
      TEXT_ALIGN[textAlign],
      maxLines,
      textOverflow === 'ellipsis'
    )

    ctx.popStyle()

    this._isDirty = false
  }

  appendChild (child) {

  }

  removeChild (child) {

  }

  _update (text, style) {
    if (typeof text !== 'string') {
      throw Error('Expected a string. <text> elements should only have 1 text node child.')
    }

    text = textTransform(style, text)

    const resource = this._app.resource

    if (!this._res || (style.fontFamily && style.fontSize >= 0 && hasChange(this.style, style, FONT_STYLE_KEYS))) {
      let font = resource.acquireFont(style)

      if (!font) {
        font = resource.addFont(style)
      }

      this._res = font
      this._layout.reset()

      if (font.font) {
        this.node.markDirty()
      } else {
        font.once('loaded', (resource) => {
          if (resource === this._res) {
            this.node.markDirty()
          }
        })
      }
    } else if ((text !== this.text) || hasChange(this.style, style, FONT_DISPLAY_KEYS)) {
      this._layout.reset()
      this.node.markDirty()
    }

    this.style = style
    this.text = text
  }

  updateProps (props) {
    this.props = props
    this._update(props.children, props.style || Style.EMPTY)
  }

  destroy () {
    this._res = undefined
    super.destroy()
  }
}

function textTransform ({ textTransform }, text) {
  switch (textTransform) {
    case 'uppercase':
      return text.toUpperCase()
    case 'lowercase':
      return text.toLowerCase()
  }

  return text
}

function hasChange (a, b, keys) {
  for (const key of keys) {
    if (a[key] !== b[key]) {
      return true
    }
  }

  return false
}
