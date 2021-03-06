/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { DIRECTION_LTR } from '../Util/Yoga'

export class LayoutManager {
  // Add LayoutController (static to view?)

  _listeners = new Set()
  _layoutSnapshots = new Map()

  run (node, width, height) {
    if (!node.isDirty()) {
      return
    }

    const hasListeners = this._listeners.size > 0

    if (hasListeners) {
      this._beforeLayout()
    }

    node.calculateLayout(width, height, DIRECTION_LTR)

    if (hasListeners) {
      this._afterLayout()
    }
  }

  _beforeLayout () {
    const snapshots = this._layoutSnapshots

    snapshots.clear()

    for (const view of this._listeners) {
      snapshots.set(view, view.node.getBorderBox())
    }
  }

  _afterLayout () {
    const snapshots = this._layoutSnapshots

    for (const view of this._listeners) {
      const before = snapshots.get(view)
      const after = view.node.getBorderBox()

      if (before[0] !== after[0] || before[1] !== after[1] || before[2] !== after[2] || before[3] !== after[3]) {
        view.onLayout(...after)
      }
    }
  }

  on (view) {
    this._listeners.add(view)
  }

  off (view) {
    this._listeners.delete(view)
  }

  destroy () {
    this._listeners = undefined
    this._layoutSnapshots = undefined
  }
}
