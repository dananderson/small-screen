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
  getInstanceCount
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
  describe('destroy()', () => {
    it('should be idempotent', () => {
      node.destroy()
      node.destroy()
    })
    it('should remove itself from parent on destroy', () => {
      node.insertChild(childA, 0)
      assert.equal(node.getChildCount(), 1)
      childA.destroy()
      assert.equal(node.getChildCount(), 0)
    })
    it('should throw error if node has children', () => {
      node.insertChild(childA, 0)
      assert.throws(() => node.destroy())
    })
  })
  describe('remove()', () => {
    it('should remove node from it\'s parent', () => {
      node.pushChild(childA)
      assert.equal(node.getChildCount(), 1)
      childA.remove()
      assert.equal(node.getChildCount(), 0)
      assert.isUndefined(childA.getParent())
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
    it('should move child to end of children list', () => {
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
    childB.destroy()
    childA.destroy()
    node.destroy()
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
