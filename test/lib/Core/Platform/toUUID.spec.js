/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { toUUID } from '../../../../lib/Core/Platform/toUUID'

const GUID = '030000005e040000fd02000003090000'
const UUID = '03000000-5e04-0000-fd02-000003090000'

describe('toUUID', () => {
  it('should convert SDL GUID format to compliant UUID format', () => {
    assert.equal(toUUID(GUID), UUID)
    assert.equal(toUUID(GUID.toUpperCase()), UUID)
  })
  it('should return undefined if passed in GUID is invalid', () => {
    assert.isUndefined(toUUID(undefined))
    assert.isUndefined(toUUID(''))
    assert.isUndefined(toUUID('garbage'))
  })
})
