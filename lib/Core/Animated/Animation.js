/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

'use strict'

export class Animation {
  /**
   * Flag indicating whether the animation has finished.
   *
   * @type {boolean}
   */
  finished = false

  constructor (manager) {
    this._manager = manager
  }

  update (delta) {
    return false
  }

  /**
   * Start the animation.
   *
   * @param callback Optional callback that is activated when the animation has finished.
   */
  start (callback) {
    this._manager.add(this)
    this._callback = callback

    return this
  }

  /**
   * Stop the animation if it is currently running.
   */
  stop () {
    if (!this.finished) {
      this.finished = true
      this._callback && this._callback()
      this._callback = undefined
    }
  }
}
