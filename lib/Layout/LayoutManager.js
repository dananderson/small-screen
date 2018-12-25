/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import Yoga from 'yoga-layout'

export class LayoutManager {
  _listeners = new Set()
  _layoutSnapshots = new Map()

  run (root, width, height) {
    if (!root.layout.isDirty()) {
      return
    }

    const hasListeners = this._listeners.size > 0

    if (hasListeners) {
      this._beforeLayout()
    }

    root.layout.calculateLayout(width, height, Yoga.DIRECTION_LTR)

    if (hasListeners) {
      this._afterLayout()
    }
  }

  _beforeLayout () {
    const snapshots = this._layoutSnapshots

    snapshots.clear()

    for (const view of this._listeners) {
      snapshots.set(view, view.layout.getComputedLayout())
    }
  }

  _afterLayout () {
    const snapshots = this._layoutSnapshots

    for (const view of this._listeners) {
      const { left: l, top: t, width: w, height: h } = snapshots.get(view)
      const { left, top, width, height } = view.layout.getComputedLayout()

      if (left !== l || top !== t || width !== w || height !== h) {
        view.onLayout(left, top, width, height)
      }
    }
  }

  _addLayoutChangeListener (view) {
    this._listeners.add(view)
  }

  _removeLayoutChangeListener (view) {
    this._listeners.delete(view)
  }

  destroy () {
    this._listeners = undefined
    this._layoutSnapshots = undefined
  }
}
