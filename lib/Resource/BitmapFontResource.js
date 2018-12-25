/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import fs from 'fs'
import { promisify } from 'util'
import { Resource } from './Resource'
import parse from 'parse-bmfont-ascii'
import { dirname, join } from 'path'
import { fontId } from '../Utilities/fontId'
import { rethrow } from '../Utilities/rethrow'
import { Image } from './Image'

/**
 * Bitmap Font Resource
 *
 * Supports AngelCode bitmap font format (.fnt text files).
 */
export class BitmapFontResource extends Resource {
  /**
   * Font metrics.
   *
   * As soon as metrics are available, the resource broadcasts a 'metrics' event. Metrics may be available before
   * the resource is attached (images loaded into graphics memory).
   */
  metrics

  /**
   * Bitmap font textures.
   *
   * Available when the resource is attached to the graphics device. Metrics refers to the indexes of this array
   * for glyph mapping.
   *
   * @type {array}
   */
  textures

  /**
   * @param filename Bitmap font file path. Must be an AngelCode .fnt file.
   */
  constructor (filename) {
    super()

    this._filename = filename
    this._images = undefined
  }

  async _load ({ graphicsDevice }) {
    const resource = this

    this._setState(Resource.LOADING)

    if (!this.metrics) {
      let contents

      try {
        contents = await promisify(fs.readFile)(this._filename, 'UTF-8')
      } catch (err) {
        if (this._getState() === Resource.LOADING) {
          this._setState(Resource.ERROR)
          this.emit('error', this)
        }
        throw rethrow(Error(`Error reading bitmap font file ${this._filename}`), err)
      }

      if (this._getState() !== Resource.LOADING) {
        return
      }

      try {
        this.metrics = resource._parseFont(contents, dirname(this._filename))
      } catch (err) {
        this._setState(Resource.ERROR)
        this.emit('error', this)
        throw rethrow(Error(`Error parsing bitmap font file ${this._filename}`), err)
      }

      this.emit('metrics', this)
    }

    this._images = []

    try {
      for (const page of this.metrics.pages) {
        const image = new Image()

        this._images.push(image)

        await image.load(page, { format: graphicsDevice._renderer.textureFormat })

        if (this._getState() !== Resource.LOADING) {
          this._images.forEach(i => i.release())
          this._images = undefined
          this.metrics = undefined
          break
        }
      }
    } catch (err) {
      this._images.forEach(i => i.release())
      this._images = undefined
      this.metrics = undefined
      if (this._getState() === Resource.LOADING) {
        this._setState(Resource.ERROR)
        this.emit('error', this)
      }
      throw rethrow(Error(`Failed to load image for bitmap font ${this._filename}`), err)
    }
  }

  _attach ({ graphicsDevice }) {
    this.textures = this._images.map(i => graphicsDevice.createTexture(i))
    this.metrics.glyph.forEach(glyph => {
      glyph.texture = this.textures[glyph.page]
      return glyph.texture
    })
    this._images.forEach(i => i.release())
    this._images = undefined
    this._setState(Resource.ATTACHED)
  }

  _detach ({ graphicsDevice }) {
    if (this.isAttached) {
      if (this.textures) {
        for (const texture of this.textures) {
          graphicsDevice.destroyTexture(texture)
        }
        this.textures = undefined
      }

      this.metrics && this.metrics.glyph.forEach(glyph => {
        glyph.texture = null
      })
      this._setState(Resource.DETACHED)
    }
  }

  _parseFont (contents, dir) {
    const bmFont = parse(contents)
    const metrics = new Metrics(bmFont, dir)

    for (const char of bmFont.chars) {
      metrics.glyph[char.id] = new Glyph(char)
    }

    for (const pair of bmFont.kernings) {
      metrics.kerning[((pair.first & 0xFF) << 8) | (pair.second & 0xFF)] = pair.amount
    }

    return metrics
  }
}

function Metrics (bmFont, dir) {
  this.glyphCount = bmFont.chars.length
  this.kerning = []
  this.glyph = []
  this.kerningCount = bmFont.kernings.length
  this.lineHeight = bmFont.common.lineHeight
  this.baseline = bmFont.common.base
  this.family = bmFont.info.face
  this.size = bmFont.info.size
  this.fontId = fontId(bmFont.info.face, bmFont.info.size)
  this.pages = bmFont.pages.map(f => join(dir, f)) // Image files are relative to the .fnt file
}

function Glyph (char) {
  // Cache a source a dest rectangle for each character to improve rendering performance.

  const sourceBuffer = Buffer.alloc(4 * 4)

  sourceBuffer.writeInt32(char.x, 0)
  sourceBuffer.writeInt32(char.y, 4)
  sourceBuffer.writeInt32(char.width, 8)
  sourceBuffer.writeInt32(char.height, 12)

  const destBuffer = Buffer.alloc(4 * 4)

  destBuffer.writeInt32(0, 0)
  destBuffer.writeInt32(0, 4)
  destBuffer.writeInt32(char.width, 8)
  destBuffer.writeInt32(char.height, 12)

  this.id = char.id
  this.x = char.x
  this.y = char.y
  this.width = char.width
  this.height = char.height
  this.xoffset = char.xoffset
  this.yoffset = char.yoffset
  this.xadvance = char.xadvance
  this.page = char.page
  this.texture = undefined
  this.sourceBuffer = sourceBuffer
  this.destBuffer = destBuffer
}
