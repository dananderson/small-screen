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
  ALIGN_FLEX_START,
  ALIGN_STRETCH,
  DISPLAY_FLEX,
  EDGE_LEFT,
  FLEX_DIRECTION_COLUMN,
  JUSTIFY_CENTER,
  JUSTIFY_FLEX_START,
  Node,
  OVERFLOW_SCROLL,
  OVERFLOW_VISIBLE,
  POSITION_TYPE_ABSOLUTE,
  POSITION_TYPE_RELATIVE,
  UNIT_AUTO,
  UNIT_PERCENT,
  UNIT_POINT,
  Value,
  WRAP_NO_WRAP,
  WRAP_WRAP
} from '../../../../lib/Core/Util/Yoga'

const INPUT_POINT_PERCENT = [
  [ 5, new Value(UNIT_POINT, 5) ],
  [ '44%', new Value(UNIT_PERCENT, 44) ]
]

const INPUT_POINT_PERCENT_AUTO = [
  ...INPUT_POINT_PERCENT,
  [ 'auto', new Value(UNIT_AUTO) ]
]

const INVALID_INPUT_POINT_PERCENT_AUTO = [
  '%',
  'xxx',
  'x%'
]

const INVALID_INPUT_POINT_PERCENT = [
  ...INVALID_INPUT_POINT_PERCENT_AUTO,
  'auto'
]

describe('bindStyle()', () => {
  let node
  describe('enums', () => {
    it('should assign Yoga enums when given valid string values', () => {
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
    it('should assign default Yoga enum value when given invalid string values', () => {
      testInvalidEnums('junk')
      testInvalidEnums(1)
      testInvalidEnums(null)
      testInvalidEnums(undefined)
    })
  })
  describe('flexBasis', () => {
    it('should set flexBasis with valid inputs', () => {
      testProperty('flexBasis', Node.prototype.getFlexBasis, INPUT_POINT_PERCENT)
    })
    it('should be a no-op for invalid inputs', () => {
      testPropertyWithInvalidValue('flexBasis', Node.prototype.getFlexBasis, INVALID_INPUT_POINT_PERCENT)
    })
  })
  describe('width', () => {
    it('should set width with valid inputs', () => {
      testProperty('width', Node.prototype.getWidth, INPUT_POINT_PERCENT_AUTO)
    })
    it('should be a no-op for invalid inputs', () => {
      testPropertyWithInvalidValue('width', Node.prototype.getWidth, INVALID_INPUT_POINT_PERCENT_AUTO)
    })
  })
  describe('height', () => {
    it('should set height with valid inputs', () => {
      testProperty('height', Node.prototype.getHeight, INPUT_POINT_PERCENT_AUTO)
    })
    it('should be a no-op for invalid inputs', () => {
      testPropertyWithInvalidValue('height', Node.prototype.getHeight, INVALID_INPUT_POINT_PERCENT_AUTO)
    })
  })
  describe('minWidth', () => {
    it('should set minWidth with valid inputs', () => {
      testProperty('minWidth', Node.prototype.getMinWidth, INPUT_POINT_PERCENT)
    })
    it('should throw Error for invalid input', () => {
      testPropertyWithInvalidValue('minWidth', Node.prototype.getMinWidth, INVALID_INPUT_POINT_PERCENT)
    })
  })
  describe('minHeight', () => {
    it('should set minHeight with valid inputs', () => {
      testProperty('minHeight', Node.prototype.getMinHeight, INPUT_POINT_PERCENT)
    })
    it('should throw Error for invalid input', () => {
      testPropertyWithInvalidValue('minHeight', Node.prototype.getMinHeight, INVALID_INPUT_POINT_PERCENT)
    })
  })
  describe('maxWidth', () => {
    it('should set maxWidth with valid inputs', () => {
      testProperty('maxWidth', Node.prototype.getMaxWidth, INPUT_POINT_PERCENT)
    })
    it('should throw Error for invalid input', () => {
      testPropertyWithInvalidValue('maxWidth', Node.prototype.getMaxWidth, INVALID_INPUT_POINT_PERCENT)
    })
  })
  describe('maxHeight', () => {
    it('should set maxHeight with valid inputs', () => {
      testProperty('maxHeight', Node.prototype.getMaxHeight, INPUT_POINT_PERCENT)
    })
    it('should throw Error for invalid input', () => {
      testPropertyWithInvalidValue('maxHeight', Node.prototype.getMaxHeight, INVALID_INPUT_POINT_PERCENT)
    })
  })
  describe('position', () => {
    it('should set position with valid inputs', () => {
      testProperty('left', Node.prototype.getPosition, INPUT_POINT_PERCENT, EDGE_LEFT)
    })
    it('should throw Error for invalid input', () => {
      testPropertyWithInvalidValue('left', Node.prototype.getPosition, INVALID_INPUT_POINT_PERCENT, EDGE_LEFT)
    })
  })
  describe('padding', () => {
    it('should set padding with valid inputs', () => {
      testProperty('paddingLeft', Node.prototype.getPadding, INPUT_POINT_PERCENT, EDGE_LEFT)
    })
    it('should throw Error for invalid input', () => {
      testPropertyWithInvalidValue('paddingLeft', Node.prototype.getPadding, INVALID_INPUT_POINT_PERCENT, EDGE_LEFT)
    })
  })
  describe('margin', () => {
    it('should set margin with valid inputs', () => {
      testProperty('marginLeft', Node.prototype.getMargin, INPUT_POINT_PERCENT_AUTO, EDGE_LEFT)
    })
    it('should throw Error for invalid input', () => {
      testPropertyWithInvalidValue('marginLeft', Node.prototype.getMargin, INVALID_INPUT_POINT_PERCENT_AUTO, EDGE_LEFT)
    })
  })
  beforeEach(() => {
    node = Node.create()
  })
  afterEach(() => {
    node.release()
  })

  function testInvalidEnums (value) {
    const style = Style({
      alignItems: value,
      alignContent: value,
      alignSelf: value,
      display: value,
      flexDirection: value,
      flexWrap: value,
      justifyContent: value,
      overflow: value,
      position: value
    })

    bindStyle(node, style)

    assert.equal(node.getAlignItems(), ALIGN_STRETCH)
    assert.equal(node.getAlignContent(), ALIGN_FLEX_START)
    assert.equal(node.getAlignSelf(), ALIGN_AUTO)
    assert.equal(node.getDisplay(), DISPLAY_FLEX)
    assert.equal(node.getFlexDirection(), FLEX_DIRECTION_COLUMN)
    assert.equal(node.getFlexWrap(), WRAP_NO_WRAP)
    assert.equal(node.getJustifyContent(), JUSTIFY_FLEX_START)
    assert.equal(node.getOverflow(), OVERFLOW_VISIBLE)
    assert.equal(node.getPositionType(), POSITION_TYPE_RELATIVE)
  }

  function testProperty (property, nodeMethod, dataset, edge) {
    dataset.forEach(([ input, expectedValue ]) => {
      bindStyle(node, Style({ [property]: input }))
      assertValue(nodeMethod.call(node, edge), expectedValue)
    })
  }

  function testPropertyWithInvalidValue (property, nodeMethod, dataset, edge) {
    dataset.forEach(input => {
      const before = nodeMethod.call(node, edge)

      bindStyle(node, Style({ [property]: input }))

      assert.deepEqual(nodeMethod.call(node, edge), before)
    })
  }
})

function assertValue (value, expectedValue) {
  assert.equal(value.unit, expectedValue.unit)
  assert.equal(value.value, expectedValue.value)
}
