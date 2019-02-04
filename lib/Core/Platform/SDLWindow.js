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
import { join } from 'path'
import { Keyboard } from './Keyboard'
import { readFileSync } from 'fs'
import { Gamepad } from './Gamepad'
import { hatToButton } from './hatToButton'
import { performance } from 'perf_hooks'

const now = performance.now
const MAX_EVENTS = 20

export class SDLWindow {
  constructor (SDL) {
    this._SDL = SDL
    SDL.init(SDL.SDL_INIT_VIDEO | SDL.SDL_INIT_JOYSTICK | SDL.SDL_INIT_GAMECONTROLLER)

    this._caps = SDL.SDL_GetRenderDriverInfo(0)

    if (!this._caps) {
      throw new SmallScreenError('Cannot get renderer capabilities.')
    }

    const defaultDisplayMode = this._caps.defaultDisplayMode = SDL.SDL_GetDesktopDisplayMode(0)

    if (!defaultDisplayMode) {
      throw new SmallScreenError('Cannot get current display mode.')
    }

    const format = SDL.getCreateTextureFormat()

    this.gamepadsById = new Map()
    this.keyboard = new Keyboard()
    this.width = 0
    this.height = 0
    this.fullscreen = true
    this.vsync = (this._caps.flags & SDL.SDL_RendererFlags.SDL_RENDERER_PRESENTVSYNC) !== 0
    this.title = 'Small Screen Application'
    this.textureFormat = format.textureFormat
    this.inputReceiver = {
      onDeviceKeyUp: emptyFunction,
      onDeviceKeyDown: emptyFunction,
      onDeviceConnected: emptyFunction,
      onDeviceDisconnected: emptyFunction,
      onDeviceMotion: emptyFunction
    }
    this.onQuit = emptyFunction

    this._pixelFormat = format.pixelFormat
    this._context = new SDLRenderingContext()
    this._gamepadsInitialized = false
    this._gameControllerDB = null

    Object.getOwnPropertyNames(Buffer.prototype)
      .filter(name => name.endsWith(os.endianness()))
      .forEach(name => {
        Buffer.prototype[name.slice(0, -2)] = Buffer.prototype[name]
      })

    this._events = Buffer.alloc(SDL.SDL_EVENT_SIZE * MAX_EVENTS)

    this._initGamepads()
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
    // TODO: review this policy
    if (!width) {
      width = this._caps.defaultDisplayMode.width
    }

    if (!height) {
      height = this._caps.defaultDisplayMode.height
    }

    this.width = width
    this.height = height

    if (fullscreen !== undefined) {
      this.fullscreen = fullscreen
    }
  }

  attach () {
    const SDL = this._SDL

    SDL.init(SDL.SDL_INIT_VIDEO | SDL.SDL_INIT_JOYSTICK | SDL.SDL_INIT_GAMECONTROLLER)

    this.keyboard._resetKeys()
    this._initGamepads()

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

    this._closeGamepads()

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
    const { inputReceiver, gamepadsById, keyboard } = this
    const { getEvents, SDL_EVENT_SIZE } = this._SDL
    const offsetLimit = getEvents(buffer, MAX_EVENTS) * SDL_EVENT_SIZE
    let offset = 0
    let value
    let device
    let timestamp = now()

    while (offset < offsetLimit) {
      switch (buffer.readInt32(0 /* EVENT_TYPE_OFFSET */ + offset)) {
        case 256: // SDL_QUIT:
          this.onQuit()
          break
        case 769: // SDL_KEYUP:
          value = buffer.readUInt32(16 /* KEYBOARD_EVENT_SCANCODE_OFFSET */ + offset)
          keyboard.keys[value] = false
          inputReceiver.onDeviceKeyUp(keyboard, value, timestamp)
          break
        case 768: // SDL_KEYDOWN:
          value = buffer.readUInt32(16 /* KEYBOARD_EVENT_SCANCODE_OFFSET */ + offset)
          keyboard.keys[value] = true
          inputReceiver.onDeviceKeyDown(
            keyboard,
            value,
            (buffer.readUInt8(13 /* KEYBOARD_EVENT_REPEAT_OFFSET */ + offset) !== 0),
            timestamp)
          break
        case 1540: // SDL_JOYBUTTONUP:
          value = buffer.readUInt8(12 /* JOY_BUTTON_EVENT_BUTTON_OFFSET */ + offset)
          device = gamepadsById.get(buffer.readInt32(8 /* JOY_BUTTON_EVENT_WHICH_OFFSET */ + offset))
          device.buttons[value] = false
          inputReceiver.onDeviceKeyUp(device, value, timestamp)
          break
        case 1539: // SDL_JOYBUTTONDOWN:
          value = buffer.readUInt8(12 /* JOY_BUTTON_EVENT_BUTTON_OFFSET */ + offset)
          device = gamepadsById.get(buffer.readInt32(8 /* JOY_BUTTON_EVENT_WHICH_OFFSET */ + offset))
          device.buttons[value] = true
          inputReceiver.onDeviceKeyDown(device, value, false, timestamp)
          break
        case 1538: // SDL_JOYHATMOTION
          this._onJoyHatMotion(
            gamepadsById.get(buffer.readInt32(8 /* JOY_BUTTON_EVENT_WHICH_OFFSET */ + offset)),
            buffer.readUInt8(12 /* hat index */ + offset),
            buffer.readUInt8(13 /* value */ + offset),
            timestamp)
          break
        case 1536: // SDL_JOYAXISMOTION
          value = buffer.readInt16(16 /* value */ + offset)

          inputReceiver.onDeviceMotion(
            gamepadsById.get(buffer.readInt32(8 /* JOY_BUTTON_EVENT_WHICH_OFFSET */ + offset)),
            buffer.readUInt8(12 /* axis index */ + offset,
              timestamp),
            value < 0 ? -(value / -32768 /* SDL_JOYSTICK_AXIS_MIN */) : value / 32767 /* SDL_JOYSTICK_AXIS_MAX */)
          break
        case 1541: // SDL_JOYDEVICEADDED:
          this._onJoyDeviceAdded(buffer.readInt32(8 /* JOY_DEVICE_EVENT_WHICH_OFFSET */), timestamp)
          break
        case 1542: // SDL_JOYDEVICEREMOVED:
          this._onJoyDeviceRemoved(buffer.readInt32(8 /* JOY_DEVICE_EVENT_WHICH_OFFSET */), timestamp)
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

  _onJoyDeviceAdded (index, timestamp) {
    const id = this._SDL.SDL_JoystickGetDeviceInstanceID(index)

    if (this.gamepadsById.has(id)) {
      return
    }

    let gamepad

    try {
      gamepad = createGamepad(index)
    } catch (e) {
      console.log(`Failed to open gamepad at ${index}.`, e)
      return
    }

    this.gamepadsById.set(gamepad.id, gamepad)
    this.inputReceiver.onDeviceConnected(gamepad, timestamp)
  }

  _onJoyDeviceRemoved (id, timestamp) {
    const gamepad = this.gamepadsById.get(id)

    if (gamepad) {
      gamepad._close()
      this.gamepadsById.delete(gamepad.id)
      this.inputReceiver.onDeviceDisconnected(gamepad, timestamp)
    }
  }

  _onJoyHatMotion (gamepad, hatIndex, value, timestamp) {
    const state = gamepad._hats
    const { inputReceiver } = this
    let button

    // TODO: assume no repeats
    if (state[hatIndex] !== 0) {
      button = hatToButton(gamepad, hatIndex, state[hatIndex])
      state[hatIndex] = 0
      gamepad.buttons[button] = false
      inputReceiver.onDeviceKeyUp(gamepad, button, timestamp)
    }

    if ((button = hatToButton(gamepad, hatIndex, value)) !== -1) {
      state[hatIndex] = value
      gamepad.buttons[button] = true
      inputReceiver.onDeviceKeyDown(gamepad, button, false, timestamp)
    }
  }

  _initGamepads () {
    if (this._gamepadsInitialized) {
      return
    }

    this._loadGameControllerMappings()

    const count = this._SDL.getGamepadCount()
    let gamepad

    for (let i = 0; i < count; i++) {
      try {
        gamepad = createGamepad(i)
      } catch (err) {
        console.log(err.message)
        continue
      }

      this.gamepadsById.set(gamepad.id, gamepad)
    }

    this._gamepadsInitialized = true
  }

  _closeGamepads () {
    this.gamepadsById.forEach(gamepad => gamepad._close())
    this.gamepadsById.clear()
    this._gamepadsInitialized = false
  }

  _loadGameControllerMappings () {
    const file = process.env.GAME_CONTROLLER_MAPPINGS

    if (!this._gameControllerDB && file) {
      try {
        console.log('Loading game controller mappings from file @ %s', file)
        this._gameControllerDB = readFileSync(file.startsWith('~') ? join(os.homedir(), file.substr(1)) : file)
      } catch (err) {
        console.log('Failed to load game controller mappings from file @ %s', file)
        this._gameControllerDB = undefined
      }
    }

    if (this._gameControllerDB) {
      try {
        this._SDL.addGameControllerMappings(this._gameControllerDB)
      } catch (err) {
        console.log('Failed to parse game controller mappings from file @ %s', file)
      }
    }
  }
}

function createGamepad (index) {
  return new Gamepad(new SDLGamepad(index))
}
