/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import { Style } from '../Style/Style'
import { TextLayout } from '../Util/small-screen-lib'

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
        return // undefined equivalent to { width: 0, height: 0 }
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
    const { _res, text } = this

    if (!_res || !_res.isAttached || !text) {
      return
    }

    const { node, _layout, style } = this
    const [ left, top, width, height ] = node.getBorderBox()
    let { maxLines, textOverflow, textAlign, rotate } = style

    ctx.pushStyle(style)

    ctx.drawText(
      text,
      left,
      top,
      width,
      height,
      _res.font,
      _res.texture,
      _layout,
      TEXT_ALIGN[textAlign],
      maxLines,
      textOverflow === 'ellipsis',
      rotate
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

  _destroyHook () {
    this._res = this._layout = undefined
    super._destroyHook()
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
