/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import { Style } from '../Style/Style'
import { FocusManager } from './FocusManager'

export class SceneManager {
  root = null

  constructor (app) {
    this.focus = new FocusManager(app)
  }

  _setRoot (width, height) {
    if (!this.root) {
      this.root = new View({ style: Style({ top: 0, left: 0, width: width, height: height }) })
    }
  }
}
