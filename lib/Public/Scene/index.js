/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { application } from '..'

export function render (component) {
  application.render(component)

  return application.root
}

export function findView (componentOrElement) {
  if (!componentOrElement || componentOrElement.nodeType === /* ELEMENT_NODE */1 || !application.reconciler) {
    return componentOrElement
  }

  return application.reconciler.findHostInstance(componentOrElement)
}

export function getViewById (id) {
  return application.root.getViewById(id)
}

export function getFocus () {
  return application.focus.focused
}

// TODO: deprecate?
export function clearFocus () {
  application.focus.clearFocus()
}

export function getWidth () {
  return application.width
}

export function getHeight () {
  return application.height
}
