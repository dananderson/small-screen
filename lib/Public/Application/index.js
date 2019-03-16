/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { app } from '..'
import { spawn } from 'child_process'
import { CurtainView } from '../Util/CurtainView'
import { Application as ApplicationInternal } from '../../Core/Application'
import emptyObject from 'fbjs/lib/emptyObject'

let childProcess
let appClosingListener

export class Application {
  /**
   * Events dispatched by the Application API.
   *
   * @type {{frame, closing}}
   */
  static Events = ApplicationInternal.Events

  /**
   * Add an event listener.
   *
   * @param {string} eventName The event name from Application#Events.
   * @param {function} listener The event callback.
   */
  static addEventListener (eventName, listener) {
    app().on(eventName, listener)
  }

  /**
   * Remove an event listener.
   *
   * @param {string} eventName The event name from Application#Events.
   * @param {function} listener The event callback.
   */
  static removeEventListener (eventName, listener) {
    app().off(eventName, listener)
  }

  /**
   * Render a React element into the View graph in the Application's default container and return a reference to the
   * component (or returns null for stateless components).
   *
   * If the React element was previously rendered into container, this will perform an update on it and only mutate
   * the View graph as necessary to reflect the latest React element.
   *
   * If the optional callback is provided, it will be executed after the component is rendered or updated.
   *
   * Note:
   *
   * render() controls the contents of the Application's container node. Any existing View graph elements inside are
   * replaced when first called. Later calls use React’s diffing algorithm for efficient updates.
   *
   * render() does not modify the container node (only modifies the children of the container). It may be possible to
   * insert a component to an existing View without overwriting the existing children.
   *
   * render() currently returns a reference to the root ReactComponent instance. However, using this return value is
   * legacy and should be avoided because future versions of React may render components asynchronously in some cases.
   * If you need a reference to the root ReactComponent instance, the preferred solution is to attach a callback ref
   * to the root element.
   *
   * @param element React element to render.
   * @param {function} [callback] Optional callback to be executed after the component is rendered or updated.
   * @return A reference to the component or null for stateless components.
   */
  static render (element, callback) {
    return app().render(element, callback)
  }

  /**
   * If this component has been mounted into the View graph, this returns the corresponding native View. This
   * method is useful for reading values out of the View graph, such as form field values and performing View
   * measurements. In most cases, you can attach a ref to the View and avoid using getViewByComponent at all.
   *
   * When a component renders to null or false, getViewByComponent returns null. When a component renders to a string,
   * getViewByComponent returns a TextView node containing that value. As of React 16, a component may return a
   * fragment with multiple children, in which case getViewByComponent will return the View corresponding to the first
   * non-empty child.
   *
   * Note:
   *
   * getViewByComponent is an escape hatch used to access the underlying DOM node. In most cases, use of this escape hatch
   * is discouraged because it pierces the component abstraction.
   *
   * @param component React component.
   * @return {View|undefined|null}
   */
  static getViewByComponent (component) {
    const application = app()

    if (!component || component.nodeType === /* ELEMENT_NODE */1 || !application.reconciler) {
      return component
    }

    return application.reconciler.findHostInstance(component)
  }

  /**
   * Find a View by ID.
   *
   * @param {string} id View ID to search on
   * @return {View|undefined} View with ID or undefined.
   */
  static getViewById (id) {
    return app().root.getViewById(id)
  }

  /**
   * Start the application.
   */
  static start () {
    app().start()
  }

  /**
   * Close the application.
   */
  static close () {
    app().close()
  }

  /**
   * Transition to another process.
   *
   * This method will fade the screen to black, release graphics resources, shutdown renderer and executes the
   * given shell command. The application goes into a deep sleep mode, just executing enough to continue running
   * in the background. When the executed command returns with an exit code, the application wakes up, reloads
   * graphics and fades back in.
   *
   * @param {string|array|object} args Uses the same arguments as child_process.spawn().
   *  - transition('command')
   *  - transition('command', { shell: true })
   *  - transition('command', [ 'arg1', 'arg2' ])
   *  - transition('command', [ 'arg1', 'arg2' ], { shell: true })
   */
  static transition (...args) {
    const application = app()

    let curtain
    let options

    if (args.length === 2) {
      options = args[1]
    } else if (args.length === 3) {
      options = args[2]
    }

    if (typeof options !== 'object') {
      options = emptyObject
    }

    const restore = () => {
      application.root.removeChild(curtain)
      curtain.destroy()
      curtain = undefined
      application.input.setEnabled(true)
    }

    const childProcessComplete = () => {
      application.off(appClosingListener)
      appClosingListener = undefined

      childProcess && childProcess.removeAllListeners('exit')
      childProcess = undefined

      try {
        application.attach()
        application.input.setEnabled(false)
      } catch (err) {
        console.log('Failed to re-enable graphics device.', err)
        process.exit(1)
      }

      application.start()
      curtain.hide(restore)
    }

    let showComplete = false
    let spawnComplete = false

    application.input.setEnabled(false)

    console.log('Running command: ', args[0])

    try {
      childProcess = spawn.apply(null, args)
    } catch (err) {
      console.log('process spawn failed: ', err)
      spawnComplete = true
      // TODO: notify caller?
      // return
    }

    childProcess.on('exit', code => {
      console.log('Command result: ', code)
      spawnComplete = true

      if (showComplete) {
        childProcessComplete()
      }
    })

    application.on(Application.Events.closing, appClosingListener = () => {
      if (childProcess) {
        childProcess.removeAllListeners('exit')
        childProcess.stdin.pause()
        childProcess.kill()
        childProcess = undefined
      }

      application.off(appClosingListener)
      appClosingListener = undefined
    })

    curtain = new CurtainView(options, application)
    application.root.appendChild(curtain)

    curtain.show(() => {
      if (spawnComplete) {
        childProcess && childProcess.removeAllListeners('exit')
        childProcess = undefined

        curtain.hide(restore)
        return
      }

      application.stop()

      try {
        application.detach()
      } catch (err) {
        console.log('Detach failed: ', err)
        process.exit(1)
      }

      showComplete = true
    })
  }

  /**
   * Get the currently focused View.
   *
   * @return {View|undefined}
   */
  static getFocus () {
    return app().focus.focused
  }

  /**
   * Clear the currently focused View.
   */
  static clearFocus () {
    app().focus.clearFocus()
  }
}
