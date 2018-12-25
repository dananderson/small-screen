/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export function rethrow (error, caught) {
  error.stack = error.stack.split('\n')
    .slice(0, 2)
    .join('\n') + '\n' + caught.stack

  return error
}
