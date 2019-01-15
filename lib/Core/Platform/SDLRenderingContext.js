/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export class SDLRenderingContext {
  constructor (SDL) {
    this._lib = SDL
    this._x = this._y = 0
    this._opacity = 255
    this._style = undefined
    this._opacityStack = []
  }

  setStyle (style) {
    this._style = style

    const { opacity } = style

    this._opacityStack.push(this._opacity)

    if (typeof opacity === 'number') {
      this._opacity = (this._opacity * opacity / 255) << 0
    } else if (opacity && opacity.getValue) {
      this._opacity = (this._opacity * opacity.getValue() / 255) << 0
    }
  }

  clearStyle () {
    this._opacity = this._opacityStack.pop()
    this._style = undefined
  }

  pushClipRect (x, y, width, height) {
    this._lib.pushClipRect(this._renderer, x, y, width, height)
  }

  popClipRect () {
    this._lib.popClipRect(this._renderer)
  }

  blit (image, x, y, w, h) {
    const color = this._style.tintColor === undefined ? 0xFFFFFF : this._style.tintColor

    this._lib.blit(this._renderer,
      image.texture,
      color | (this._opacity << 24),
      x + this._x,
      y + this._y,
      w,
      h)
  }

  blitCapInsets (image, x, y, w, h, l, t, r, b) {
    const color = this._style.tintColor === undefined ? 0xFFFFFF : this._style.tintColor

    this._lib.blitCapInsets(this._renderer,
      image.texture,
      color | (this._opacity << 24),
      x + this._x, y + this._y, w, h,
      l, t, r, b)
  }

  drawGlyphs (font, x, y, stream, lineOffset) {
    this._prepareFont(font)

    const renderer = this._renderer
    const { metrics } = font
    const { textAlign } = this._style
    const lineHeight = this._style.lineHeight || metrics.lineHeight
    const { blitSubImage } = this._lib
    const dx = x + this._x
    let id
    let line = 0
    let cursor = dx + (lineOffset[line][textAlign] || 0)
    let len = stream.length

    y += this._y

    for (let i = 0; i < len; i += 2) {
      id = stream[i]

      if (id === 10) {
        cursor = dx + (lineOffset[line++][textAlign] || 0)
        y += lineHeight
      } else if (id !== 32) {
        const { texture, xoffset, yoffset, width, height, sourceBuffer } = metrics.glyph[id]

        blitSubImage(renderer,
          texture,
          sourceBuffer,
          cursor + xoffset,
          y + yoffset,
          width,
          height)
      }

      cursor += stream[i + 1]
    }
  }

  fillRect (x, y, w, h) {
    const color = this._style.backgroundColor || 0

    this._lib.fillRect(this._renderer,
      color | (this._opacity << 24),
      x + this._x,
      y + this._y,
      w,
      h)
  }

  border (x, y, w, h, borderLeft, borderTop, borderRight, borderBottom) {
    const color = this._style.borderColor || 0

    this._lib.rect(this._renderer,
      color | (this._opacity << 24),
      x + this._x,
      y + this._y,
      w,
      h,
      borderLeft,
      borderTop,
      borderRight,
      borderBottom)
  }

  _reset (renderer) {
    this._renderer = renderer
  }

  _prepare () {
    this._lib.prepareFrame(this._renderer)
    this._opacity = 255
  }

  _prepareFont (font) {
    for (const texture of font.textures) {
      this._lib.setTextureTintColor(texture, (this._style.color || 0) | (this._opacity << 24))
    }
  }
}
