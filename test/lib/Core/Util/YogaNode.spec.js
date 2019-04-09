/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import sinon from 'sinon'
import {
  Node,
  UNIT_AUTO,
  DIRECTION_LTR,
  EDGE_ALL,
  getInstanceCount,
  COMPUTED_LAYOUT_TOP,
  COMPUTED_LAYOUT_WIDTH,
  COMPUTED_LAYOUT_HEIGHT,
  COMPUTED_LAYOUT_LEFT,
  COMPUTED_LAYOUT_RIGHT,
  COMPUTED_LAYOUT_BOTTOM,
  COMPUTED_PADDING_TOP,
  COMPUTED_PADDING_RIGHT,
  COMPUTED_PADDING_BOTTOM,
  COMPUTED_PADDING_LEFT,
  COMPUTED_BORDER_TOP,
  COMPUTED_BORDER_RIGHT,
  COMPUTED_BORDER_BOTTOM,
  COMPUTED_BORDER_LEFT,
  COMPUTED_MARGIN_TOP, COMPUTED_MARGIN_RIGHT, COMPUTED_MARGIN_BOTTOM, COMPUTED_MARGIN_LEFT
} from '../../../../lib/Core/Util/Yoga'

describe('Node', () => {
  let node
  let childA
  let childB
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
  describe('computed fields', () => {
    it('should be set after layout', () => {
      layout(node)
      assert.equal(node[COMPUTED_LAYOUT_TOP], 5)
      assert.equal(node[COMPUTED_LAYOUT_RIGHT], 5)
      assert.equal(node[COMPUTED_LAYOUT_BOTTOM], 5)
      assert.equal(node[COMPUTED_LAYOUT_LEFT], 5)
      assert.equal(node[COMPUTED_LAYOUT_WIDTH], 100)
      assert.equal(node[COMPUTED_LAYOUT_HEIGHT], 50)

      assert.equal(node[COMPUTED_PADDING_TOP], 10)
      assert.equal(node[COMPUTED_PADDING_RIGHT], 10)
      assert.equal(node[COMPUTED_PADDING_BOTTOM], 10)
      assert.equal(node[COMPUTED_PADDING_LEFT], 10)

      assert.equal(node[COMPUTED_MARGIN_TOP], 5)
      assert.equal(node[COMPUTED_MARGIN_RIGHT], 5)
      assert.equal(node[COMPUTED_MARGIN_BOTTOM], 5)
      assert.equal(node[COMPUTED_MARGIN_LEFT], 5)

      assert.equal(node[COMPUTED_BORDER_TOP], 1)
      assert.equal(node[COMPUTED_BORDER_RIGHT], 1)
      assert.equal(node[COMPUTED_BORDER_BOTTOM], 1)
      assert.equal(node[COMPUTED_BORDER_LEFT], 1)
    })
  })
  describe('resetStyle()', () => {
    it('should reset style', () => {
      assert.equal(node.getWidth().unit, UNIT_AUTO)
      assert.isFalse(node.isDirty())

      layout(node)

      assert.isFalse(node.isDirty())
      assert.equal(node.getWidth().value, 100)

      node.resetStyle()

      assert.isTrue(node.isDirty())
      assert.equal(node.getWidth().unit, UNIT_AUTO)
    })
  })
  describe('release()', () => {
    it('should be idempotent', () => {
      node.release()
      node.release()
    })
    it('should remove itself from parent on release', () => {
      node.insertChild(childA, 0)
      assert.equal(node.getChildCount(), 1)
      childA.release()
      assert.equal(node.getChildCount(), 0)
    })
    it('should throw error if node has children', () => {
      node.insertChild(childA, 0)
      assert.throws(() => node.release())
    })
    it('should release recursively', () => {
      node.insertChild(childA, 0)
      assert.throws(() => node.release())
    })
  })
  describe('remove()', () => {
    it('should release recursively', () => {
      node.pushChild(childA)
      node.pushChild(childB)
      assert.equal(getInstanceCount(), 3)
      node.release(true)
      assert.equal(getInstanceCount(), 0)
    })
  })
  describe('pushChild()', () => {
    it('should add child to end of children list', () => {
      node.pushChild(childA)
      node.pushChild(childB)

      assert.equal(node.getChild(0), childA)
      assert.equal(node.getChild(1), childB)
    })
  })
  describe('sendToBack()', () => {
    it('should move child to end of children list', () => {
      node.pushChild(childA)
      node.pushChild(childB)

      childA.sendToBack()

      assert.equal(node.getChild(0), childB)
      assert.equal(node.getChild(1), childA)
    })
  })
  describe('getParent()', () => {
    it('should get the parent node', () => {
      node.insertChild(childA, node.getChildCount())
      assert.equal(childA.getParent(), node)
    })
    it('should return undefined for no parent', () => {
      assert.isUndefined(childA.getParent())
    })
  })
  describe('markDirty()', () => {
    it('should mark the node dirty', () => {
      assert.isFalse(node.isDirty())
      node.setMeasureFunc(() => {}) // required for mark dirty
      node.markDirty()
      assert.isTrue(node.isDirty())
    })
  })
  describe('setMeasureFunc()', () => {
    it('should call measure func on layout', () => {
      const measureFunc = sinon.spy(() => ({ width: 50, height: 50 }))

      node.pushChild(childA)
      childA.setMeasureFunc(measureFunc)
      childA.markDirty()
      node.calculateLayout(200, 200, DIRECTION_LTR)

      sinon.assert.calledOnce(measureFunc)
      assert.sameOrderedMembers(node.getBorderBox(), [ 0, 0, 200, 200 ])
      assert.sameOrderedMembers(childA.getBorderBox(), [ 0, 0, 200, 50 ])
    })
    it('should layout with no measure func', () => {
      node.pushChild(childA)
      node.calculateLayout(200, 200, DIRECTION_LTR)

      assert.sameOrderedMembers(node.getBorderBox(), [ 0, 0, 200, 200 ])
      assert.sameOrderedMembers(childA.getBorderBox(), [ 0, 0, 200, 0 ])
    })
    it('should unset measure func when no parameters passed', () => {
      node.setMeasureFunc(() => {})
      node.setMeasureFunc()
    })
    it('should unset measure func', () => {
      node.setMeasureFunc(() => {})
      node.unsetMeasureFunc()
    })
  })
  beforeEach(() => {
    node = Node.create()
    childA = Node.create()
    childB = Node.create()
  })
  afterEach(() => {
    childB.release()
    childA.release()
    node.release()
    assert.equal(getInstanceCount(), 0)
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
