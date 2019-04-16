/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import ReactFiberReconciler from 'react-reconciler'
import {
  unstable_scheduleCallback as scheduleCallback,
  unstable_cancelCallback as cancelCallback,
  unstable_shouldYield as shouldYield
} from 'scheduler'
import { TextView } from '../Views/TextView'
import { BoxView } from '../Views/BoxView'
import { ImageView } from '../Views/ImageView'
import { performance } from 'perf_hooks'

let TEXT = 'text'
let BOX = 'box'
let DIV = 'div'
let IMG = 'img'

let VIEW_CLASSES = new Map([
  [TEXT, TextView],
  [BOX, BoxView],
  [DIV, BoxView],
  [IMG, ImageView]
])

function appendChild (parentInstance, child) {
  if (parentInstance.appendChild) {
    parentInstance.appendChild(child)
  } else {
    throw Error('appendChild: Unsupported parent')
  }
}

function removeChild (parentInstance, child) {
  child.destroy()
}

export function Reconciler (app) {
  return ReactFiberReconciler({
    now: performance.now,

    supportsMutation: true,

    isPrimaryRenderer: true,

    appendInitialChild: appendChild,

    createInstance (type, props, rootContainerInstance, _currentHostContext, workInProgress) {
      const View = VIEW_CLASSES.get(type)

      if (View) {
        return new View(props, app)
      } else {
        throw Error(`createElement: Unknown type - '${type}'.`)
      }
    },

    createTextInstance (text, rootContainerInstance, internalInstanceHandle) {
      return text
    },

    finalizeInitialChildren (wordElement, type, props) {
      return false
    },

    getPublicInstance (inst) {
      return inst
    },

    prepareForCommit () {
      // noop
    },

    prepareUpdate (wordElement, type, oldProps, newProps) {
      return true
    },

    resetAfterCommit () {
      // noop
    },

    resetTextContent (wordElement) {
      // noop
    },

    getRootHostContext (instance) {
      return instance
    },

    getChildHostContext (instance) {
      return instance
    },

    shouldSetTextContent (type, props) {
      return type === TEXT
    },

    appendChild,

    appendChildToContainer: appendChild,

    removeChild,

    removeChildFromContainer: removeChild,

    insertBefore (parentInstance, child, beforeChild) {
      parentInstance.insertChild(child, beforeChild)
    },

    commitUpdate (instance, updatePayload, type, oldProps, newProps) {
      if (instance.updateProps && oldProps !== newProps) {
        instance.updateProps(newProps)
      }
    },

    commitMount (instance, updatePayload, type, oldProps, newProps) {
      // noop
    },

    commitTextUpdate (textInstance, oldText, newText) {

    },

    schedulePassiveEffects: scheduleCallback,

    cancelPassiveEffects: cancelCallback,

    shouldDeprioritizeSubtree (type, nextProps) {

    },

    scheduleDeferredCallback: scheduleCallback,

    cancelDeferredCallback: cancelCallback,

    shouldYield
  })
}
