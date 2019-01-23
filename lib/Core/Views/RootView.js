/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import Yoga from 'yoga-layout'
import { emptyObject } from '../Util'

export class RootView extends View {
  static propTypes = {

  }

  static defaultProps = {

  }

  constructor (app) {
    super(emptyObject, app)

    const { node } = this

    node.setPositionType(Yoga.POSITION_TYPE_ABSOLUTE)
    node.setPosition(Yoga.EDGE_LEFT, 0)
    node.setPosition(Yoga.EDGE_TOP, 0)
    node.setPosition(Yoga.EDGE_RIGHT, 0)
    node.setPosition(Yoga.EDGE_BOTTOM, 0)
  }
}
