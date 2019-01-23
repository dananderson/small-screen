/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { application } from '..'

export function on (event, listener) {
  return application.input.on(event, listener)
}

export function off (event, listener) {
  return application.input.off(event, listener)
}

export function enable () {
  application.input.enable()
}

export function disable () {
  application.input.disable()
}

// export function setInputActivityListener (listener) {
//   application.input.setInputActivityListener(listener)
// }
//
// export function removeInputActivityListener () {
//   application.input.removeInputActivityListener()
// }

export function gamepads () {
  return application.input.gamepads()
}
