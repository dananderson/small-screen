/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import { assert } from 'chai'
import { Reconciler } from '../../../../lib/Core/Application/Reconciler'
import { RootView } from '../../../../lib/Core/Views/RootView'
import sinon from 'sinon'
import { LayoutManager } from '../../../../lib/Core/Views/LayoutManager'
import { ResourceManager } from '../../../../lib/Core/Resource/ResourceManager'
import { BoxView } from '../../../../lib/Core/Views/BoxView'
import { ImageView } from '../../../../lib/Core/Views/ImageView'
import { FontResource } from '../../../../lib/Core/Resource/FontResource'
import { TextView } from '../../../../lib/Core/Views/TextView'
import { getInstanceCount } from '../../../../lib/Core/Util/Yoga'

describe('Reconciler', () => {
  let app
  let root
  let reconciler
  let container
  describe('createContainer()', () => {
    it('should create a container for a root view', () => {
      assert.strictEqual(container.containerInfo, root)
    })
  })
  describe('updateContainer()', () => {
    it('should render component into container', async () => {
      const dataset = [
        [ <div />, BoxView ],
        [ <box />, BoxView ],
        [ <img />, ImageView ],
        [ <text>Text!</text>, TextView ]
      ]

      for (const [ component, expected ] of dataset) {
        await updateContainerWith(reconciler, container, component)

        assert.isTrue(root.isDirty())
        assert.lengthOf(root.children, 1)
        assert.instanceOf(root.children[0], expected)

        await updateContainerWith(reconciler, container, null)
        root._isDirty = false
      }
    })
    it('should render component into container', async () => {
      await updateContainerWith(reconciler, container, <box><img /></box>)

      assert.isTrue(root.isDirty())
      assert.lengthOf(root.children, 1)

      const boxView = root.children[0]

      assert.instanceOf(boxView, BoxView)
      assert.lengthOf(boxView.children, 1)
      assert.instanceOf(boxView.children[0], ImageView)
    })
    it('should clear container when component is null', async () => {
      await updateContainerWith(reconciler, container, <div />)

      assert.isTrue(root.isDirty())
      assert.lengthOf(root.children, 1)

      await updateContainerWith(reconciler, container, null)

      assert.lengthOf(root.children, 0)
    })
  })
  beforeEach(() => {
    app = mockApp()
    root = new RootView(app)
    root._isDirty = false
    app.root = root
    reconciler = Reconciler(app)
    container = reconciler.createContainer(root)
  })
  afterEach(() => {
    root.destroy()
    assert.equal(getInstanceCount(), 0)
  })
})

function updateContainerWith (reconciler, container, component) {
  return new Promise((resolve, reject) => {
    try {
      reconciler.updateContainer(component, container, null, resolve)
    } catch (err) {
      reject(err)
    }
  })
}

function mockApp () {
  return {
    layout: sinon.createStubInstance(LayoutManager),
    resource: sinon.createStubInstance(ResourceManager, {
      addFont: sinon.stub().returns(sinon.createStubInstance(FontResource))
    })
  }
}
