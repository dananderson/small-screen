/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { FocusManager } from '../../../../lib/Core/Views/FocusManager'
import { BoxView } from '../../../../lib/Core/Views/BoxView'
import sinon from 'sinon'
import { LayoutManager } from '../../../../lib/Core/Views/LayoutManager'
import { KeyEvent } from '../../../../lib/Core/Event/KeyEvent'
import { Direction } from '../../../../lib/Core/Views/Direction'
import { StandardKey } from '../../../../lib/Core/Input/StandardKey'
import { StandardMapping } from '../../../../lib/Core/Input/StandardMapping'
import { ResourceManager } from '../../../../lib/Core/Resource/ResourceManager'

describe('FocusManager', () => {
  let app
  let views = []
  describe('clearFocus()', () => {
    it('should clear focused view', () => {
      const view = createView(true)

      app.focus.setFocus(view)
      app.focus.clearFocus()

      assert.notExists(app.focus.focused)
      sinon.assert.calledOnce(view.onBlur)
    })
    it('should do nothing when no focused view', () => {
      assert.notExists(app.focus.focused)
      app.focus.clearFocus()
      assert.notExists(app.focus.focused)
    })
  })
  describe('setFocus()', () => {
    it('should set focused view', () => {
      const view = createView(true)

      app.focus.setFocus(view)

      sinon.assert.calledOnce(view.onFocus)
      assert.strictEqual(app.focus.focused, view)
    })
    it('should be a no-op to focus currently focused view', () => {
      const view = createView(true)

      app.focus.setFocus(view)
      view.onFocus.reset()
      app.focus.setFocus(view)

      sinon.assert.notCalled(view.onFocus)
    })
    it('should replace focused view', () => {
      const view1 = createView(true)
      const view2 = createView(true)

      app.focus.setFocus(view1)
      app.focus.setFocus(view2)

      assert.strictEqual(app.focus.focused, view2)
      sinon.assert.calledOnce(view1.onFocus)
      sinon.assert.calledOnce(view1.onBlur)
      sinon.assert.calledOnce(view2.onFocus)
      sinon.assert.notCalled(view2.onBlur)
    })
    it('should throw Error when passed non-focusable view', () => {
      assert.throws(() => app.focus.setFocus())
      assert.throws(() => app.focus.setFocus(createView()))
    })
  })
  describe('onKeyDown()', () => {
    it('should pass onKeyDown to focused view', () => {
      const view = createView(true)

      app.focus.setFocus(view)
      app.focus.onKeyDown(createKeyDown(StandardKey.A, Direction.NONE))

      sinon.assert.calledOnce(view.onKeyDown)
    })
  })
  beforeEach(() => {
    app = {
      focus: new FocusManager(),
      layout: sinon.createStubInstance(LayoutManager),
      resource: sinon.createStubInstance(ResourceManager)
    }
  })
  afterEach(() => {
    views.forEach(view => view.destroy())
    views.length = 0
  })
  function createView (focusable = false) {
    const props = focusable ? { focusable, onFocus: sinon.stub(), onBlur: sinon.stub(), onKeyDown: sinon.stub() } : { focusable }
    const view = new BoxView(props, app)

    views.push(view)

    return view
  }
})

function createKeyDown (key, direction) {
  return new KeyEvent('keydown', true, true)._reset(
    {},
    1,
    new StandardMapping(),
    key,
    direction,
    true)
}
