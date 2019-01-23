/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import sinon from 'sinon'
import { LayoutManager } from '../../../../lib/Core/Views/LayoutManager'

function mockYogaNode (dirty) {
  const node = {
    calculateLayout: () => {

    },
    isDirty: () => dirty
  }

  return sinon.mock(node)
}

describe('LayoutManager', () => {
  describe('run()', () => {
    it('should not calculate layout when not dirty', () => {
      const layout = new LayoutManager()
      const mock = mockYogaNode(false)

      mock.expects('calculateLayout').never()

      layout.run(mock.object, 100, 100)

      mock.verify()
    })
    it('should should calculate layout when dirty', () => {
      const layout = new LayoutManager()
      const mock = mockYogaNode(true)

      mock.expects('calculateLayout').once().withArgs(100, 100, 1)

      layout.run(mock.object, 100, 100)

      mock.verify()
    })
  })
})
