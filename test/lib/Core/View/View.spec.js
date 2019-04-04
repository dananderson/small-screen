/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { Style } from '../../../../lib/Core/Style'
import { View } from '../../../../lib/Core/Views/View'
import { getInstanceCount } from '../../../../lib/Core/Util/Yoga'

describe('View Test', () => {
  const app = {
    layout: {
      off: () => {}
    }
  }
  let view
  let child
  let baselineViewCount

  describe('constructor', () => {
    it('should set accept props', () => {
      view = new View({ style: Style({ color: 'blue' }) }, app, true)

      assert.exists(view.props)
      assert.exists(view.style)
    })
    it('should set accept undefined props', () => {
      view = new View(undefined, app, true)

      assert.exists(view.props)
      assert.exists(view.style)
    })
    it('should set accept empty style', () => {
      view = new View({}, app, true)

      assert.exists(view.props)
      assert.exists(view.style)
    })
  })
  describe('destroy()', () => {
    it('should release views', () => {
      assert.equal(getInstanceCount(), baselineViewCount)

      view = new View(undefined, app, true)

      assert.equal(getInstanceCount(), baselineViewCount + 1)
      assert.exists(view.node)

      view.destroy()

      assert.equal(getInstanceCount(), baselineViewCount)
      assert.isUndefined(view.node)
    })
    it('should release views recursively', () => {
      assert.equal(getInstanceCount(), baselineViewCount)

      view = new View(undefined, app, true)
      child = new View(undefined, app, false)

      view.appendChild(child)

      assert.equal(getInstanceCount(), baselineViewCount + 2)
      assert.exists(view.node)
      assert.exists(child.node)

      view.destroy()

      assert.equal(getInstanceCount(), baselineViewCount)
      assert.isUndefined(view.node)
      assert.isUndefined(child.node)
    })
    it('should handle multiple destroy calls on same view', () => {
      view = new View(undefined, app, true)
      view.destroy()
      view.destroy()
    })
  })
  beforeEach(() => {
    // if application initialized, it might have created a View for root. do this tests view counts based on the start
    // of each test to avoid conflicting with application's active Views.
    baselineViewCount = getInstanceCount()
  })
  afterEach(() => {
    child && child.destroy()
    view && view.destroy()
  })
})
