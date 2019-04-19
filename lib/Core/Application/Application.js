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
import { FontStore } from '../Resource/FontStore'

let { now } = performance

export class Application extends FastEventEmitter {
  static Events = {
    frame: 'frame',
    closing: 'closing'
  }

  constructor ({ platform, input, resource, animation, fontStore }) {
    super()
    this._mainLoopId = undefined

    const window = platform.createWindow()
    const audio = platform.createAudioContext()

    input = input || new InputManager(window)
    fontStore = fontStore || new FontStore()
    resource = resource || new ResourceManager({ graphics: window, audio, fontStore })
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

    // TODO: set fps from refresh rate
    if (!fps || fps < 0 || fps > 60) {
      fps = 60
    }

    const mainLoop = () => {
      const frameStartTick = now()
      const delta = frameStartTick - previousTick
      const { root, _isClosing } = this

      window.processEvents()

      if (_isClosing) {
        this.destroy()
        return
      }

      const { width, height } = window

      let dirty = animation.run(delta)
      dirty = resource.run() || dirty
      dirty = layout.run(root.node, width, height) || dirty

      this.emit(frame, delta)

      if (dirty || root.isDirty()) {
        root.draw(window.getContext(), width, height)
        window.present()
      }

      previousTick = frameStartTick
    }

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
    const { _attachables, _isAttached } = this

    assert(_isAttached, 'detach: Expected application to be attached.')

    this._isAttached = false

    let len = _attachables.length

    while (--len >= 0) {
      try {
        _attachables[len].detach()
      } catch (e) {
        console.log('Error detaching service:', e.message)
      }
    }
  }

  destroy () {
    const { _isAttached, reconciler, root, _attachables, _mainLoopId } = this

    if (_isAttached) {
      this.detach()
    }

    abortController.abort()

    if (reconciler) {
      // Destroy the react container to clean up timers.
      try {
        this.render(null)
      } catch (err) {
        // ignore
      }
      this.reconciler = undefined
    }

    root && root.destroy()
    this.root = undefined

    if (_attachables) {
      for (const attachable of _attachables) {
        try {
          attachable.destroy && attachable.destroy()
        } catch (e) {
          console.log('Error destroying service:', e.message)
        }
      }

      this._attachables = undefined
    }

    _mainLoopId && clearInterval(_mainLoopId)
    this._mainLoopId = undefined
  }
}
