/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { setThreadPoolSize, getThreadPoolSize } from '../../../../lib/Core/Util/small-screen-lib'
import { assert } from 'chai'
import os from 'os'

describe('small-screen-lib', () => {
  describe('setThreadPoolSize()', () => {
    it('should set thread pool size to 2', () => {
      setThreadPoolSize(2)
      assert.equal(getThreadPoolSize(), 2)
    })
    it('should set thread pool size to the number of cpus on the system', () => {
      setThreadPoolSize(0)
      assert.equal(getThreadPoolSize(), os.cpus().length)
    })
    it('should throw Error for negative numbers', () => {
      assert.throws(() => setThreadPoolSize(-1))
    })
    it('should throw Error for non-numbers', () => {
      assert.throws(() => setThreadPoolSize(undefined))
    })
    afterEach(() => {
      setThreadPoolSize(0)
    })
  })
})
