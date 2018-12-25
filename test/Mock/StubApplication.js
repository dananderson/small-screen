/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { EventEmitter } from 'events'

export class StubApplication {
  resource = {
    hasResource () {
      return true
    },
    getResource () {
      return new EventEmitter()
    },
    removeResource () {

    },
    addRef () {

    }
  }

  _layout = {
    _removeLayoutChangeListener () {

    }
  }
}
