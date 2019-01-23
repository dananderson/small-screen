/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import React from 'react'
import { Direction } from '../../Core/Views/Direction'

const OFFSET = []
const HORIZONTAL = 1
const VERTICAL = 2

export class FocusGroup extends React.Component {
  constructor (props) {
    super(props)

    this.focalPathIndex = 0
    this.navigation = (this.props.navigation === 'horizontal') ? HORIZONTAL : VERTICAL
  }

  render () {
    return (
      <box {...this.props} focusDelegate={this}>
        {this.props.children ? this.props.children : null}
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

    let index = this.focalPathIndex

    switch (navigate.direction) {
      case Direction.DOWN:
        if (navigate.pending && !navigate.pending.isDescendent(owner) && this.navigation === VERTICAL) {
          index = this.focalPathIndex = 0
        }
        break
      case Direction.UP:
        if (navigate.pending && !navigate.pending.isDescendent(owner) && this.navigation === VERTICAL) {
          index = this.focalPathIndex = this._focalPath.length - 1
        }
        break
      case Direction.RIGHT:
        if (navigate.pending && !navigate.pending.isDescendent(owner) && this.navigation === HORIZONTAL) {
          index = this.focalPathIndex = 0
        }
        break
      case Direction.LEFT:
        if (navigate.pending && !navigate.pending.isDescendent(owner) && this.navigation === HORIZONTAL) {
          index = this.focalPathIndex = this._focalPath.length - 1
        }
        break
      default:
        throw Error('Unknown direction: ' + navigate.direction)
    }

    return navigate.done(this._focalPath[index])
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

OFFSET[HORIZONTAL] = []
OFFSET[HORIZONTAL][Direction.LEFT] = -1
OFFSET[HORIZONTAL][Direction.RIGHT] = 1

OFFSET[VERTICAL] = []
OFFSET[VERTICAL][Direction.UP] = -1
OFFSET[VERTICAL][Direction.DOWN] = 1
