/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import {
  UNIT_POINT,
  Node,
  Value,
  UNIT_PERCENT,
  UNIT_AUTO,
  EDGE_LEFT,
  DIRECTION_LTR, EDGE_ALL
} from '../../../../lib/Core/Util/Yoga'

const INPUT_POINT_PERCENT = [
  [ 3, new Value(UNIT_POINT, 3) ],
  [ '5', new Value(UNIT_POINT, 5) ],
  [ '44%', new Value(UNIT_PERCENT, 44) ],
  [ new Value(UNIT_POINT, 6), new Value(UNIT_POINT, 6) ]
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

describe('Node', () => {
  let node
  describe('setFlexBasis', () => {
    it('should set Value with valid inputs', () => {
      INPUT_POINT_PERCENT.forEach(([ input, expectedValue ]) => {
        node.setFlexBasis(input)
        assertValue(node.getFlexBasis(), expectedValue)
      })
    })
    it('should throw Error for invalid input', () => {
      INVALID_INPUT_POINT_PERCENT.forEach(input => {
        assert.throws(() => node.setFlexBasis(input))
      })
    })
  })
  describe('setWidth', () => {
    it('should set Value with valid inputs', () => {
      INPUT_POINT_PERCENT_AUTO.forEach(([ input, expectedValue ]) => {
        node.setWidth(input)
        assertValue(node.getWidth(), expectedValue)
      })
    })
    it('should throw Error for invalid input', () => {
      INVALID_INPUT_POINT_PERCENT_AUTO.forEach(input => {
        assert.throws(() => node.setWidth(input))
      })
    })
  })
  describe('setHeight', () => {
    it('should set Value with valid inputs', () => {
      INPUT_POINT_PERCENT_AUTO.forEach(([ input, expectedValue ]) => {
        node.setHeight(input)
        assertValue(node.getHeight(), expectedValue)
      })
    })
    it('should throw Error for invalid input', () => {
      INVALID_INPUT_POINT_PERCENT_AUTO.forEach(input => {
        assert.throws(() => node.setHeight(input))
      })
    })
  })
  describe('setMinWidth', () => {
    it('should set Value with valid inputs', () => {
      INPUT_POINT_PERCENT.forEach(([ input, expectedValue ]) => {
        node.setMinWidth(input)
        assertValue(node.getMinWidth(), expectedValue)
      })
    })
    it('should throw Error for invalid input', () => {
      INVALID_INPUT_POINT_PERCENT.forEach(input => {
        assert.throws(() => node.setMinWidth(input))
      })
    })
  })
  describe('setMinHeight', () => {
    it('should set Value with valid inputs', () => {
      INPUT_POINT_PERCENT.forEach(([ input, expectedValue ]) => {
        node.setMinHeight(input)
        assertValue(node.getMinHeight(), expectedValue)
      })
    })
    it('should throw Error for invalid input', () => {
      INVALID_INPUT_POINT_PERCENT.forEach(input => {
        assert.throws(() => node.setMinHeight(input))
      })
    })
  })
  describe('setMaxWidth', () => {
    it('should set Value with valid inputs', () => {
      INPUT_POINT_PERCENT.forEach(([ input, expectedValue ]) => {
        node.setMaxWidth(input)
        assertValue(node.getMaxWidth(), expectedValue)
      })
    })
    it('should throw Error for invalid input', () => {
      INVALID_INPUT_POINT_PERCENT.forEach(input => {
        assert.throws(() => node.setMaxWidth(input))
      })
    })
  })
  describe('setMaxHeight', () => {
    it('should set Value with valid inputs', () => {
      INPUT_POINT_PERCENT.forEach(([ input, expectedValue ]) => {
        node.setMaxHeight(input)
        assertValue(node.getMaxHeight(), expectedValue)
      })
    })
    it('should throw Error for invalid input', () => {
      INVALID_INPUT_POINT_PERCENT.forEach(input => {
        assert.throws(() => node.setMaxHeight(input))
      })
    })
  })
  describe('setPosition', () => {
    it('should set Value with valid inputs', () => {
      INPUT_POINT_PERCENT.forEach(([ input, expectedValue ]) => {
        node.setPosition(EDGE_LEFT, input)
        assertValue(node.getPosition(EDGE_LEFT), expectedValue)
      })
    })
    it('should throw Error for invalid input', () => {
      INVALID_INPUT_POINT_PERCENT.forEach(input => {
        assert.throws(() => node.setPosition(EDGE_LEFT, input))
      })
    })
  })
  describe('setPadding', () => {
    it('should set Value with valid inputs', () => {
      INPUT_POINT_PERCENT.forEach(([ input, expectedValue ]) => {
        node.setPadding(EDGE_LEFT, input)
        assertValue(node.getPadding(EDGE_LEFT), expectedValue)
      })
    })
    it('should throw Error for invalid input', () => {
      INVALID_INPUT_POINT_PERCENT.forEach(input => {
        assert.throws(() => node.setPadding(EDGE_LEFT, input))
      })
    })
  })
  describe('setMargin', () => {
    it('should set Value with valid inputs', () => {
      INPUT_POINT_PERCENT_AUTO.forEach(([ input, expectedValue ]) => {
        node.setMargin(EDGE_LEFT, input)
        assertValue(node.getMargin(EDGE_LEFT), expectedValue)
      })
    })
    it('should throw Error for invalid input', () => {
      INVALID_INPUT_POINT_PERCENT_AUTO.forEach(input => {
        assert.throws(() => node.setMargin(EDGE_LEFT, input))
      })
    })
  })
  describe('getBorderBox()', () => {
    it('should get the x, y, w and h of the border box', () => {
      assert.sameOrderedMembers(layout(node).getBorderBox(), [ 5, 5, 100, 50 ])
    })
  })
  describe('getPaddingBox()', () => {
    it('should get the x, y, w and h of the padding box', () => {
      assert.sameOrderedMembers(layout(node).getPaddingBox(), [ 15, 15, 80, 30 ])
    })
  })
  describe('getComputedPadding()', () => {
    it('should get TRBL padding values', () => {
      assert.sameOrderedMembers(layout(node).getComputedPadding(), [ 10, 10, 10, 10 ])
    })
  })
  describe('getComputedMargin()', () => {
    it('should get TRBL margin values', () => {
      assert.sameOrderedMembers(layout(node).getComputedMargin(), [ 5, 5, 5, 5 ])
    })
  })
  describe('getComputedBorder()', () => {
    it('should get TRBL border values', () => {
      assert.sameOrderedMembers(layout(node).getComputedBorder(), [ 1, 1, 1, 1 ])
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

function layout (node) {
  node.setWidth(100)
  node.setHeight(50)
  node.setPadding(EDGE_ALL, 10)
  node.setMargin(EDGE_ALL, 5)
  node.setBorder(EDGE_ALL, 1)

  node.calculateLayout(200, 200, DIRECTION_LTR)

  return node
}

function assertValue (value, expectedValue) {
  assert.equal(value.unit, expectedValue.unit)
  assert.equal(value.value, expectedValue.value)
}
