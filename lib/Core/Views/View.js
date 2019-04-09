/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { COMPUTED_LAYOUT_LEFT, COMPUTED_LAYOUT_TOP, Node } from '../Util/Yoga'
import { Style } from '../Style'
import { bindStyle, bindStyleProperty } from '../Style/StyleBindings'
import emptyObject from 'fbjs/lib/emptyObject'
import { HINT_ANIMATED_PROPERTIES } from '../Style/Constants'

let emptyArray = Object.freeze([])
let emptyStyle = Style.EMPTY

export class View {
  constructor (props, app, hasChildren) {
    this.props = props || emptyObject

    const { id, style, visible, onLayout } = this.props

    this._app = app
    this._isDirty = true
    this.children = hasChildren ? [] : emptyArray
    this.parent = null
    this.node = Node.create()
    this.visible = visible === undefined ? true : !!visible
    this.id = id
    this.valuesListeners = null

    if ((this.onLayout = onLayout)) {
      this._addLayoutListener()
    }

    this._setStyle(style)
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
      ctx.shift(node[COMPUTED_LAYOUT_LEFT], node[COMPUTED_LAYOUT_TOP])

      for (const child of children) {
        child.visible && child.draw(ctx)
      }

      ctx.unshift()
    }

    this._isDirty = false
  }

  appendChild (child) {
    const { children, node } = this
    const { parent } = child

    if (parent === this) {
      // If React wants to move an existing child to the end, it will just call append without calling
      // remove. Lets move the child to the end. For the Yoga node, we are not allowed to call markDirty,
      // to the node must be removed and re-added to ensure a re-layout later.
      child.node.sendToBack()
      children.splice(children.indexOf(child), 1)
    } else if (!parent) {
      child.parent = this
      node.pushChild(child.node)
    } else {
      throw Error('Cannot append child that already has a parent!')
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

    // Let the caller decide to release Yoga resources with destroy() to allow attach-reattach use cases.
    child.node.remove()
  }

  updateProps (props) {
    const { style, visible } = (this.props = props || emptyObject)

    // TODO: if using flatten syntax in component, this simple check will force a style rebuild.
    if (style !== this.style) {
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
    const { parent, node } = this

    if (node) {
      if (parent) {
        parent.removeChild(this)
      }

      try {
        this._destroyHook()
      } finally {
        node.release(true)
      }
    }
  }

  _destroyHook () {
    this._removeLayoutListener()
    this._clearValuesListeners()

    for (const child of this.children) {
      child._destroyHook()
    }

    this.node = this.parent = this.children = undefined
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
    const { valuesListeners } = this

    if (valuesListeners) {
      for (const [ value, callback ] of valuesListeners.entries()) {
        value.off(callback)
      }

      this.valuesListeners = undefined
    }
  }

  _addValuesListeners () {
    this.valuesListeners = new Map()

    const { style, valuesListeners, node } = this
    let callback

    for (const property of style[HINT_ANIMATED_PROPERTIES]) {
      const value = style[property]

      value.on(callback = value => bindStyleProperty(node, property, value))
      valuesListeners.set(value, callback)
    }
  }

  _setStyle (nextStyle) {
    this.valuesListeners && this._clearValuesListeners()

    if (nextStyle) {
      const style = this.style = nextStyle instanceof Style ? nextStyle : new Style(nextStyle)

      bindStyle(this.node, style)

      if (style[HINT_ANIMATED_PROPERTIES]) {
        this._addValuesListeners()
      }
    } else {
      this.style = emptyStyle
    }
  }
}
