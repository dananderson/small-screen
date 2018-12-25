/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { View } from '../../lib/Scene/View'
import Yoga from 'yoga-layout'
import { Style } from '../../lib/Style/Style'
import { StubApplication } from '../Mock/StubApplication'

describe('View Test', () => {
  const app = new StubApplication()
  let view
  let child

  describe('constructor', () => {
    it('should set accept props', () => {
      view = new View({ style: Style({ color: 'blue' }) }, app)

      assert.exists(view.props)
      assert.exists(view.style)
    })
    it('should set accept undefined props', () => {
      view = new View(undefined, app)

      assert.exists(view.props)
      assert.exists(view.style)
    })
    it('should set accept empty style', () => {
      view = new View({}, app)

      assert.exists(view.props)
      assert.exists(view.style)
    })
  })
  describe('destroy()', () => {
    it('should release views', () => {
      assert.equal(Yoga.getInstanceCount(), 0)

      view = new View(undefined, app)

      assert.equal(Yoga.getInstanceCount(), 1)
      assert.exists(view.layout)

      view.destroy()

      assert.equal(Yoga.getInstanceCount(), 0)
      assert.isUndefined(view.layout)
    })
    it('should release views recursively', () => {
      assert.equal(Yoga.getInstanceCount(), 0)

      view = new View(undefined, app)
      child = new View(undefined, app)

      view.appendChild(child)

      assert.equal(Yoga.getInstanceCount(), 2)
      assert.exists(view.layout)
      assert.exists(child.layout)

      view.destroy()

      assert.equal(Yoga.getInstanceCount(), 0)
      assert.isUndefined(view.layout)
      assert.isUndefined(child.layout)
    })
    it('should handle multiple destroy calls on same view', () => {
      view = new View(undefined, app)
      view.destroy()
      view.destroy()
    })
  })

  afterEach(() => {
    child && child.destroy()
    view && view.destroy()
  })
})
