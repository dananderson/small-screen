/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Style } from '../../lib/Style/Style'

chai.use(chaiAsPromised)

describe('Style()', () => {
  it('should parse focus pseudo class', () => {
    assert.deepEqual(Style({
      color: 'black',
      focus: {
        color: 'red'
      }
    }),
    {
      color: 0,
      isStyle: true,
      focus: {
        color: 0xFF0000,
        isStyle: true
      }
    }
    )
  })
  it('should parse colors', () => {
    assert.deepEqual(Style({
      color: '#000',
      backgroundColor: '#000',
      borderColor: '#000'
    }
    ), {
      color: 0,
      backgroundColor: 0,
      borderColor: 0,
      isStyle: true
    })
  })
})
