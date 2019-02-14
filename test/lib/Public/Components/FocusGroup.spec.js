/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import React from 'react'
import TestRenderer from 'react-test-renderer'
import { FocusGroup } from '../../../../lib/Public/Components/FocusGroup'

describe('FocusGroup', () => {
  describe('create', () => {
    it('should create a FocusGroup component with vertical navigation', () => {
      const renderer = TestRenderer.create(<FocusGroup/>)
      const tree = renderer.toTree()

      assert.equal(tree.type, FocusGroup)
      assert.equal(tree.instance.navigation, 2)
      assert.equal(tree.rendered.type, 'box')
    })
    it('should create a FocusGroup component with horizontal navigation', () => {
      const renderer = TestRenderer.create(<FocusGroup navigation="horizontal"/>)
      const tree = renderer.toTree()

      assert.equal(tree.type, FocusGroup)
      assert.equal(tree.instance.navigation, 1)
      assert.equal(tree.rendered.type, 'box')
    })
  })
})
