/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { app } from '..'
import { spawn } from 'child_process'
import { CurtainView } from '../Util/CurtainView'
import { Application as ApplicationInteral } from '../../Core/Application'

let childProcess

export class Application {
  static Events = ApplicationInteral.Events

  static addEventListener (eventName, listener) {
    app().on(eventName, listener)
  }

  static removeEventListener (eventName, listener) {
    app().off(eventName, listener)
  }

  static render (component) {
    app().render(component)

    return app().root
  }

  static findView (componentOrElement) {
    if (!componentOrElement || componentOrElement.nodeType === /* ELEMENT_NODE */1 || !app().reconciler) {
      return componentOrElement
    }

    return app().reconciler.findHostInstance(componentOrElement)
  }

  static getViewById (id) {
    return app().root.getViewById(id)
  }

  static start (fps) {
    app().start(fps)
  }

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
  transition (...args) {
    const application = app()

    let curtain
    let options

    if (args.length === 2) {
      options = args[1]
    } else if (args.length === 3) {
      options = args[2]
    }

    if (!options || typeof options !== 'object') {
      options = {
        fadeOutMs: 500,
        fadeInMs: 500
      }
    }

    application.input.setEnabled(false)

    const restore = () => {
      application.root.removeChild(curtain)
      curtain.destroy()
      curtain = undefined
      application.input.setEnabled(true)
    }

    const childProcessComplete = () => {
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

    try {
      console.log('Running command: ', args[0])
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

    curtain = new CurtainView(options, application)
    application.root.appendChild(curtain)

    curtain.show(255, () => {
      if (spawnComplete) {
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

  static getFocus () {
    return app().focus.focused
  }

  // TODO: deprecate?
  static clearFocus () {
    app().focus.clearFocus()
  }
}

app().on(Application.Events.closing, () => {
  if (childProcess) {
    childProcess.removeAllListeners('exit')
    childProcess.stdin.pause()
    childProcess.kill()
    childProcess = undefined
  }
})
