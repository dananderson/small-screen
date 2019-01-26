/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SmallScreenError } from '../Util/SmallScreenError'
import { SDLRenderingContext } from './SDLRenderingContext'
import { SDLGamepad } from './small-screen-sdl'
import emptyFunction from 'fbjs/lib/emptyFunction'
import os from 'os'

const MAX_EVENTS = 20

export class SDLWindow {
  constructor (SDL) {
    this._SDL = SDL
    SDL.init(SDL.SDL_INIT_VIDEO | SDL.SDL_INIT_JOYSTICK | SDL.SDL_INIT_GAMECONTROLLER)

    this.onKeyUp = emptyFunction
    this.onKeyDown = emptyFunction
    this.onJoyUp = emptyFunction
    this.onJoyDown = emptyFunction
    this.onJoyAxis = emptyFunction
    this.onJoyHat = emptyFunction
    this.onJoyConnected = emptyFunction
    this.onJoyDisconnected = emptyFunction
    this.onQuit = emptyFunction

    const caps = this.caps = SDL.SDL_GetRenderDriverInfo(0)

    if (!caps) {
      throw new SmallScreenError('Cannot get renderer capabilities.')
    }

    const defaultDisplayMode = caps.defaultDisplayMode = SDL.SDL_GetDesktopDisplayMode(0)

    if (!defaultDisplayMode) {
      throw new SmallScreenError('Cannot get current display mode.')
    }

    this.width = defaultDisplayMode.width
    this.height = defaultDisplayMode.height
    this.fullscreen = true
    this.vsync = (caps.flags & SDL.SDL_RendererFlags.SDL_RENDERER_PRESENTVSYNC) === SDL.SDL_RendererFlags.SDL_RENDERER_PRESENTVSYNC
    this.title = 'Small Screen Application'

    const format = SDL.getCreateTextureFormat()

    this.textureFormat = format.textureFormat
    this._pixelFormat = format.pixelFormat

    this._context = new SDLRenderingContext()

    this._rAxis = []
    this._mAxis = []

    Object.getOwnPropertyNames(Buffer.prototype)
      .filter(name => name.endsWith(os.endianness()))
      .forEach(name => {
        Buffer.prototype[name.slice(0, -2)] = Buffer.prototype[name]
      })

    this._events = Buffer.alloc(SDL.SDL_EVENT_SIZE * MAX_EVENTS)

    const count = SDLGamepad.count()

    this.gamepads = []

    for (let i = 0; i < count; i++) {
      try {
        this.gamepads.push(new SDLGamepad(i))
      } catch (err) {
        console.log(err.message)
      }
    }
  }

  setTitle (title) {
    this.title = title

    if (this._window) {
      this._SDL.SDL_SetWindowTitle(this.title || '')
    }
  }

  getTitle () {
    return this.title
  }

  resize (width, height, fullscreen) {
    if (!width) {
      width = this.caps.defaultDisplayMode.width
    }

    if (!height) {
      height = this.caps.defaultDisplayMode.height
    }

    this.width = width
    this.height = height

    if (fullscreen !== undefined) {
      this.fullscreen = fullscreen
    }
  }

  attach () {
    const SDL = this._SDL

    // TODO: suppress game controller events?
    SDL.init(SDL.SDL_INIT_VIDEO | SDL.SDL_INIT_JOYSTICK | SDL.SDL_INIT_GAMECONTROLLER)

    try {
      this._window = SDL.createWindow(this.title, this.width, this.height, this.fullscreen)
    } catch (e) {
      throw new SmallScreenError('Failed to create window.', e)
    }

    try {
      this._renderer = SDL.createRenderer(this._window, this.vsync)
    } catch (e) {
      this.detach()
      throw new SmallScreenError('Failed to create renderer.', e)
    }

    try {
      const { width, height } = this._SDL.SDL_GetRendererOutputSize(this._renderer)

      this.width = width
      this.height = height
    } catch (e) {
      this.detach()
      throw new SmallScreenError('Failed to query renderer.', e)
    }

    const flags = SDL.SDL_GetWindowFlags(this._window)

    this.fullscreen = (flags & (SDL.SDL_WINDOW_FULLSCREEN | SDL.SDL_WINDOW_FULLSCREEN_DESKTOP)) !== 0
  }

  detach () {
    const SDL = this._SDL

    this.gamepads.forEach(gamepad => gamepad && gamepad.close())
    this.gamepads = []

    SDL.destroyRenderer(this._renderer)
    this._renderer = undefined

    SDL.destroyWindow(this._window)
    this._window = undefined
  }

  getContext () {
    return this._context._reset(this._renderer)
  }

  present () {
    this._SDL.SDL_RenderPresent(this._renderer)
  }

  processEvents () {
    const buffer = this._events
    const { getEvents, SDL_EVENT_SIZE } = this._SDL
    const offsetLimit = getEvents(buffer, MAX_EVENTS) * SDL_EVENT_SIZE
    let offset = 0

    while (offset < offsetLimit) {
      switch (buffer.readInt32(0 /* EVENT_TYPE_OFFSET */ + offset)) {
        case 256: // SDL_QUIT:
          this.onQuit()
          break
        case 769: // SDL_KEYUP:
          this.onKeyUp(buffer.readUInt32(16 /* KEYBOARD_EVENT_SCANCODE_OFFSET */ + offset))
          break
        case 768: // SDL_KEYDOWN:
          this.onKeyDown(
            buffer.readUInt32(16 /* KEYBOARD_EVENT_SCANCODE_OFFSET */ + offset),
            (buffer.readUInt8(13 /* KEYBOARD_EVENT_REPEAT_OFFSET */ + offset) !== 0))
          break
        case 1540: // SDL_JOYBUTTONUP:
          this.onJoyUp(
            buffer.readInt32(8 /* JOY_BUTTON_EVENT_WHICH_OFFSET */ + offset),
            buffer.readUInt8(12 /* JOY_BUTTON_EVENT_BUTTON_OFFSET */ + offset),
            0)
          break
        case 1539: // SDL_JOYBUTTONDOWN:
          this.onJoyDown(
            buffer.readInt32(8 /* JOY_BUTTON_EVENT_WHICH_OFFSET */ + offset),
            buffer.readUInt8(12 /* JOY_BUTTON_EVENT_BUTTON_OFFSET */ + offset),
            1)
          break
        case 1538: // SDL_JOYHATMOTION
          this.onJoyHat(
            buffer.readInt32(8 /* which */ + offset),
            buffer.readUInt8(12 /* hat index */ + offset),
            buffer.readUInt8(13 /* value */ + offset))
          break
        case 1536: // SDL_JOYAXISMOTION
          this.onJoyAxis(
            buffer.readInt32(8 /* which */ + offset), // id
            buffer.readUInt8(12 /* axis index */ + offset), // axis
            buffer.readInt16(16 /* value */ + offset) // value
          )
          break
        case 1541: // SDL_JOYDEVICEADDED:
          this._onJoyDeviceAdded(buffer.readInt32(8 /* JOY_DEVICE_EVENT_WHICH_OFFSET */))
          break
        case 1542: // SDL_JOYDEVICEREMOVED:
          this._onJoyDeviceRemoved(buffer.readInt32(8 /* JOY_DEVICE_EVENT_WHICH_OFFSET */))
          break
      }

      offset += SDL_EVENT_SIZE
    }
  }

  createTexture (image) {
    return this._SDL.createTexture(
      this._renderer,
      image.width,
      image.height,
      this._pixelFormat,
      image.buffer)
  }

  createFontTexture (font) {
    return this._SDL.createFontTexture(
      this._renderer,
      font,
      this._pixelFormat)
  }

  destroyTexture (texturePtr) {
    texturePtr && this._SDL.destroyTexture(texturePtr)
  }

  _onJoyDeviceAdded (index) {
    const id = this._SDL.SDL_JoystickGetDeviceInstanceID(index)

    if (this.gamepads.findIndex(j => j.id === id) !== -1) {
      return
    }

    let gamepad

    try {
      gamepad = new SDLGamepad(index)
    } catch (e) {
      console.log(`Failed to open gamepad at ${index}.`, e)
      return
    }

    this.gamepads.push(gamepad)
    this.onJoyConnected(gamepad)
  }

  _onJoyDeviceRemoved (id) {
    const i = this.gamepads.findIndex(j => j.id === id)

    if (i !== -1) {
      const gamepad = this.gamepads[i]

      this.onJoyDisconnected(id)

      gamepad.close()
      this.gamepads.splice(i, 1)
    }
  }
}
