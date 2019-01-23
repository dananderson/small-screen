/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Resource } from './Resource'
import { FontStore } from '../Util/small-screen-lib'
import { SmallScreenError } from '../Util/SmallScreenError'

const INIT = Resource.INIT
const LOADING = Resource.LOADING
const LOADED = Resource.LOADED
const ATTACHED = Resource.ATTACHED
const ERROR = Resource.ERROR

export class FontResource extends Resource {
  constructor ({ fontFamily, fontStyle, fontWeight, fontSize }) {
    super()

    this.font = null
    this.texture = null
    this.fontFamily = fontFamily
    this.fontWeight = fontWeight || 'normal'
    this.fontStyle = fontStyle || 'normal'
    this.fontSize = fontSize
  }

  async _load () {
    this._transition(LOADING)

    if (this.font) {
      this._transition(LOADED)
      return
    }

    // TODO: make this async

    try {
      console.time('font sample')
      this.font = FontStore.sample(this.fontFamily, this.fontStyle, this.fontWeight, this.fontSize)
    } catch (err) {
      this._transition(ERROR, err)
      throw new SmallScreenError('Failed to load font sample.', err)
    } finally {
      console.timeEnd('font sample')
    }

    this._transition(LOADED)
  }

  _attach ({ graphics }) {
    try {
      this.texture = graphics.createFontTexture(this.font)
    } catch (err) {
      this._transition(ERROR, err)
      throw new SmallScreenError('Failed to create font sample texture.', err)
    }

    this._transition(ATTACHED)
  }

  _detach ({ graphics }) {
    if (this.isAttached) {
      if (this.texture) {
        graphics.destroyTexture(this.texture)
        this.texture = undefined
      }
      this._transition(INIT)
    }
  }
}
