/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Navigate } from './Navigate'
import { Direction } from './Direction'

let { DONE, SYNC_CHILD, ABORT, CONTINUE } = Navigate
let { RIGHT } = Direction

export class FocusManager {
  focused = null
  _keyFinisher = null

  _resolveFocusDelegate (view, navigate) {
    let chain = view

    while (true) {
      chain.focusDelegate.focusDelegateResolve(chain, navigate)

      const { command, next } = navigate

      if (command !== DONE) {
        throw Error('focusDelegateResolve must return a focus candidate.')
      }

      if (next.focusable) {
        return next
      }

      chain = next
      navigate.command = null
      navigate.next = null
    }
  }

  setFocus (view) {
    this._setFocus(view, new Navigate(RIGHT), true)
  }

  _setFocus (view, navigate, sync) {
    let { focused } = this

    if (view === focused) {
      return false
    }

    if (!view || (!view.focusable && !view.focusDelegate)) {
      throw Error('setFocus requires a focusable view.')
    }

    if (view.focusDelegate) {
      view = this._resolveFocusDelegate(view, navigate)
      if (view === focused) {
        return false
      }
    }

    let { direction } = navigate

    focused && focused.onBlur && focused.onBlur(focused, direction)

    focused = this.focused = view

    focused.onFocus && focused.onFocus(focused, direction)

    sync && syncChildFocus(focused)

    // this.emit('change', previous, this.focused)

    return true
  }

  clearFocus () {
    const focused = this.focused

    focused && focused.onBlur && focused.onBlur(focused)

    this.focused = null

    // this.emit('change', this.focused, null)
  }

  onKeyDown (keyEvent) {
    let walker = this.focused

    if (walker === null) {
      return
    }

    const { direction, key } = keyEvent

    if (direction > 0) {
      const navigate = new Navigate(direction)
      let focusChanged

      while (walker != null) {
        if (walker.focusDelegate) {
          walker.focusDelegate.focusDelegateNavigate(walker, navigate)

          const { command, next } = navigate

          switch (command) {
            case ABORT:
              this._keyFinisher && this._keyFinisher(key, false)
              return
            case DONE:
              // sync = false because navigate/resolve take care of updating parent focus
              focusChanged = this._setFocus(next, navigate, false)
              this._keyFinisher && this._keyFinisher(key, focusChanged)
              return
            case CONTINUE:
              navigate.command = null
              break
            default:
              throw Error('focusDelegateNavigate() is required to respond to navigate requests.')
          }
        }

        walker = walker.parent
      }

      focusChanged = navigate.pending ? this._setFocus(navigate.pending, navigate) : false

      this._keyFinisher && this._keyFinisher(keyEvent.key, focusChanged)
    } else {
      walker = this.focused

      while (walker != null && !keyEvent.canceled) {
        walker.onKeyDown && walker.onKeyDown(keyEvent)
        walker = walker.parent
      }
    }
  }

  setKeyFinisher (callback) {
    this._keyFinisher = callback
  }

  destroy () {

  }
}

function syncChildFocus (focused) {
  const navigate = new Navigate(SYNC_CHILD)
  let walker = focused.parent
  let focusedChild = focused

  // Focus has been changed outside of directional navigation. Go through all parent delegates to ensure
  // they are in sync with the focus change.
  while (walker) {
    const { focusDelegate, parent } = walker

    if (focusDelegate) {
      navigate.pending = focusedChild
      navigate.next = null

      focusDelegate.focusDelegateResolve(walker, navigate)
      focusedChild = walker
    }

    walker = parent
  }
}
