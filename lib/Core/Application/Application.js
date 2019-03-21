/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SmallScreenError } from '../Util/SmallScreenError'
import { Reconciler } from './Reconciler'
import { RootView } from '../Views/RootView'
import assert from 'assert'
import { LayoutManager } from '../Views/LayoutManager'
import { FocusManager } from '../Views/FocusManager'
import { performance } from 'perf_hooks'
import { abortController, FastEventEmitter } from '../Util'
import { InputManager } from '../Input/InputManager'
import { ResourceManager } from '../Resource/ResourceManager'
import { AnimationManager } from '../Animated/AnimationManager'

const now = performance.now

export class Application extends FastEventEmitter {
  static Events = {
    frame: 'frame',
    closing: 'closing'
  }

  constructor ({ platform, input, resource, animation }) {
    super()
    this._mainLoopId = undefined

    const window = platform.createWindow()
    const audio = platform.createAudioContext()

    input = input || new InputManager(window)
    resource = resource || new ResourceManager({ graphics: window, audio })
    animation = animation || new AnimationManager()

    this._attachables = [
      this.platform = platform,
      this.window = window,
      this.audio = audio,
      this.input = input,
      this.resource = resource,
      this.animation = animation
    ]

    this.reconciler = null
    this.react = null

    this.window.onQuit = () => this.close()

    this.layout = new LayoutManager()
    this.focus = new FocusManager()

    this.root = new RootView(this)

    window.inputReceiver = input
    // TODO: keyup?
    this.input.on(InputManager.Events.keydown, this.focus.onKeyDown.bind(this.focus))
  }

  render (component, callback) {
    if (!this.reconciler) {
      // TODO: exception?

      this.reconciler = Reconciler(this)
      this.react = this.reconciler.createContainer(this.root)
    }

    return this.reconciler.updateContainer(component, this.react, null, callback)
  }

  close () {
    if (!this._isClosing) {
      this.emit(Application.Events.closing)
      this._isClosing = true
    }
  }

  start (fps) {
    if (!this._isAttached) {
      this.attach()
    }

    if (this._mainLoopId) {
      return
    }

    const { window, animation, resource, layout } = this
    const { frame } = Application.Events
    let previousTick = now()

    const mainLoop = () => {
      const frameStartTick = now()
      const delta = frameStartTick - previousTick
      const { root, _isClosing } = this
      const { width, height } = window

      window.processEvents()

      if (_isClosing) {
        this.destroy()
        return
      }

      if (animation.run(delta)) {
        root.markDirty()
      }

      if (resource.run()) {
        root.markDirty()
      }

      if (layout.run(root.node, width, height)) {
        root.markDirty()
      }

      this.emit(frame, delta)

      if (root.isDirty()) {
        root.draw(window.getContext(), width, height)
        window.present()
      }

      previousTick = frameStartTick
    }

    if (!fps || fps < 0 || fps > 60) {
      fps = 60
    }

    // TODO: set fps from refresh rate
    this._mainLoopId = setInterval(mainLoop, (1000 / fps) << 0)
  }

  stop () {
    // TODO: emit stop event?
    clearInterval(this._mainLoopId)
    this._mainLoopId = undefined
  }

  sleep () {
    // TODO: stop event?
    // TODO: sleep needed?
  }

  attach () {
    assert(!this._isAttached, 'attach: Expected application to be detached.')

    try {
      for (const attachable of this._attachables) {
        attachable.attach()
      }
    } catch (e) {
      throw new SmallScreenError('Failed to attach service to application.', e)
    }

    this._isAttached = true
  }

  detach () {
    assert(this._isAttached, 'detach: Expected application to be attached.')

    this._isAttached = false

    let len = this._attachables.length

    while (--len >= 0) {
      try {
        this._attachables[len].detach()
      } catch (e) {
        console.log('Error detaching service:', e.message)
      }
    }
  }

  destroy () {
    if (this._isAttached) {
      this.detach()
    }

    abortController.abort()

    if (this.reconciler) {
      // Destroy the react container to clean up timers.
      try {
        this.render(null)
      } catch (err) {
        // ignore
      }
      this.reconciler = undefined
    }

    this.root && this.root.destroy()
    this.root = undefined

    let len = this._attachables ? this._attachables.length : 0

    while (--len >= 0) {
      try {
        if (this._attachables[len].destroy) {
          this._attachables[len].destroy()
        }
      } catch (e) {
        console.log('Error destroying service:', e.message)
      }
    }

    this._attachables = undefined

    this._mainLoopId && clearInterval(this._mainLoopId)
    this._mainLoopId = undefined
  }
}
