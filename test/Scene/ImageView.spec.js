/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { View } from '../../lib/Scene/View'
import { ImageView } from '../../lib/Scene/ImageView'
import { StubApplication } from '../Mock/StubApplication'

describe('ImageView Test', () => {
  const app = new StubApplication()
  let view
  let child

  describe('appendChild()', () => {
    it('should throw an Error', () => {
      view = new ImageView({ src: 'test/resources/one.png' }, app)
      child = new View(undefined, app)

      assert.throws(() => view.appendChild(child), Error)
    })
  })

  describe('removeChild()', () => {
    it('should throw an Error', () => {
      view = new ImageView({ src: 'test/resources/one.png' }, app)
      child = new View(undefined, app)

      assert.throws(() => view.removeChild(child), Error)
    })
  })

  afterEach(() => {
    child && child.destroy()
    view && view.destroy()
  })
})
