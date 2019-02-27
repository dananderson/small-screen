/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import ReactFiberReconciler from 'react-reconciler'
import {
  unstable_scheduleCallback as schedulePassiveEffects,
  unstable_cancelCallback as cancelPassiveEffects
} from 'scheduler'
import { TextView } from '../Views/TextView'
import { BoxView } from '../Views/BoxView'
import { ImageView } from '../Views/ImageView'
import { performance } from 'perf_hooks'

export function Reconciler (app) {
  const createElement = (type, props) => {
    switch (type) {
      case 'text':
        return new TextView(props, app)
      case 'box':
      case 'div':
        return new BoxView(props, app)
      case 'img':
        return new ImageView(props, app)
      default:
        throw Error(`createElement: Unknown type - '${type}'.`)
    }
  }

  const reconciler = ReactFiberReconciler({
    now: performance.now,

    supportsMutation: true,

    isPrimaryRenderer: true,

    appendInitialChild (parentInstance, child) {
      if (parentInstance.appendChild) {
        parentInstance.appendChild(child)
      } else {
        throw Error('appendInitialChild: Unsupported parent')
      }
    },

    createInstance (type, props, rootContainerInstance, _currentHostContext, workInProgress) {
      return createElement(type, props)
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
      const childType = typeof props.children
      return (childType === 'string' || childType === 'number')
    },

    appendChild (parentInstance, child) {
      if (parentInstance.appendChild) {
        parentInstance.appendChild(child)
      } else {
        throw Error('appendChild(): Unsupported parent')
      }
    },

    appendChildToContainer (parentInstance, child) {
      if (parentInstance.appendChild) {
        parentInstance.appendChild(child)
      } else {
        throw Error('appendChildToContainer(): Unsupported parent')
      }
    },

    removeChild (parentInstance, child) {
      parentInstance.removeChild(child)
      child.destroy()
    },

    removeChildFromContainer (parentInstance, child) {
      parentInstance.removeChild(child)
    },

    insertBefore (parentInstance, child, beforeChild) {
      parentInstance.insertChild(child, beforeChild)
    },

    commitUpdate (instance, updatePayload, type, oldProps, newProps) {
      if (instance.updateProps && oldProps !== newProps) {
        instance.updateProps(newProps)
        app.root.markDirty()
      }
    },

    commitMount (instance, updatePayload, type, oldProps, newProps) {
      // noop
    },

    commitTextUpdate (textInstance, oldText, newText) {

    },

    schedulePassiveEffects,
    cancelPassiveEffects
  })

  return reconciler
}
