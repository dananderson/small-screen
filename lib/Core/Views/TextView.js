/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import { TEXT_OVERFLOW_ELLIPSIS, TEXT_TRANSFORM_LOWERCASE, TEXT_TRANSFORM_UPPERCASE } from '../Style/Constants'
import { Style } from '../Style/Style'
import { TextLayout } from '../Util/small-screen-lib'
import { Value } from '../Style/Value'
import { COMPUTED_LAYOUT_HEIGHT, COMPUTED_LAYOUT_LEFT, COMPUTED_LAYOUT_TOP, COMPUTED_LAYOUT_WIDTH } from '../Util/Yoga'

const FONT_STYLE_KEYS = [ 'fontFamily', 'fontWeight', 'fontStyle', 'fontSize' ]
const FONT_DISPLAY_KEYS = [ 'maxLines', 'textOverflow', 'lineHeight' ]

export class TextView extends View {
  constructor (props, app) {
    super(props, app, false)

    this.node.setMeasureFunc((width, widthMeasureMode, height, heightMeasureMode) => {
      const { _res, style, _layout, text } = this

      if (!_res || !_res.font) {
        return // undefined equivalent to { width: 0, height: 0 }
      }

      const { maxLines, textOverflow } = style

      return _layout.layout(
        text,
        _res.font,
        maxLines,
        textOverflow === TEXT_OVERFLOW_ELLIPSIS,
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
    const { maxLines, textOverflow, textAlign, rotate } = style

    ctx.setStyle(style)

    ctx.drawText(
      text,
      node[COMPUTED_LAYOUT_LEFT],
      node[COMPUTED_LAYOUT_TOP],
      node[COMPUTED_LAYOUT_WIDTH],
      node[COMPUTED_LAYOUT_HEIGHT],
      _res,
      _layout,
      textAlign || 0,
      maxLines,
      textOverflow === TEXT_OVERFLOW_ELLIPSIS,
      rotate instanceof Value ? rotate._value : rotate
    )
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
    case TEXT_TRANSFORM_UPPERCASE:
      return text.toUpperCase()
    case TEXT_TRANSFORM_LOWERCASE:
      return text.toLowerCase()
  }

  return text
}

function hasChange (a, b, keys) {
  if (a !== b) {
    for (const key of keys) {
      if (a[key] !== b[key]) {
        return true
      }
    }
  }

  return false
}
