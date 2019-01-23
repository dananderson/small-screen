/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { ImageView } from '../../../../lib/Core/Views/ImageView'
import { View } from '../../../../lib/Core/Views/View'

describe('ImageView Test', () => {
  const app = {
    resource: {
      releaseResourceBySource: () => {},
      acquireResourceBySource: () => {}
    },
    layout: {
      off: () => {}
    }
  }
  let view
  let child

  describe('appendChild()', () => {
    it('should throw an Error', () => {
      view = new ImageView({ }, app)
      child = new View(undefined, app)

      assert.throws(() => view.appendChild(child), Error)
    })
  })

  describe('removeChild()', () => {
    it('should throw an Error', () => {
      view = new ImageView({ }, app)
      child = new View(undefined, app)

      assert.throws(() => view.removeChild(child), Error)
    })
  })

  afterEach(() => {
    child && child.destroy()
    view && view.destroy()
  })
})
