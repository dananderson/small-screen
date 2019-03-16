/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { FastEventEmitter } from './FastEventEmitter'
import AbortController from 'abort-controller'
import { toSource, getSourceId, SourceType } from './Source'

const abortController = new AbortController()

function clamp (value, min, max) {
  return value <= min ? min : value >= max ? max : value
}

export {
  FastEventEmitter,

  toSource,
  getSourceId,
  SourceType,

  abortController,

  clamp
}

export const emptySize = { width: 0, height: 0 }
