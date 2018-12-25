/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Resource } from './Resource'
import { Image } from './Image'

const emptyObject = Object.freeze({})

/**
 * Image resource.
 */
export class ImageResource extends Resource {
  /**
   * Image width.
   *
   * This is available when hasDimensions is true, which is set after the image has loaded.
   *
   * @type {number}
   */
  width = 0

  /**
   * Image height.
   *
   * This is available when hasDimensions is true, which is set after the image has loaded.
   *
   * @type {number}
   */
  height = 0

  /**
   * Texture object that can be submitted to the RenderingContext for display.
   *
   * This is available after the resource has been attached.
   */
  texture

  /**
   * Are the image dimensions (width and height) available?
   *
   * @type {boolean}
   */
  hasDimensions = false

  constructor (filename, options) {
    super()

    this._image = undefined
    this._filename = filename
    this._options = options || emptyObject
  }

  async _load ({ graphicsDevice }) {
    this._setState(Resource.LOADING)
    this._image = new Image()

    try {
      await this._image.load(this._filename, { ...this._options, format: graphicsDevice._renderer.textureFormat })
    } catch (err) {
      if (this._getState() === Resource.LOADING) {
        this._setState(Resource.ERROR)
        // this.emit('error', this)
      }

      this._clearImage()

      throw err
    }

    if (this._getState() === Resource.LOADING) {
      this.width = this._image.width
      this.height = this._image.height
      this.hasDimensions = true
      this.emit('dimensions', this)
    }
  }

  _attach ({ graphicsDevice }) {
    this.texture = graphicsDevice.createTexture(this._image)
    this._clearImage()

    this._setState(Resource.ATTACHED)
    this.emit('attached', this)
  }

  _detach ({ graphicsDevice }) {
    if (this.isAttached) {
      graphicsDevice.destroyTexture(this.texture)
      this.texture = undefined
      this._setState(Resource.DETACHED)
      this.emit('detached', this)
    }

    this._clearImage()
  }

  _clearImage () {
    this._image && this._image.release()
    this._image = undefined
  }
}
