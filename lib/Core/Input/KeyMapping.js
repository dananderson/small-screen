/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Key } from './Key'

export class KeyMapping {
  constructor (mapping) {
    this._buttons = []
    this._keys = []

    if (mapping) {
      for (const id in Key) {
        const match = mapping[id].match(/b(\d+)/)

        if (!match) {
          throw Error(`Invalid key mapping ${mapping[id]} in ${id}`)
        }

        const button = parseInt(match[1])
        const key = Key[id]

        this._buttons[key] = button
        this._keys[button] = key
      }
    }
  }

  getKey (button) {
    return this._keys[button]
  }

  setKey (key, button) {
    this._buttons[key] = button
    this._keys[button] = key
  }

  serialize () {
    const mapping = {}

    this._buttons.forEach((b, k) => {
      mapping[Key.id(k)] = 'b' + b
    })

    return mapping
  }
}
