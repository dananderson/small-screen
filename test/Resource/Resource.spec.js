/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Resource } from '../../lib/Resource/Resource'

chai.use(chaiAsPromised)

describe('Resource', () => {
  describe('constructor()', () => {
    it('should start in INIT state', () => {
      assert.equal(resource._getState(), Resource.INIT)
    })
  })

  let resource

  beforeEach(() => {
    resource = new Resource()
  })
})
