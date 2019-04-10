/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'

/**
 * Checks if a promise has been rejected. If the promise was fulfilled, an assertion error is thrown.
 *
 * When using in a test method, mark the test method as async. Then: await isRejected(promiseUnderTest)
 *
 * @param promise The promise to await.
 * @returns {Promise<void>}
 */
export async function isRejected (promise) {
  try {
    await promise
  } catch (err) {
    return
  }

  assert.fail('Expected promise to be rejected.')
}
