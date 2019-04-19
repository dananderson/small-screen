/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import { Direction } from '../../Core/Views/Direction'

const HORIZONTAL = 1
const VERTICAL = 2

let { RIGHT, LEFT, UP, DOWN, NONE } = Direction
let OFFSET = []

OFFSET[HORIZONTAL] = []
OFFSET[HORIZONTAL][LEFT] = -1
OFFSET[HORIZONTAL][RIGHT] = 1

OFFSET[VERTICAL] = []
OFFSET[VERTICAL][UP] = -1
OFFSET[VERTICAL][DOWN] = 1

export class FocusGroup extends React.Component {
  constructor (props) {
    super(props)

    this.focalPathIndex = 0
    this.navigation = (this.props.navigation === 'horizontal') ? HORIZONTAL : VERTICAL
  }

  render () {
    return (
      <box {...this.props} focusDelegate={this}>
        {this.props.children || null}
      </box>
    )
  }

  focusDelegateNavigate (owner, navigate) {
    this._createFocalPath(owner)

    const offset = OFFSET[this.navigation][navigate.direction]

    if (!offset) {
      navigate.pass()
      return
    }

    const nextFocalPathIndex = this.focalPathIndex + offset

    if (nextFocalPathIndex >= 0 && nextFocalPathIndex < this._focalPath.length) {
      navigate.done(this._focalPath[this.focalPathIndex = nextFocalPathIndex])
    } else {
      navigate.continue(this._focalPath[this.focalPathIndex])
    }
  }

  focusDelegateResolve (owner, navigate) {
    this._createFocalPath(owner)

    let { navigation, _focalPath, focalPathIndex } = this
    const { direction, pending } = navigate

    switch (direction) {
      case NONE:
        this._syncChildFocus(navigate)
        break
      case DOWN:
        if (pending && navigation === VERTICAL && !pending.isDescendent(owner)) {
          focalPathIndex = 0
        }
        break
      case UP:
        if (pending && navigation === VERTICAL && !pending.isDescendent(owner)) {
          focalPathIndex = _focalPath.length - 1
        }
        break
      case RIGHT:
        if (pending && navigation === HORIZONTAL && !pending.isDescendent(owner)) {
          focalPathIndex = 0
        }
        break
      case LEFT:
        if (pending && navigation === HORIZONTAL && !pending.isDescendent(owner)) {
          focalPathIndex = _focalPath.length - 1
        }
        break
      default:
        throw Error('Unknown direction: ' + direction)
    }

    return navigate.done(_focalPath[(this.focalPathIndex = focalPathIndex)])
  }

  _createFocalPath (app) {
    if (this.props.static && this._focalPath) {
      return
    }

    let path = []
    let result

    for (const child of app.children) {
      (result = findFocusable(child)) && path.push(result)
    }

    if (path.length === 0) {
      throw Error('Expected at least one focusable item in the FocusGroup.')
    }

    this._focalPath = path
  }

  _syncChildFocus (navigate) {
    const { _focalPath, focalPathIndex } = this
    const { pending } = navigate

    if (_focalPath[focalPathIndex] !== pending) {
      let i = _focalPath.length - 1

      while (i--) {
        if (_focalPath[i] === pending) {
          this.focalPathIndex = i
          return navigate.done(_focalPath[i])
        }
      }
    }

    return navigate.pass()
  }
}

function findFocusable (node) {
  if (node.focusDelegate || node.focusable) {
    return node
  }

  let result

  for (const child of node.children) {
    if ((result = findFocusable(child))) {
      return result
    }
  }

  return null
}
