/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import Yoga from 'yoga-layout'
import { Style } from '../Style/Style'

const emptyObject = Object.freeze({})

export class View {
  constructor (props, app) {
    this._app = app
    this._isDirty = true

    this.props = props || emptyObject
    this.children = []
    this.parent = null
    this.layout = Yoga.Node.create()
    this.visible = typeof this.props.visible === 'boolean' ? this.props.visible : true
    this.style = this._applyStyle(this.props.style)
    this.id = this.props.id || undefined

    if (this.props.onLayout) {
      this.onLayout = this.props.onLayout
      app._layout._addLayoutChangeListener(this)
    }
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
    if (this.children.length) {
      const x = ctx._x
      const y = ctx._y
      const layout = this.layout

      ctx._x += layout.getComputedLeft()
      ctx._y += layout.getComputedTop()

      for (const child of this.children) {
        child.visible && child.draw(ctx)
      }

      ctx._x = x
      ctx._y = y
    }
    this._isDirty = false
  }

  appendChild (child) {
    if (child.parent) {
      if (child.parent === this) {
        // If React wants to move an existing child to the end, it will just call append without calling
        // remove. Lets move the child to the end. For the Yoga node, we are not allowed to call markDirty,
        // to the node must be removed and re-added to ensure a re-layout later.
        this.layout.removeChild(child.layout)
        this.layout.appendChild(child.layout)
        this.children.splice(this.children.indexOf(child), 1)
        this.children.push(child)
      } else {
        throw Error('Cannot append child that already has a parent!')
      }
    }

    child.parent = this
    this.children.push(child)
    this.layout.insertChild(child.layout, this.layout.getChildCount())
  }

  insertChild (child, before) {
    let beforeIndex = this.children.indexOf(before)

    if (beforeIndex === -1) {
      throw Error('Cannot find child to insert before!')
    }

    this.children.splice(beforeIndex, 0, child)
    child.parent = this
    this.layout.insertChild(child.layout, beforeIndex)
  }

  removeChild (child) {
    const index = this.children.indexOf(child)

    if (index === -1) {
      throw Error('Attempting to remove a child that does not belong to this element.')
    }

    this.children.splice(index, 1)
    child.parent = undefined

    // Let the caller decide to release Yoga resources with Element.destroy() to allow attach-reattach use cases.
    this.layout.removeChild(child.layout)
  }

  updateProps (props) {
    this.props = props || emptyObject
    this.style = this._applyStyle(this.props.style)
    this.visible = typeof this.props.visible === 'boolean' ? this.props.visible : true
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
    this._app._layout._removeLayoutChangeListener(this)

    if (this.layout) {
      for (const child of this.children) {
        child.destroy()
      }

      this.style.release()

      const viewParent = this.layout.getParent()

      viewParent && viewParent.removeChild(this.layout)
      Yoga.Node.destroy(this.layout)
      this.layout = undefined
    }
  }

  _applyStyle (style) {
    if (!style) {
      style = Style.EMPTY
    } else if (!style.isStyle) {
      style = Style(style)
    }

    if (style !== this.style) {
      style.apply(this.layout)
    }

    return style
  }
}
