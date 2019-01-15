/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import Yoga from 'yoga-layout'
import { Style } from '../Style'
import { bindStyle, bindStyleProperty } from '../Style/StyleBindings'
import { emptyObject } from '../Util'
import { Value } from '../Style/Value'

export class View {
  constructor (props, app) {
    this.props = props || emptyObject

    const { id, style, visible } = this.props

    this._app = app
    this._isDirty = true

    this.children = []
    this.parent = null
    this.layout = Yoga.Node.create()
    this.visible = typeof visible === 'boolean' ? visible : true
    this.id = id || undefined

    this._setStyle(style)

    // TODO: fix layout events
    // if (onLayout) {
    //   this.onLayout = onLayout
    //   app._layout._addLayoutChangeListener(this)
    // }
  }

  getViewById (id) {
    if (id === this.id) {
      return this
    }

    for (const view of this.children) {
      const found = view.getViewById(id)

      if (found) {
        return found
      }
    }

    return undefined
  }

  isDirty () {
    return this._isDirty
  }

  markDirty () {
    this._isDirty = true
    this.parent && this.parent.markDirty()
  }

  draw (ctx) {
    const { children } = this

    if (children.length) {
      const x = ctx._x
      const y = ctx._y
      const layout = this.layout

      ctx._x += layout.getComputedLeft()
      ctx._y += layout.getComputedTop()

      for (const child of children) {
        child.visible && child.draw(ctx)
      }

      ctx._x = x
      ctx._y = y
    }

    this._isDirty = false
  }

  appendChild (child) {
    const { children, layout } = this

    if (child.parent) {
      if (child.parent === this) {
        // If React wants to move an existing child to the end, it will just call append without calling
        // remove. Lets move the child to the end. For the Yoga node, we are not allowed to call markDirty,
        // to the node must be removed and re-added to ensure a re-layout later.
        layout.removeChild(child.layout)
        layout.appendChild(child.layout)
        children.splice(children.indexOf(child), 1)
        children.push(child)
      } else {
        throw Error('Cannot append child that already has a parent!')
      }
    }

    child.parent = this
    children.push(child)
    layout.insertChild(child.layout, layout.getChildCount())
  }

  insertChild (child, before) {
    const { children } = this
    let beforeIndex = children.indexOf(before)

    if (beforeIndex === -1) {
      throw Error('Cannot find child to insert before!')
    }

    children.splice(beforeIndex, 0, child)
    child.parent = this
    this.layout.insertChild(child.layout, beforeIndex)
  }

  removeChild (child) {
    const { children } = this
    const index = children.indexOf(child)

    if (index === -1) {
      throw Error('Attempting to remove a child that does not belong to this element.')
    }

    children.splice(index, 1)
    child.parent = undefined

    // Let the caller decide to release Yoga resources with Element.destroy() to allow attach-reattach use cases.
    this.layout.removeChild(child.layout)
  }

  updateProps (props) {
    this.props = props || emptyObject

    const { style, visible } = this.props

    // TODO: if using flatten syntax in component, this simple check will force a style rebuild.
    if (style !== this.style) {
      this._clearValuesListeners()
      this._setStyle(style)
    }

    this.visible = typeof visible === 'boolean' ? visible : true
  }

  isDescendent (view) {
    let walker = this

    while (walker != null) {
      if (view === walker.parent) {
        return true
      }

      walker = walker.parent
    }

    return false
  }

  destroy () {
    // TODO: deal with layout listeners
    // this._app._layout._removeLayoutChangeListener(this)

    this._clearValuesListeners()

    const { layout, children } = this

    if (layout) {
      for (const child of children) {
        child.destroy()
      }

      const viewParent = layout.getParent()

      viewParent && viewParent.removeChild(layout)
      Yoga.Node.destroy(layout)
      
      this.layout = undefined
    }
  }

  _clearValuesListeners() {
    const { values, valuesListeners } = this

    if (valuesListeners) {
      for (const key in valuesListeners) {
        values[key].off(Value.CHANGE, valuesListeners[key])
      }

      this.values = this.valuesListeners = undefined
    }
  }

  _setStyle(style) {
    const { layout } = this

    if (style) {
      this.style = style instanceof Style ? style : new Style(style)
      this.values = bindStyle(layout, this.style)
      this.valuesListeners = {}
    } else {
      this.style = Style.EMPTY
      this.values = emptyObject
    }

    const { values, valuesListeners } = this

    for (const key in values) {
      values[key].on(Value.CHANGE, valuesListeners[key] = (value) => {
        bindStyleProperty(layout, key, value)
      })
    }
  }
}
