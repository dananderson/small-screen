/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { FastEventEmitter } from './FastEventEmitter'
import { toSource, getSourceId, SourceType } from './Source'
import { AbortSignal } from './AbortSignal'

function clamp (value, min, max) {
  return value <= min ? min : value >= max ? max : value
}

const abortController = new AbortSignal()

export {
  FastEventEmitter,

  toSource,
  getSourceId,
  SourceType,

  abortController,

  clamp
}
