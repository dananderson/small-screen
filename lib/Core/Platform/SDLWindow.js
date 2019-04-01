/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SDLGamepad, SDLClient, SDLRenderingContext } from './small-screen-sdl'
import emptyFunction from 'fbjs/lib/emptyFunction'
import os from 'os'
import { Keyboard } from './Keyboard'
import { Gamepad } from './Gamepad'
import { hatToButton } from './hatToButton'
import { performance } from 'perf_hooks'
import { format } from 'util'
import emptyObject from 'fbjs/lib/emptyObject'

const now = performance.now
const MAX_EVENTS = 20
const EVENT_TYPE_OFFSET = 0
const SDL_QUIT = 256
const SDL_KEYUP = 769
const SDL_KEYDOWN = 768
const SDL_JOYBUTTONUP = 1540
const SDL_JOYBUTTONDOWN = 1539
const SDL_JOYHATMOTION = 1538
const SDL_JOYAXISMOTION = 1536
const SDL_JOYDEVICEADDED = 1541
const SDL_JOYDEVICEREMOVED = 1542

const SDL_JOYSTICK_AXIS_MIN = -32768
const SDL_JOYSTICK_AXIS_MAX = 32767

const JOY_DEVICE_EVENT_WHICH_OFFSET = 8
const JOY_BUTTON_EVENT_WHICH_OFFSET = 8
const JOY_HAT_EVENT_WHICH_OFFSET = 8
const JOY_MOITION_EVENT_WHICH_OFFSET = 8
const JOY_HAT_EVENT_HAT_INDEX_OFFSET = 12
const JOY_HAT_EVENT_HAT_VALUE_OFFSET = 13
const JOY_BUTTON_EVENT_BUTTON_OFFSET = 12
const JOY_MOITION_EVENT_AXIS_INDEX_OFFSET = 12
const JOY_MOITION_EVENT_AXIS_VALUE_OFFSET = 16
const KEYBOARD_EVENT_SCANCODE_OFFSET = 16
const KEYBOARD_EVENT_REPEAT_OFFSET = 13

export class SDLWindow {
  constructor (SDL) {
    this._SDL = SDL
    this.caps = SDL.capabilities()

    const { defaultResolution, vsync, textureFormat } = this.caps
    const { width, height } = defaultResolution

    this.client = null
    this.gamepadsById = new Map()
    this.keyboard = new Keyboard()
    this.width = width
    this.height = height
    this.screenWidth = 0
    this.screenHeight = 0
    this.fullscreen = true
    this.vsync = vsync
    this.title = ''
    this.textureFormat = textureFormat
    this.inputReceiver = {
      onDeviceKeyUp: emptyFunction,
      onDeviceKeyDown: emptyFunction,
      onDeviceConnected: emptyFunction,
      onDeviceDisconnected: emptyFunction,
      onDeviceMotion: emptyFunction
    }
    this.onQuit = emptyFunction

    this._context = null
    this._gamepadsInitialized = false

    Object.getOwnPropertyNames(Buffer.prototype)
      .filter(name => name.endsWith(os.endianness()))
      .forEach(name => {
        Buffer.prototype[name.slice(0, -2)] = Buffer.prototype[name]
      })

    this._events = Buffer.alloc(SDL.eventSize * MAX_EVENTS)

    this._initGamepads()
  }

  setTitle (title) {
    this.title = title

    if (this.client) {
      this.client.setTitle(title)
    }
  }

  getTitle () {
    return this.title
  }

  resize (width, height, options = emptyObject) {
    if (this.client) {
      throw Error('Cannot resize display for a running application.')
    }

    const fullscreen = options.fullscreen === undefined || options.fullscreen
    let screenWidth = options.resolution ? options.resolution.width : 0
    let screenHeight = options.resolution ? options.resolution.height : 0

    if (fullscreen) {
      if (screenWidth === 0 && screenHeight === 0) {
        const { defaultResolution } = this.caps

        screenWidth = defaultResolution.width
        screenHeight = defaultResolution.height
      }

      const { availableResolutions } = this.caps

      if (!availableResolutions.some(r => r.width === screenWidth && r.height === screenHeight)) {
        throw Error(format('%ix%i is not an available resolution.', screenWidth, screenHeight))
      }

      if (width === 0 && height === 0) {
        width = screenWidth
        height = screenHeight
      }
    } else {
      if (width === 0 && height === 0) {
        width = 720
        height = 480
      }

      if (screenWidth === 0 && screenHeight === 0) {
        screenWidth = width
        screenHeight = height
      }

      const { windowManagerBounds } = this.caps

      if (screenWidth > windowManagerBounds.width) {
        screenWidth = windowManagerBounds.width
      }

      if (screenHeight > windowManagerBounds.height) {
        screenHeight = windowManagerBounds.height
      }
    }

    this.fullscreen = fullscreen
    this.width = width
    this.height = height
    this.screenWidth = screenWidth
    this.screenHeight = screenHeight
  }

  attach () {
    this.client = new SDLClient(
      this.width,
      this.height,
      this.screenWidth,
      this.screenHeight,
      this.fullscreen,
      this.vsync,
      this.textureFormat,
      this.caps.texturePixelFormat)

    this.width = this.client.getWidth()
    this.height = this.client.getHeight()
    this.screenWidth = this.client.getScreenWidth()
    this.screenHeight = this.client.getScreenHeight()
    this.fullscreen = this.client.isFullscreen()

    this._context = new SDLRenderingContext(this.client)
    this.keyboard._resetKeys()

    this._gamepadsInitialized || this._initGamepads()
  }

  detach () {
    this._closeGamepads()

    const { _context, client } = this

    _context && _context.destroy()
    client && client.destroy()

    this._context = this.client = undefined
  }

  getContext () {
    return this._context._reset()
  }

  present () {
    this.client.present()
  }

  processEvents () {
    const { inputReceiver, gamepadsById, keyboard, _events } = this
    const buffer = _events
    const { getEvents, eventSize } = this._SDL
    const offsetLimit = getEvents(buffer, MAX_EVENTS) * eventSize
    const timestamp = now()
    let offset = 0
    let value
    let device

    while (offset < offsetLimit) {
      switch (buffer.readInt32(EVENT_TYPE_OFFSET + offset)) {
        case SDL_QUIT:
          this.onQuit()
          break
        case SDL_KEYUP:
          value = buffer.readUInt32(KEYBOARD_EVENT_SCANCODE_OFFSET + offset)
          keyboard.keys[value] = false
          inputReceiver.onDeviceKeyUp(keyboard, value, timestamp)
          break
        case SDL_KEYDOWN:
          value = buffer.readUInt32(KEYBOARD_EVENT_SCANCODE_OFFSET + offset)
          keyboard.keys[value] = true
          inputReceiver.onDeviceKeyDown(
            keyboard,
            value,
            (buffer.readUInt8(KEYBOARD_EVENT_REPEAT_OFFSET + offset) !== 0),
            timestamp)
          break
        case SDL_JOYBUTTONUP:
          value = buffer.readUInt8(JOY_BUTTON_EVENT_BUTTON_OFFSET + offset)
          device = gamepadsById.get(buffer.readInt32(JOY_BUTTON_EVENT_WHICH_OFFSET + offset))
          device.buttons[value] = false
          inputReceiver.onDeviceKeyUp(device, value, timestamp)
          break
        case SDL_JOYBUTTONDOWN:
          value = buffer.readUInt8(JOY_BUTTON_EVENT_BUTTON_OFFSET + offset)
          device = gamepadsById.get(buffer.readInt32(JOY_BUTTON_EVENT_WHICH_OFFSET + offset))
          device.buttons[value] = true
          inputReceiver.onDeviceKeyDown(device, value, false, timestamp)
          break
        case SDL_JOYHATMOTION:
          this._onJoyHatMotion(
            gamepadsById.get(buffer.readInt32(JOY_HAT_EVENT_WHICH_OFFSET + offset)),
            buffer.readUInt8(JOY_HAT_EVENT_HAT_INDEX_OFFSET + offset),
            buffer.readUInt8(JOY_HAT_EVENT_HAT_VALUE_OFFSET + offset),
            timestamp)
          break
        case SDL_JOYAXISMOTION:
          value = buffer.readInt16(JOY_MOITION_EVENT_AXIS_VALUE_OFFSET + offset)

          inputReceiver.onDeviceMotion(
            gamepadsById.get(buffer.readInt32(JOY_MOITION_EVENT_WHICH_OFFSET + offset)),
            buffer.readUInt8(JOY_MOITION_EVENT_AXIS_INDEX_OFFSET + offset,
              timestamp),
            value < 0 ? -(value / SDL_JOYSTICK_AXIS_MIN) : value / SDL_JOYSTICK_AXIS_MAX)
          break
        case SDL_JOYDEVICEADDED:
          this._onJoyDeviceAdded(buffer.readInt32(JOY_DEVICE_EVENT_WHICH_OFFSET + offset), timestamp)
          break
        case SDL_JOYDEVICEREMOVED:
          this._onJoyDeviceRemoved(buffer.readInt32(JOY_DEVICE_EVENT_WHICH_OFFSET + offset), timestamp)
          break
      }

      offset += eventSize
    }
  }

  createTexture ({ width, height, buffer }) {
    return this.client.createTexture(width, height, buffer)
  }

  createFontTexture (font) {
    return this.client.createFontTexture(font)
  }

  destroyTexture (texturePtr) {
    texturePtr && this.client.destroyTexture(texturePtr)
  }

  _onJoyDeviceAdded (index, timestamp) {
    if (this.gamepadsById.has(SDLGamepad.getIdForIndex(index))) {
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
    const count = SDLGamepad.length
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
}

function createGamepad (index) {
  return new Gamepad(new SDLGamepad(index))
}
