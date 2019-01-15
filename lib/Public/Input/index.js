/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { getInstance } from '../../Core/Application'

const application = getInstance()

export function on(...args) {
  return application.input.on(...args)
}

export function off(...args) {
  return application.input.off(...args)
}

export function removeListener(...args) {
  return application.input.removeListener(...args)
}

export function enable() {
  application.input.enable()
}

export function disable() {
  application.input.disable()
}

export function setInputActivityListener (listener) {
  application.input.setInputActivityListener(listener)
}

export function removeInputActivityListener () {
  application.input.removeInputActivityListener()
}

export function devices () {
  return application.input.devices()
}
