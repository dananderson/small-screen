/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export class SmallScreenError extends Error {
  constructor (message, error = undefined) {
    super(message)

    Error.captureStackTrace(this, SmallScreenError)

    if (error) {
      this.stack = this.stack.split('\n')
        .slice(0, 2)
        .join('\n') + '\n' + error.stack
    }
  }
}

