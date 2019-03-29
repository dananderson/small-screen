/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Node } from '../Util/Yoga'
import { Style } from '../Style'
import { bindStyle, bindStyleProperty } from '../Style/StyleBindings'
import emptyObject from 'fbjs/lib/emptyObject'

export class View {
  constructor (props, app) {
    this.props = props || emptyObject

    const { id, style, visible, onLayout } = this.props

    this._app = app
    this._isDirty = true

    this.children = []
    this.parent = null
    this.node = Node.create()
    this.visible = typeof visible === 'boolean' ? visible : true
    this.id = id

    this._setStyle(style)

    if (onLayout) {
      this.onLayout = onLayout
      this._addLayoutListener()
    }
  }

  isDirty () {
    return this._isDirty
  }

  markDirty () {
    this._isDirty = true
    this.parent && this.parent.markDirty()
  }

  draw (ctx) {
    const { children, node } = this

    if (children.length) {
      const [ left, top ] = node.getBorderBox()
      ctx.shift(left, top)

      for (const child of children) {
        child.visible && child.draw(ctx)
      }

      ctx.unshift()
    }

    this._isDirty = false
  }

  appendChild (child) {
    const { children, node } = this

    if (child.parent) {
      if (child.parent === this) {
        // If React wants to move an existing child to the end, it will just call append without calling
        // remove. Lets move the child to the end. For the Yoga node, we are not allowed to call markDirty,
        // to the node must be removed and re-added to ensure a re-layout later.
        node.removeChild(child.node)
        node.insertChild(child.node, node.getChildCount())
        children.splice(children.indexOf(child), 1)
      } else {
        throw Error('Cannot append child that already has a parent!')
      }
    } else {
      child.parent = this
      node.insertChild(child.node, node.getChildCount())
    }

    children.push(child)
  }

  insertChild (child, before) {
    const { children, node } = this
    let beforeIndex = children.indexOf(before)

    if (beforeIndex === -1) {
      throw Error('Cannot find child to insert before!')
    }

    children.splice(beforeIndex, 0, child)
    child.parent = this
    node.insertChild(child.node, beforeIndex)
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
    this.node.removeChild(child.node)
  }

  updateProps (props) {
    this.props = props || emptyObject

    const { style, visible } = this.props

    // TODO: if using flatten syntax in component, this simple check will force a style rebuild.
    if (style !== this.style) {
      this._clearValuesListeners()
      this._setStyle(style)
    }

    this.visible = (visible === undefined ? true : !!visible)
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
    this._removeLayoutListener()
    this._clearValuesListeners()

    const { node, children } = this

    if (node) {
      for (const child of children) {
        child.destroy()
      }

      const viewParent = node.getParent()

      viewParent && viewParent.removeChild(node)
      node.destroy()

      this.node = undefined
    }
  }

  requestFocus () {
    // TODO: is this focusable?
    this._app.focus.setFocus(this)
  }

  _addLayoutListener () {
    this._app.layout.on(this)
  }

  _removeLayoutListener () {
    this._app.layout.off(this)
  }

  _clearValuesListeners () {
    const { values, valuesListeners } = this

    if (valuesListeners) {
      for (const key in valuesListeners) {
        values[key].off(valuesListeners[key])
      }

      this.values = this.valuesListeners = undefined
    }
  }

  _setStyle (style) {
    const { node } = this

    if (style) {
      this.style = style instanceof Style ? style : new Style(style)
      this.values = bindStyle(node, this.style)
      this.valuesListeners = {}
    } else {
      this.style = Style.EMPTY
      this.values = emptyObject
    }

    const { values, valuesListeners } = this

    for (const key in values) {
      values[key].on(valuesListeners[key] = (value) => {
        bindStyleProperty(node, key, value)
      })
    }
  }
}
