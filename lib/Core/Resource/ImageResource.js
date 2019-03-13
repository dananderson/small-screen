/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Resource } from './Resource'
import { Image } from './Image'
import fetch from 'node-fetch'
import { SmallScreenError } from '../Util/SmallScreenError'
import { CapInsets } from '../Util/small-screen-lib'
import { abortController, SourceType } from '../Util'

const INIT = Resource.INIT
const LOADING = Resource.LOADING
const LOADED = Resource.LOADED
const ATTACHED = Resource.ATTACHED
const ERROR = Resource.ERROR

export class ImageResource extends Resource {
  static EMPTY = new ImageResource({})

  constructor (src) {
    super()

    this.width = this.height = this.aspectRatio = 0
    this.hasDimensions = false
    this.texture = null
    const { capInsets } = src
    this.capInsets = capInsets ? new CapInsets(capInsets) : null

    this._src = src
    this._image = null
  }

  async _load ({ graphics }) {
    this._transition(LOADING)

    let { uri, data, type } = this._src
    let source

    switch (type) {
      case SourceType.REMOTE: {
        let res
        try {
          res = await fetch(uri, { signal: abortController.signal })

          // If state changed after await, bail.
          if (this._state !== LOADING) {
            return
          }

          source = await res.buffer()

          // If state changed after await, bail.
          if (this._state !== LOADING) {
            return
          }
        } catch (err) {
          if (err.name !== 'AbortError' && this._state === LOADING) {
            this._clearImage()
            this._transition(ERROR, err)
            throw new SmallScreenError(`Cannot fetch image from ${uri}`, err)
          } else {
            // If state changed after await, bail.
            return
          }
        }
      }
        break
      case SourceType.BASE64:
        source = Buffer.from(data, 'base64')
        break
      case SourceType.UTF8:
        source = data
        break
      case SourceType.FILE:
        source = uri
        break
      default:
        throw Error(`Unsupported source type: ${type}`)
    }

    const image = this._image = new Image()

    try {
      await image.load(source, { ...this._src, format: graphics.textureFormat })

      // If state changed after await, bail.
      if (this._state !== Resource.LOADING) {
        return
      }
    } catch (err) {
      if (this._state === LOADING) {
        this._transition(ERROR, err)
        this._clearImage()
        throw new SmallScreenError('Cannot load image ' + uri)
      } else {
        // If state changed after await, bail.
        return
      }
    }

    const { width, height } = image

    this.width = width
    this.height = height
    this.aspectRatio = height > 0 ? width / height : 0
    this.hasDimensions = true

    this._transition(LOADED)
  }

  _attach ({ graphics }) {
    try {
      this.texture = graphics.createTexture(this._image)
    } catch (err) {
      this._transition(ERROR, err)
      throw new SmallScreenError('Failed to attach texture.', err)
    } finally {
      this._clearImage()
    }

    this._transition(ATTACHED)
  }

  _detach ({ graphics }) {
    if (this._state === ATTACHED) {
      graphics.destroyTexture(this.texture)
      this._clearImage()
      this.texture = undefined
      this._state = INIT
      this.emit('detached', this)
    }
  }

  _clearImage () {
    this._image && this._image.release()
    this._image = undefined
  }
}
