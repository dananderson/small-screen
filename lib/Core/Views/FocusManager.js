/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Navigate } from './Navigate'
import { Direction } from './Direction'

export class FocusManager {
  focused = null
  _keyFinisher = null

  _resolveFocusDelegate (view, navigate) {
    let chain = view

    while (true) {
      chain.focusDelegate.focusDelegateResolve(chain, navigate)

      if (navigate.command !== Navigate.DONE) {
        throw Error('focusDelegateResolve must return a focus candidate.')
      }

      if (navigate.next.focusable) {
        return navigate.next
      }

      chain = navigate.next
      navigate.command = null
      navigate.next = null
    }
  }

  setFocus (view) {
    this._setFocus(view, new Navigate(Direction.RIGHT))
  }

  _setFocus (view, navigate) {
    if (view === this.focused) {
      return false
    }

    if (!view || (!view.focusable && !view.focusDelegate)) {
      throw Error('setFocus requires a focusable view.')
    }

    if (view.focusDelegate) {
      view = this._resolveFocusDelegate(view, navigate)
      if (view === this.focused) {
        return false
      }
    }

    let focused = this.focused

    focused && focused.onBlur && focused.onBlur(focused, navigate.direction)

    focused = this.focused = view

    focused.onFocus && focused.onFocus(focused, navigate.direction)

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
    if (this.focused === null) {
      return
    }

    let walker = this.focused
    const { direction } = keyEvent

    if (direction > 0) {
      const navigate = new Navigate(direction)
      let focusChanged

      while (walker != null) {
        if (walker.focusDelegate) {
          walker.focusDelegate.focusDelegateNavigate(walker, navigate)

          const command = navigate.command

          if (command === Navigate.ABORT) {
            this._keyFinisher && this._keyFinisher(keyEvent.key, false)
            return
          }

          if (command === Navigate.DONE) {
            focusChanged = this._setFocus(navigate.next, navigate)
            this._keyFinisher && this._keyFinisher(keyEvent.key, focusChanged)
            return
          }

          if (command === Navigate.CONTINUE) {
            navigate.command = null
          } else {
            throw Error('focusDelegateNavigate() is required to respond to navigate requests.')
          }
        }

        walker = walker.parent
      }

      if (navigate.pending) {
        focusChanged = this._setFocus(navigate.pending, navigate)
      } else {
        focusChanged = false
      }

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
