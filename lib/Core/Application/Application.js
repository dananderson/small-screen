/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SmallScreenError } from '../Util/SmallScreenError'
import { Reconciler } from './Reconciler'
import { RootView } from '../Views/RootView'
import { shutdown } from '../Platform'
import assert from 'assert'
import { Event } from '../Event/Event'
import { LayoutManager } from '../Views/LayoutManager'
import { FocusManager } from '../Views/FocusManager'
import { performance } from 'perf_hooks'
import { FastEventEmitter } from '../Util'

const now = performance.now

export class Application extends FastEventEmitter {
  constructor ({ window, audio, input, resource, animation }) {
    super()
    this._mainLoopId = undefined

    this._attachables = [
      this.resource = resource,
      this.animation = animation,
      this.audio = audio,
      this.input = input,
      this.window = window
    ]

    this.reconciler = null
    this.react = null

    this.window.onQuit = () => this.close()

    this.layout = new LayoutManager()
    this.focus = new FocusManager()

    this.root = new RootView(this)
    this.input.on(Event.KEY_DOWN, event => this.focus.onKeyDown(event))
  }

  get title () {
    return this.window.getTitle()
  }

  set title (title) {
    this.window.setTitle(title)
  }

  get width () {
    return this.window.width
  }

  get height () {
    return this.window.height
  }

  get fullscreen () {
    return this.window.fullscreen
  }

  resize (width, height, fullscreen) {
    this.window.resize(width, height, fullscreen)
  }

  render (component) {
    if (!this.reconciler) {
      // TODO: exception?

      this.reconciler = Reconciler(this)
      this.react = this.reconciler.createContainer(this.root)
    }

    this.reconciler.updateContainer(component, this.react, null, null)
  }

  close () {
    if (!this._isClosing) {
      this._isClosing = true
    }
  }

  start () {
    if (!this._isAttached) {
      this.attach()
    }

    // TODO: already running, but this api can change fps..
    if (this._mainLoopId) {
      return
    }

    const { window, animation, resource, layout } = this
    let previousTick = now()

    const mainLoop = () => {
      const frameStartTick = now()
      const delta = frameStartTick - previousTick
      const { root, _isClosing, width, height } = this

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

      if (root.isDirty()) {
        console.time('draw')
        root.draw(window.getContext(), width, height)
        console.timeEnd('draw')
        window.present()
      }

      previousTick = frameStartTick
    }

    // TODO: set fps from settings
    this._mainLoopId = setInterval(mainLoop, (1000 / 60) << 0)
  }

  stop () {
    // TODO: stop event
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

    shutdown()
  }

  destroy () {
    if (this._isAttached) {
      this.detach()
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

    clearInterval(this._mainLoopId)
    this._mainLoopId = undefined
  }
}
