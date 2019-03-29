/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import { POSITION_TYPE_ABSOLUTE, EDGE_LEFT, EDGE_TOP, EDGE_RIGHT, EDGE_BOTTOM } from '../Util/Yoga'
import emptyObject from 'fbjs/lib/emptyObject'

export class RootView extends View {
  static propTypes = {

  }

  static defaultProps = {

  }

  constructor (app) {
    super(emptyObject, app)

    const { node } = this

    node.setPositionType(POSITION_TYPE_ABSOLUTE)
    node.setPosition(EDGE_LEFT, 0)
    node.setPosition(EDGE_TOP, 0)
    node.setPosition(EDGE_RIGHT, 0)
    node.setPosition(EDGE_BOTTOM, 0)
  }

  getViewById (id) {
    return getView(this, id)
  }
}

// TODO: index this lookup

function getView (view, id) {
  if (view.id === id) {
    return view
  }

  for (const child of view.children) {
    const v = getView(child, id)

    if (v) {
      return v
    }
  }

  return undefined
}
