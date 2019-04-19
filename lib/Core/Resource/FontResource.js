/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Resource } from './Resource'
import { SmallScreenError } from '../Util/SmallScreenError'
import { FONT_STYLE_NORMAL, FONT_WEIGHT_NORMAL } from '../Style/Constants'

let { INIT, LOADING, LOADED, ATTACHED, ERROR } = Resource

export class FontResource extends Resource {
  constructor ({ fontFamily, fontStyle, fontWeight, fontSize }) {
    super()

    this.font = null
    this.texture = null
    this.fontFamily = fontFamily
    this.fontWeight = fontWeight || FONT_WEIGHT_NORMAL
    this.fontStyle = fontStyle || FONT_STYLE_NORMAL
    this.fontSize = fontSize
  }

  async _load ({ fontStore }) {
    this._transition(LOADING)

    if (this.font) {
      this._transition(LOADED)
      return
    }

    try {
      this.font = await fontStore.getSample(this.fontFamily, this.fontStyle, this.fontWeight, this.fontSize)
    } catch (err) {
      this._transition(ERROR, err)
      throw new SmallScreenError('Failed to load font sample.', err)
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
