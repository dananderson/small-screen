/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import EventEmitter from 'events'

export class AbortSignal extends EventEmitter {
  constructor () {
    super()
    this.aborted = false
  }

  abort () {
    this.aborted = true
    this.emit('abort')
  }
}
