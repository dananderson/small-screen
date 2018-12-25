/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { applyStyleValueToLayout } from './Style'

const apply = applyStyleValueToLayout

/**
 * Basic value wrapper for animations. Values can be set as style sheet properties and then animated through
 * the animation manager.
 */
export class Value {
  constructor (value) {
    this._value = value
  }

  setValue (value) {
    this._value = value
    this._layout && apply(this._styleKey, value, this._layout)
  }

  getValue () {
    return this._value
  }

  /**
   * Binds this value to a Yoga layout field.
   *
   * @param styleKey Yoga layout field to bind.
   * @param layout Yoga layout node.
   */
  bind (styleKey, layout) {
    this._layout = layout
    this._styleKey = styleKey
  }

  /**
   * Clear all Yoga field bindings.
   */
  release () {
    this._layout = this._styleKey = undefined
  }
}
