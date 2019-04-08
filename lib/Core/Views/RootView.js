/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { View } from './View'
import { Style } from '../Style'

export class RootView extends View {
  static propTypes = {

  }

  static defaultProps = {

  }

  constructor (app) {
    super({ style: Style({ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }) }, app, true)
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
