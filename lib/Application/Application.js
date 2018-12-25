/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { createVideo, platformQuit } from '../Platform/Platform'
import { Reconciler } from './Reconciler'
import { EventEmitter } from 'events'
import assert from 'assert'
import * as is from '../Utilities/is'
import { SceneManager } from '../Scene/SceneManager'
import { InputManager } from '../Input/InputManager'
import { ResourceManager } from '../Resource/ResourceManager'
import { AnimationManager } from '../Animation/AnimationManager'
import { Event } from '../Event/Event'
import { createClosingEvent } from '../Event/EventFactory'
import { AudioManager } from '../Audio/AudioManager'
import { LayoutManager } from '../Layout/LayoutManager'
import { now } from '../Utilities/now'
import { BoxView } from '../Scene/BoxView'
import { Style } from '../Style/Style'
import { Value } from '../Style/Value'
import { Easing } from '../ThirdParty/Easing'
import { spawn } from 'child_process'
import os from 'os'
import { rethrow } from '../Utilities/rethrow'
import { ScreenSaverMode } from './ScreenSaverMode'

const DEFAULTS = {
  width: 1920,
  height: 1080,
  fps: 60,
  title: 'Small Screen Application',
  fullscreen: false,
  vsync: true,
  windowWidth: 640,
  windowHeight: 480,
  screenSaverSleepFps: 5,
  sleepFps: 2,

  resWorkerTimeLimitMs: 10,
  resWorkerRescheduleDelayMs: (1000 / 30) << 0,
  resImageThreadPoolSize: os.cpus().length,
  resImageConcurrency: 2,

  curtainFadeOutMs: 500,
  curtainFadeInMs: 750,

  gameControllerDbFile: undefined
}

export class Application extends EventEmitter {
  constructor (options = {}) {
    super()

    this._options = validateOptions(options)

    this.scene = new SceneManager(this)
    this.input = new InputManager(this)
    this.resource = new ResourceManager(this._options)
    this.animation = new AnimationManager()
    this.audio = new AudioManager(this)

    this._layout = new LayoutManager()

    this._video = undefined

    this.screenSaverTimeoutMs = 0
    this.screenSaverMode = ScreenSaverMode.black

    this._reconciler = undefined
    this._container = undefined
    this._isClosing = false
    this._frameCount = 0
    this._frameWorkerId = undefined
    this._isScreenSaverActive = false

    registerExitHandler(this)
  }

  /**
   * Application rendering height.
   *
   * @returns {number}
   */
  get width () {
    return this._video ? this._video._window.width : 0
  }

  /**
   * Application rendering width.
   *
   * @returns {number}
   */
  get height () {
    return this._video ? this._video._window.height : 0
  }

  /**
   * Is the application in fullscreen mode?
   *
   * @returns {boolean}
   */
  get fullscreen () {
    return this._video ? this._video._window.fullscreen : false
  }

  /**
   * Run a React component.
   *
   * @param component React component.
   */
  run (component) {
    if (this._video) {
      throw Error('App is already running.')
    }

    const events = {
      quit: this,
      input: this.input
    }

    try {
      this._video = createVideo(events, this._options)
    } catch (err) {
      throw rethrow(Error('Failed to create video'), err)
    }

    this._attach()

    try {
      this._reconciler = Reconciler(this)
      this._container = this._reconciler.createContainer(this.scene.root)
      this._reconciler.updateContainer(component, this._container, null, null)
    } catch (err) {
      this._destroy()
      throw rethrow(Error('Failed to create React reconciler'), err)
    }

    this.scene.root.appendChild(this._curtain = Curtain(this, this._options))

    this._start(this._options.fps)
  }

  /**
   * Transition to another process.
   *
   * This method will fade the screen to black, release graphics resources, shutdown renderer and executes the
   * given shell command. The application goes into a deep sleep mode, just executing enough to continue running
   * in the background. When the executed command returns with an exit code, the application wakes up, reloads
   * graphics and fades back in.
   *
   * Note, this program-program transition strategy works on Raspberry Pi in headless mode. However, this strategy
   * may not a good user experience for windows systems (Windows, X, etc).
   *
   * @param command Shell command to execute.
   */
  exec (command) {
    this.input.disable()

    // TODO: spawn and then start animation

    const restore = () => {
      this.input.enable()
    }

    const childProcessComplete = () => {
      this._childProcess && this._childProcess.removeAllListeners('exit')
      this._childProcess = undefined

      try {
        this._attach()
        this.input.disable()
      } catch (err) {
        console.log('Failed to re-enable graphics device.', err)
        process.exit(1)
      }

      this._start()
      this._curtain.hide(restore)
    }

    let showComplete = false
    let spawnComplete = false

    this.input.disable()

    try {
      console.log('Running command: ', command)
      this._childProcess = spawn(command, { shell: true })
    } catch (err) {
      console.log('process spawn failed: ', err)
      spawnComplete = true
      // TODO: notify caller?
      // return
    }

    this._childProcess.on('exit', code => {
      console.log('Command result: ', code)
      spawnComplete = true

      if (showComplete) {
        childProcessComplete()
      }
    })

    this._curtain.show(255, () => {
      if (spawnComplete) {
        this._curtain.hide(restore)
        return
      }

      this._stop()

      try {
        this._detach()
      } catch (err) {
        console.log('Detach failed: ', err)
        process.exit(1)
      }

      platformQuit()

      showComplete = true
    })
  }

  _startScreenSaver () {
    this._isScreenSaverActive = true
    this.input.disable()

    const restore = () => {
      this.input.enable()
      this._isScreenSaverActive = false
    }

    const activityListener = () => {
      this.input.removeInputActivityListener()
      this._stop()
      this._start(this._options.fps)
      this._curtain.hide(restore)
    }

    this._curtain.show(this._getCurtainOpacity(), () => {
      this._stop()
      this._start(this._options.screenSaverSleepFps)
      this.input.setInputActivityListener(activityListener)
    })
  }

  /**
   * Find the scene graph view associated with the given React component.
   *
   * This method is similar to DOMRenderer.findDOMNode()
   *
   * @param componentOrElement Component to search on.
   * @returns {View}
   */
  findView (componentOrElement) {
    if (!componentOrElement || componentOrElement.nodeType === /* ELEMENT_NODE */1) {
      return componentOrElement
    }

    return this._reconciler.findHostInstance(componentOrElement)
  }

  /**
   * Request the application stop.
   *
   * After this method is called, the application will shutdown on the next application frame.
   */
  close () {
    if (!this._isClosing) {
      this._isClosing = true
      this.emit(Event.CLOSING, createClosingEvent())
    }
  }

  _destroy () {
    this._stop()

    this.emit(Event.CLOSED)
    this.removeAllListeners(Event.CLOSED)

    if (this._childProcess) {
      this._childProcess.removeAllListeners('exit')
      this._childProcess.stdin.pause()
      this._childProcess.kill()
      this._childProcess = undefined
    }

    this.scene && this._curtain && this.scene.root.removeChild(this._curtain)
    this._curtain = undefined

    this._layout = undefined

    this.animation && this.animation.destroy()
    this.animation = undefined

    this.resource && this.resource.destroy()
    this.resource = undefined

    this.audio && this.audio.destroy()
    this.audio = undefined

    this.input && this.input.destroy()
    this.input = undefined

    this._video && this._video.destroy()
    this._video = undefined

    this._reconciler = undefined
    this._container = undefined

    platformQuit()
  }

  _start (fps) {
    let previousTick = now()

    const mainLoop = () => {
      const frameStartTick = now()
      const timeout = this.screenSaverTimeoutMs
      const delta = frameStartTick - previousTick
      const root = this.scene.root

      this._frameCount++

      if (!this._isScreenSaverActive) {
        if ((this._frameCount % fps) === 0) {
          this.emit(Event.HEARTBEAT)
        }

        if (timeout && (frameStartTick - this.input.lastActivity) >= timeout) {
          this._startScreenSaver()
        }
      }

      this._video.processEvents()

      if (this._isClosing) {
        this._destroy()
        return
      }

      this.animation.run(delta) && root.markDirty()

      this._layout.run(root, this.width, this.height) && root.markDirty()

      const video = this._video

      if (root.isDirty()) {
        root.draw(video.createRenderingContext())
        video.present()
      }

      previousTick = frameStartTick
    }

    this._frameWorkerId = setInterval(mainLoop, (1000 / fps) << 0)
  }

  _sleep (fps) {
    this._frameWorkerId = setInterval(() => this._video.keepAlive() || this._destroy(), (1000 / fps) << 0)
  }

  _stop () {
    clearTimeout(this._frameWorkerId)
    this._frameWorkerId = undefined
  }

  _attach () {
    // Init input before video or app gets spurious joystick added events.
    try {
      this.input._attach()
    } catch (err) {
      throw rethrow(Error('Failed to attach input'), err)
    }

    try {
      this.audio._attach()
    } catch (err) {
      throw rethrow(Error('Failed to attach audio'), err)
    }

    try {
      this._video.attach()
    } catch (err) {
      throw rethrow(Error('Failed to attach video'), err)
    }

    const { width, height } = this._video._window

    this.resource._attach(this.scene, {
      graphicsDevice: this._video,
      audioDevice: this.audio._audio
    })

    this.scene._setRoot(width, height)
  }

  _detach () {
    this.resource._detach()
    this._video.detach()
    this.audio._detach()
    this.input._detach()
    platformQuit()
  }

  _getCurtainOpacity () {
    return this.screenSaverMode === ScreenSaverMode.dim ? 200 : 255
  }
}

function registerExitHandler (app) {
  ['SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach(e => {
    process.on(e, (obj) => {
      obj.message && console.log(obj.message)
      obj.stack && console.log(obj.stack)
      process.exit()
    })
  })

  process.on('exit', () => {
    app._destroy()
  })
}

function validateOptions (options) {
  options = { ...DEFAULTS, ...options }

  assert(is.string(options.title), 'title must be a string')
  assert(is.boolean(options.fullscreen), 'fullscreen must be a boolean.')
  assert(is.int(options.width) && options.width >= 0, 'width must be a positive integer.')
  assert(is.int(options.height) && options.height >= 0, 'height must be a positive integer.')
  assert(is.int(options.fps) && options.fps >= 0 && options.fps <= 60, 'fps must be an integer between 0 and 60.')
  assert(is.boolean(options.vsync), 'vsync must be a boolean.')

  if (!options.fullscreen) {
    assert(is.int(options.windowWidth) && options.windowWidth > 0, 'windowWidth must be a positive, non-zero integer.')
    assert(is.int(options.windowHeight) && options.windowHeight > 0, 'height must be a positive, non-zero integer.')
  }

  return options
}

function Curtain (app, { curtainFadeInMs, curtainFadeOutMs }) {
  const curtainStyle = Style({
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'black',
    opacity: new Value(0)
  })

  const view = new BoxView({ style: curtainStyle, visible: false }, app)

  view.show = (opacity, callback) => {
    view.visible = true
    app.animation.timing(
      view.style.opacity,
      {
        to: opacity,
        easing: Easing.quad,
        duration: curtainFadeInMs
      })
      .start(() => callback && setImmediate(callback))
  }

  view.hide = (callback) => {
    app.animation.timing(
      view.style.opacity,
      {
        to: 0,
        easing: Easing.quad,
        duration: curtainFadeOutMs
      })
      .start(() => {
        view.visible = false
        callback && setImmediate(callback)
      })
  }

  return view
}
