/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Style } from '../../../../lib/Core/Style'

chai.use(chaiAsPromised)

describe('Style()', () => {
  it('should parse colors', () => {
    const style = Style({
      color: '#000',
      backgroundColor: '#000',
      borderColor: '#000'
    })

    assert.equal(style.color, 0)
    assert.equal(style.backgroundColor, 0)
    assert.equal(style.borderColor, 0)
  })
})
