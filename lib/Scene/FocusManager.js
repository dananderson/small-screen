/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Navigate } from './Navigate'
import { Direction } from './Direction'
import { Event } from '../Event/Event'
import { Key } from '../Input/Key'

const DIRECTION = []

DIRECTION[Key.LEFT] = Direction.LEFT
DIRECTION[Key.RIGHT] = Direction.RIGHT
DIRECTION[Key.UP] = Direction.UP
DIRECTION[Key.DOWN] = Direction.DOWN
DIRECTION[Key.LEFT_AXIS_LEFT] = Direction.LEFT
DIRECTION[Key.LEFT_AXIS_RIGHT] = Direction.RIGHT
DIRECTION[Key.LEFT_AXIS_UP] = Direction.UP
DIRECTION[Key.LEFT_AXIS_DOWN] = Direction.DOWN

export class FocusManager {
  focused = null

  constructor (app) {
    this._app = app

    // TODO: wire this up better..
    this._app.on(Event.KEY_DOWN, event => {
      this.onKeyDown(event)
    })
  }

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
    const direction = DIRECTION[keyEvent.key]

    if (direction) {
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

      while (walker != null && !keyEvent._stopPropagationRequested) {
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
