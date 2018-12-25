/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SDLRenderingContext } from './SDLRenderingContext'
import { rethrow } from '../Utilities/rethrow'
import { TextureFormat } from '../Utilities/TextureFormat'
import { Event } from '../Event/Event'
import { createCloseRequestEvent } from '../Event/EventFactory'
import { Key } from '../Input/Key'

export class SDLVideo {
  constructor (SDL, callbacks, options) {
    this.SDL = SDL
    this._options = options
    this._window = new Window(this.SDL, callbacks, options)
    this._renderer = new Renderer(this.SDL, options)
    this._renderingContext = new SDLRenderingContext(SDL)
  }

  attach () {
    // assert !window and !renderer
    const SDL = this.SDL

    if (SDL.SDL_InitSubSystem(SDL.SDL_INIT_VIDEO)) {
      throw Error(`Error initializing SDL Video: ${SDL.SDL_GetError()}`)
    }

    try {
      this._window.attach()
    } catch (err) {
      rethrow(Error('Window attach failed.'), err)
    }

    try {
      this._renderer.attach(this._window)
    } catch (err) {
      rethrow(Error('Window attach failed.'), err)
    }

    this._renderingContext._reset(this._renderer.renderer)
  }

  detach () {
    this._renderer.detach()
    this._window.detach()
  }

  destroy () {
    this.detach()
  }

  createRenderingContext () {
    this._renderingContext._prepare()
    return this._renderingContext
  }

  present () {
    this.SDL.SDL_RenderPresent(this._renderer.renderer)
  }

  getTextureFormat () {
    return this._renderer.textureFormat
  }

  createTexture (image) {
    const renderer = this._renderer

    return this.SDL.createTexture(
      renderer.renderer,
      image.width,
      image.height,
      renderer.texturePixelFormat,
      image.buffer)
  }

  destroyTexture (texture) {
    texture && this.SDL.destroyTexture(texture)
  }

  keepAlive () {
    this._window.keepAlive()
  }

  processEvents () {
    this._window.processEvents()
  }
}

class Window {
  constructor (SDL, callbacks, options) {
    let display

    this.SDL = SDL

    if (options.fullscreen) {
      this.x = this.y = SDL.SDL_WINDOWPOS_UNDEFINED
      display = findClosestDisplay(SDL, options.width, options.height)
      this.windowFlags = SDL.SDL_WindowFlags.SDL_WINDOW_OPENGL | SDL.SDL_WindowFlags.SDL_WINDOW_FULLSCREEN
    } else {
      this.x = this.y = SDL.SDL_WINDOWPOS_CENTERED
      display = { width: options.windowWidth, height: options.windowHeight }
      this.windowFlags = SDL.SDL_WindowFlags.SDL_WINDOW_OPENGL
    }

    if (options.width === 0 || options.height === 0) {
      // Render to the screen directly. No scaling or letterbox.
      this.width = display.width
      this.height = display.height
    } else {
      // Render to these screen dimensions. Graphics device will scale and letter box as necessary if these
      // dimensions do not match the screen dimensions.
      this.width = options.width
      this.height = options.height
    }

    this.fullscreen = !!options.fullscreen
    this._title = options.title
    this.window = undefined
    this._bufferedEventQueue = new BufferedEventQueue(SDL)
    this._input = callbacks.input
    this._quit = callbacks.quit

    this._rAxis = []
    this._mAxis = []
  }

  attach () {
    if (this.fullscreen) {
      this.SDL.SDL_ShowCursor(0)
    }

    this.window = this.SDL.SDL_CreateWindow(
      this._title,
      this.x,
      this.y,
      this.width,
      this.height,
      this.windowFlags)

    if (!this.window) {
      throw new Error()
    }
  }

  detach () {
    this.window && this.SDL.SDL_DestroyWindow(this.window)
    this.window = undefined
  }

  keepAlive () {
    const queue = this._bufferedEventQueue
    const buffer = this._bufferedEventQueue.buffer
    let offset

    queue.captureEvents()

    while ((offset = queue.next()) !== -1) {
      if (buffer.readInt32(0 /* EVENT_TYPE_OFFSET */ + offset) === 256 /* SDL.SDL_EventType.SDL_QUIT */) {
        return false
      }
    }

    return true
  }

  processEvents () {
    const queue = this._bufferedEventQueue
    const buffer = this._bufferedEventQueue.buffer
    const input = this._input
    let offset

    queue.captureEvents()

    // perf: use hardcoded literals, rather than the SDL constants
    // perf: read SDL_Event values directly from the buffer (Struct is slow)

    while ((offset = queue.next()) !== -1) {
      switch (buffer.readInt32(0 /* EVENT_TYPE_OFFSET */ + offset)) {
        case 256: // SDL_QUIT:
          this._quit.emit(Event.CLOSE_REQUEST, createCloseRequestEvent())
          break
        case 769: // SDL_KEYUP:
          input._onKeyboardUp(buffer.readUInt32(16 /* KEYBOARD_EVENT_SCANCODE_OFFSET */ + offset), false)
          break
        case 768: // SDL_KEYDOWN:
          input._onKeyboardDown(
            buffer.readUInt32(16 /* KEYBOARD_EVENT_SCANCODE_OFFSET */ + offset),
            (buffer.readUInt8(13 /* KEYBOARD_EVENT_REPEAT_OFFSET */ + offset) !== 0))
          break

          // TODO: enable / disable raw keys

        case 1540: // SDL_JOYBUTTONUP:
          input._onJoystickButton(
            buffer.readInt32(8 /* JOY_BUTTON_EVENT_WHICH_OFFSET */ + offset),
            buffer.readUInt8(12 /* JOY_BUTTON_EVENT_BUTTON_OFFSET */ + offset),
            0)
          break
        case 1539: // SDL_JOYBUTTONDOWN:
          input._onJoystickButton(
            buffer.readInt32(8 /* JOY_BUTTON_EVENT_WHICH_OFFSET */ + offset),
            buffer.readUInt8(12 /* JOY_BUTTON_EVENT_BUTTON_OFFSET */ + offset),
            1)
          break
        case 1538: // SDL_JOYHATMOTION
          // #define SDL_HAT_CENTERED    0x00
          // #define SDL_HAT_UP          0x01
          // #define SDL_HAT_RIGHT       0x02
          // #define SDL_HAT_DOWN        0x04
          // #define SDL_HAT_LEFT        0x08
          // #define SDL_HAT_RIGHTUP     (SDL_HAT_RIGHT|SDL_HAT_UP)
          // #define SDL_HAT_RIGHTDOWN   (SDL_HAT_RIGHT|SDL_HAT_DOWN)
          // #define SDL_HAT_LEFTUP      (SDL_HAT_LEFT|SDL_HAT_UP)
          // #define SDL_HAT_LEFTDOWN    (SDL_HAT_LEFT|SDL_HAT_DOWN)
          {
            const value = buffer.readUInt8(13 /* value */ + offset)

            if (value === 0x0 || value === 0x1 || value === 0x2 || value === 0x4 || value === 0x8) {
              input._onJoystickHat(
                buffer.readInt32(8 /* which */ + offset),
                buffer.readUInt8(12 /* hat index */ + offset),
                value)
            }
          }
          break
        case 1536: // SDL_JOYAXISMOTION
          {
            const DEADZONE = 23000
            const id = buffer.readInt32(8 /* which */ + offset)
            const axis = buffer.readUInt8(12 /* axis index */ + offset)
            const value = buffer.readInt16(16 /* value */ + offset)
            const absValue = Math.abs(value)

            if (!this._rAxis[id]) {
              this._rAxis[id] = []
            }

            if ((absValue > DEADZONE) !== ((this._rAxis[id][axis] || 0) > DEADZONE)) {
              let digitalValue

              if (absValue <= DEADZONE) {
                digitalValue = 0
              } else {
                if (value > 0) {
                  digitalValue = 1
                } else {
                  digitalValue = -1
                }
              }

              input._onJoystickAxis(id, axis, digitalValue)
            }

            this._rAxis[id][axis] = absValue
          }
          break

        case 1541: // SDL_JOYDEVICEADDED:
          {
            const id = buffer.readInt32(8 /* JOY_DEVICE_EVENT_WHICH_OFFSET */)

            input._onJoystickAdded(id)
          }
          break
        case 1542: // SDL_JOYDEVICEREMOVED:
          {
            const id = buffer.readInt32(8 /* JOY_DEVICE_EVENT_WHICH_OFFSET */)

            this._mAxis[id] = this._rAxis[id] = undefined

            input._onJoystickRemoved(id)
          }
          break
        case 1617: // SDL_CONTROLLERBUTTONDOWN
          input._onKeyDown(buffer.readUInt8(12 /* JOY_BUTTON_EVENT_BUTTON_OFFSET */ + offset))
          break
        case 1618: // SDL_CONTROLLERBUTTONUP
          input._onKeyUp(buffer.readUInt8(12 /* JOY_BUTTON_EVENT_BUTTON_OFFSET */ + offset))
          break
        case 1616: // SDL_CONTROLLERAXISMOTION
          {
            const DEADZONE = 23000
            const id = buffer.readInt32(8 /* which */ + offset)
            const axis = buffer.readUInt8(12 /* axis index */ + offset)
            const value = buffer.readInt16(16 /* value */ + offset)
            const absValue = Math.abs(value)
            let prevValue

            if (!this._mAxis[id]) {
              this._mAxis[id] = []
              prevValue = 0
            } else {
              prevValue = this._mAxis[id][axis]
            }

            if ((absValue > DEADZONE) !== (prevValue > DEADZONE)) {
              let digitalValue

              if (absValue <= DEADZONE) {
                digitalValue = 0
              } else {
                if (value > 0) {
                  digitalValue = 1
                } else {
                  digitalValue = -1
                }
              }

              switch (axis) {
                case 0:
                  if (digitalValue === 1) {
                    input._onKeyDown(Key.LEFT_AXIS_RIGHT)
                  } else if (digitalValue === -1) {
                    input._onKeyDown(Key.LEFT_AXIS_LEFT)
                  }
                  break
                case 1:
                  if (digitalValue === 1) {
                    input._onKeyDown(Key.LEFT_AXIS_DOWN)
                  } else if (digitalValue === -1) {
                    input._onKeyDown(Key.LEFT_AXIS_UP)
                  }
                  break
                case 2:
                  if (digitalValue === 1) {
                    input._onKeyDown(Key.RIGHT_AXIS_RIGHT)
                  } else if (digitalValue === -1) {
                    input._onKeyDown(Key.RIGHT_AXIS_LEFT)
                  }
                  break
                case 3:
                  if (digitalValue === 1) {
                    input._onKeyDown(Key.RIGHT_AXIS_DOWN)
                  } else if (digitalValue === -1) {
                    input._onKeyDown(Key.RIGHT_AXIS_UP)
                  }
                  break
                case 4:
                  if (digitalValue === 0) {
                    input._onKeyUp(Key.L2)
                  } else if (digitalValue === 1) {
                    input._onKeyDown(Key.L2)
                  }
                  break
                case 5:
                  if (digitalValue === 0) {
                    input._onKeyUp(Key.R2)
                  } else if (digitalValue === 1) {
                    input._onKeyDown(Key.R2)
                  }
                  break
              }

              // SDL_CONTROLLER_AXIS_LEFTX,
              // SDL_CONTROLLER_AXIS_LEFTY,
              // SDL_CONTROLLER_AXIS_RIGHTX,
              // SDL_CONTROLLER_AXIS_RIGHTY,
              // SDL_CONTROLLER_AXIS_TRIGGERLEFT,
              // SDL_CONTROLLER_AXIS_TRIGGERRIGHT,

            // input._onMappedAxis(id, axis, digitalValue)
            }

            this._mAxis[id][axis] = absValue
          }
          break
      }
    }
  }
}

class Renderer {
  constructor (SDL, options) {
    this.SDL = SDL
    this._options = options
    this.renderer = undefined
    this.textureFormat = undefined
    this.texturePixelFormat = undefined
    this._renderCaps = getRendererCaps(SDL)

    if (!this._renderCaps.hasHardwareAcceleration) {
      throw Error('No hardware acceleration available.')
    }

    if (!this._renderCaps.hasRenderToTexture) {
      throw Error('No render to texture available.')
    }

    if (!this._renderCaps.textureFormats || this._renderCaps.textureFormats.length === 0) {
      throw Error('No 32 bit texture format available.')
    }

    if (options.vsync && !this._renderCaps.hasVsync) {
      throw Error('No vsync available.')
    }

    this._rendererFlags = SDL.SDL_RendererFlags.SDL_RENDERER_TARGETTEXTURE |
      SDL.SDL_RendererFlags.SDL_RENDERER_ACCELERATED

    if (this._options.vsync) {
      this._rendererFlags |= SDL.SDL_RendererFlags.SDL_RENDERER_PRESENTVSYNC
    }
  }

  attach (window) {
    const SDL = this.SDL
    const {SDL_CreateRenderer, SDL_RenderSetLogicalSize, SDL_GetWindowPixelFormat} = this.SDL // eslint-disable-line
    const windowRef = window.window

    const formats = chooseCompatibleTextureFormat(
      SDL,
      this._renderCaps,
      SDL_GetWindowPixelFormat(windowRef), [
        SDL.SDL_PIXELFORMAT_ARGB8888,
        SDL.SDL_PIXELFORMAT_RGBA8888,
        SDL.SDL_PIXELFORMAT_ABGR8888,
        SDL.SDL_PIXELFORMAT_BGRA8888
      ]
    )

    this.textureFormat = formats.textureFormat
    this.texturePixelFormat = formats.pixelFormat

    this.renderer = SDL_CreateRenderer(windowRef, 0, this._rendererFlags)

    if (!this.renderer) {
      throw Error('Failed to create renderer.')
    }

    if (windowRef.width !== windowRef.screenWidth && windowRef.height !== windowRef.screenHeight) {
      SDL_RenderSetLogicalSize(this.renderer, windowRef.width, windowRef.height)
      // SDL_RenderSetIntegerScale(this.ref, this.SDL.SDL_TRUE)
    }
  }

  detach () {
    this.renderer && this.SDL.SDL_DestroyRenderer(this.renderer)
    this.renderer = undefined
  }
}

/*
 * SDL_PollEvent is really slow through fastcall/ffi, especially when the event queue is flooded with mouse move
 * or joystick axis events. The performance issue is a combination of the ref struct objects (SDL_Event is a giant
 * union) and the SDL_PollEvent call itself. This class reads up to 20 events per frame into a Buffer. The event
 * information is read directly from the Buffer. Much faster.
 */
class BufferedEventQueue {
  constructor (SDL) {
    this.SDL = SDL

    this._eventStride = SDL.SDL_Event.size
    this._maxEventsPerFrame = 20
    this._offset = 0
    this._offsetLimit = 0

    this.buffer = Buffer.alloc(this._eventStride * this._maxEventsPerFrame)
  }

  captureEvents () {
    if (this._offset >= this._offsetLimit) {
      const {SDL_PumpEvents, SDL_PeepEvents} = this.SDL // eslint-disable-line

      SDL_PumpEvents()

      const eventCount = SDL_PeepEvents(
        this.buffer,
        this._maxEventsPerFrame,
        2 /* SDL.SDL_eventaction.SDL_GETEVENT */,
        0 /* SDL.SDL_EventType.SDL_FIRSTEVENT */,
        65535 /* SDL.SDL_EventType.SDL_LASTEVENT */)

      this._offset = 0
      this._offsetLimit = eventCount * this._eventStride
    }
  }

  next () {
    const offset = this._offset

    if (offset < this._offsetLimit) {
      this._offset += this._eventStride
      return offset
    }

    return -1
  }
}

function getAvailableDisplays (SDL) {
  const current = SDL.SDL_GetDesktopDisplayMode(0)
  const available = []
  const count = SDL.SDL_GetNumDisplayModes(0)

  if (count === 0) {
    throw Error('No available display modes!')
  }

  for (let i = 0; i < count; i++) {
    const mode = SDL.SDL_GetDisplayMode(0, i)

    if (current.refreshRate !== mode.refreshRate || current.format !== mode.format) {
      continue
    }

    available.push(mode)
  }

  return available
}

function findClosestDisplay (SDL, width, height) {
  const available = getAvailableDisplays(SDL)

  // pick an exact match; otherwise, choose the current display configuration
  // TODO: this can be improved to find a better fitting screen size
  for (const display of available) {
    if (width === display.width && height === display.height) {
      return display
    }
  }

  return SDL.SDL_GetDesktopDisplayMode(0)
}

function getRendererCaps (SDL) {
  const rendererInfo = SDL.SDL_GetRenderDriverInfo(0)
  const hasMask = (value, mask) => (value & mask) === mask

  return {
    textureFormats: rendererInfo.textureFormats,
    hasRenderToTexture: hasMask(rendererInfo.flags, SDL.SDL_RendererFlags.SDL_RENDERER_TARGETTEXTURE),
    hasVsync: hasMask(rendererInfo.flags, SDL.SDL_RendererFlags.SDL_RENDERER_PRESENTVSYNC),
    hasHardwareAcceleration: hasMask(rendererInfo.flags, SDL.SDL_RendererFlags.SDL_RENDERER_ACCELERATED)
  }
}

function chooseCompatibleTextureFormat (SDL, caps, screenPixelFormat, compatibleFormats) {
  let pixelFormat
  let textureFormat

  if (!caps.textureFormats.length) {
    throw new Error(`No available texture formats.`)
  }

  if (compatibleFormats.indexOf(screenPixelFormat) !== -1 && caps.textureFormats.indexOf(screenPixelFormat) !== -1) {
    pixelFormat = screenPixelFormat
  } else {
    for (const compatibleFormat of compatibleFormats) {
      if (caps.textureFormats.indexOf(compatibleFormat) !== -1) {
        pixelFormat = compatibleFormat
        break
      }
    }
  }

  switch (pixelFormat) {
    case SDL.SDL_PIXELFORMAT_ARGB8888:
      textureFormat = TextureFormat.ARGB
      break
    case SDL.SDL_PIXELFORMAT_RGBA8888:
      textureFormat = TextureFormat.RGBA
      break
    case SDL.SDL_PIXELFORMAT_ABGR8888:
      textureFormat = TextureFormat.ABGR
      break
    case SDL.SDL_PIXELFORMAT_BGRA8888:
      textureFormat = TextureFormat.BGRA
      break
    default:
      throw Error('No 32-bit texture format available.')
  }

  return { pixelFormat, textureFormat }
}
