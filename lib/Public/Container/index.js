/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { getInstance } from '../../Core/Application'

let application = getInstance()

export function render(component) {
  application.render(component)

  return application.root
}

export function findView(componentOrElement) {
  if (!componentOrElement || componentOrElement.nodeType === /* ELEMENT_NODE */1 || !application.reconciler) {
    return componentOrElement
  }

  return application.reconciler.findHostInstance(componentOrElement)
}

export function getRoot() {
  return application.root
}

export function setTitle(title) {
  application.title = title
}

export function getTitle() {
  return application.title
}

export function start() {
  application.start()
}

export function sleep() {
  // TODO: implement
  // container.sleep()
}

export function stop() {
  // TODO: implement
  // container.stop()
}

export function close() {
  application.close()
}

export function getWidth() {
  return application.width
}

export function getHeight() {
  return application.height
}

export function getSize() {
  return { width: application.width, height: application.height }
}

export function isFullscreen() {
  return application.fullscreen
}


// TODO: move to view
export function focus() {
  return application.focus
}
