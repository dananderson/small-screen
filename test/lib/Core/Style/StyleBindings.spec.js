/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { Style } from '../../../../lib/Core/Style/Style'
import { bindStyle } from '../../../../lib/Core/Style/StyleBindings'
import {
  ALIGN_AUTO,
  ALIGN_CENTER,
  ALIGN_STRETCH,
  DISPLAY_FLEX,
  FLEX_DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  Node,
  OVERFLOW_SCROLL,
  POSITION_TYPE_ABSOLUTE,
  WRAP_WRAP
} from '../../../../lib/Core/Util/Yoga'

describe('bindStyle()', () => {
  let node
  it('should assign Yoga enums when valid string values are given', () => {
    const style = Style({
      alignItems: 'auto',
      alignContent: 'center',
      alignSelf: 'stretch',
      display: 'flex',
      flexDirection: 'column',
      flexWrap: 'wrap',
      justifyContent: 'center',
      overflow: 'scroll',
      position: 'absolute'
    })

    bindStyle(node, style)

    assert.equal(node.getAlignItems(), ALIGN_AUTO)
    assert.equal(node.getAlignContent(), ALIGN_CENTER)
    assert.equal(node.getAlignSelf(), ALIGN_STRETCH)
    assert.equal(node.getDisplay(), DISPLAY_FLEX)
    assert.equal(node.getFlexDirection(), FLEX_DIRECTION_COLUMN)
    assert.equal(node.getFlexWrap(), WRAP_WRAP)
    assert.equal(node.getJustifyContent(), JUSTIFY_CENTER)
    assert.equal(node.getOverflow(), OVERFLOW_SCROLL)
    assert.equal(node.getPositionType(), POSITION_TYPE_ABSOLUTE)
  })
  it('should throw Error when invalid Yoga enum string values are given', () => {
    [ 'alignItems', 'alignContent', 'alignSelf', 'display', 'flexDirection', 'flexWrap', 'justifyContent', 'overflow', 'position' ]
      .forEach(property => {
        [ 'junk', 1 ].forEach(value => {
          assert.throws(() => bindStyle(node, Style({ [property]: value })))
        })
      })
  })
  beforeEach(() => {
    node = Node.create()
  })
  afterEach(() => {
    node && node.destroy()
    node = undefined
  })
})
