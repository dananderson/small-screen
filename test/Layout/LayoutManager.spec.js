/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import sinon from 'sinon'
import { LayoutManager } from '../../lib/Layout/LayoutManager'

function mockView (dirty) {
  const view = {
    calculateLayout: () => {

    },
    isDirty: () => dirty
  }

  return sinon.mock(view)
}

describe('LayoutManager', () => {
  describe('run()', () => {
    it('should not calculate layout when not dirty', () => {
      const layout = new LayoutManager()
      const mock = mockView(false)

      mock.expects('calculateLayout').never()

      layout.run({ layout: mock.object }, 100, 100)

      mock.verify()
    })
    it('should should calculate layout when dirty', () => {
      const layout = new LayoutManager()
      const mock = mockView(true)

      mock.expects('calculateLayout').once().withArgs(100, 100, 1)

      layout.run({ layout: mock.object }, 100, 100)

      mock.verify()
    })
  })
})
