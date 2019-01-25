/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { FastEventEmitter } from './FastEventEmitter'
import AbortController from 'abort-controller'
import { toSource, getSourceId, SourceType } from './Source'

export const abortController = new AbortController()

export {
  FastEventEmitter,

  toSource,
  getSourceId,
  SourceType
}
