/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { now } from '../Util'
import { SmallScreenError } from '../Util/SmallScreenError'
import { Reconciler } from './Reconciler'
import { BoxView } from '../Views/BoxView'
import { FocusManager } from '../Views/FocusManager'
import { LayoutManager } from '../Views/LayoutManager'

const rootStyle = {
  position: 'absolute',
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
}

export class Application {
  constructor ({audio, input, resource, animation, platform}) {
    this._platform = platform
    // this._options = options
    this._mainLoopId = undefined

    this.audio = audio
    this.input = input
    this.resource = resource
    this.animation = animation
    this._platform = platform

    // TODO: move to root view
    this.layout = new LayoutManager()
    this.focus = new FocusManager(this)

    // TODO: stub implementation rather than exception?
    try {
      this.graphics = this._platform.createGraphicsContainer('sdl', { input: this.input })
    } catch (e) {
      throw new SmallScreenError('Failed to create graphics driver.', e)
    }

    this.width = this.graphics.width
    this.height = this.graphics.height
  }

  get title() {
    return this.graphics.getTitle()
  }

  set title(title) {
    this.graphics.setTitle(title)
  }

  get fullscreen() {
    return this.graphics.fullscreen
  }

  configure({width, height, fullscreen}) {
    this.graphics.configure({width, height, fullscreen})

    // TODO: this is not right...
    this.width = this.graphics.width
    this.height = this.graphics.height
  }

  render(component) {
    if (!this.reconciler) {
      this.reconciler = Reconciler(this)
    }

    if (this.container) {
      this.reconciler.updateContainer(component, this.container, null, null)
      this.container = undefined
    }

    if (component) {
      this.root = new BoxView(rootStyle, this)
      this.container = this.reconciler.createContainer(this.root)
      this.reconciler.updateContainer(component, this.container, null, null)
    }

    // TODO: user must call start?
    // this.start()
  }

  close() {
    if (!this._isClosing) {
      this._isClosing = true
      // this._messageQueue.emit('app:closing', this)
    }
  }

  start() {
    if (!this._isAttached) {
      this.attach()
    }

    // TODO: already running, but this api can change fps..
    if (this._mainLoopId) {
      return
    }

    const graphics = this.graphics
    // const mq = this._messageQueue
    let previousTick = now()

    const mainLoop = () => {
      const frameStartTick = now()
      const delta = frameStartTick - previousTick

      graphics.processEvents()

      if (this._isClosing) {
        // TODO: destroy / stop
        this.detach()
        clearInterval(this._mainLoopId)
        this._mainLoopId = undefined
        // mq.emit('app:closed', this)
        return
      }

      // mq.emit('app:frame', this, delta)

      if (this.animation.run(delta)) {
        this.root.markDirty()
      }

      // TODO: add a RootView with draw api that does this stuff?

      const root = this.root

      // TODO: move this to scene?

      this.layout.run(root, this.width, this.height)

      if (root.isDirty()) {
        root.draw(graphics.createRenderingContext())
        graphics.present()
      }

      previousTick = frameStartTick
    }

    // TODO: set fps
    this._mainLoopId = setInterval(mainLoop, (1000 / 60) << 0)

    // mq.emit('app:start', this)
  }

  stop() {
    // TODO: stop event
  }

  sleep() {
    // TODO: stop event?
    // TODO: sleep needed?
  }

  attach() {
    const graphics = this.graphics

    try {
      graphics.attach()
    } catch (e) {
      throw new SmallScreenError('Failed to attach graphics container.', e)
    }

    this.width = this.graphics.width
    this.height = this.graphics.height

    graphics.onQuit = () => {
      this.close()
    }

    this.audio._attach()

    this.resource._attach(this.root, { graphics })

    this.input._attach()

    // TODO: attaching / attached?
    // this._messageQueue.emit('app:attach', this)

    this._isAttached = true
  }

  detach() {
    this._isAttached = false
    // TODO: detaching / detached?
    // this._messageQueue.emit('app:detach', this)

    // TODO: errors?
    this.audio._detach()
    this.input._detach()
    this.resource._detach()
    this.graphics.detach()
    this._platform.release()
  }
}
