/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SmallScreenError } from '../Util/SmallScreenError'
import { SDLRenderingContext } from './SDLRenderingContext'
import { TextureFormat } from '../Util/TextureFormat'
import { Key } from '../Input/Key'

const MAX_EVENTS = 20

export class SDLGraphicsContainer {
  constructor (SDL, options) {
    this._options = options
    this._SDL = SDL
    this.onQuit = () => {}

    if ((SDL.SDL_WasInit(SDL.SDL_INIT_VIDEO) & SDL.SDL_INIT_VIDEO) === 0) {
      if (SDL.SDL_InitSubSystem(SDL.SDL_INIT_VIDEO) !== 0) {
        throw Error()
      }
    }

    const mode = SDL.SDL_GetDesktopDisplayMode(0)

    if (!mode) {
      throw Error()
    }

    // TODO: consider viewport
    this.width = mode.width
    this.height = mode.height
    this.fullscreen = true
    this.vsync = true
    this.title = "Small Screen Application"

    this._context = new SDLRenderingContext(SDL)

    this._rAxis = []
    this._mAxis = []

    this._eventStride = this._SDL.SDL_Event.size
    this._eventBuffer = Buffer.alloc(this._eventStride * MAX_EVENTS)
  }

  setTitle(title) {
    this.title = title

    if (this._window) {
      this._SDL.SDL_SetWindowTitle(this.title || "")
    }
  }

  getTitle() {
    return this.title
  }

  configure({width, height, fullscreen}) {
    if (this.isAttached()) {
      throw new SmallScreenError('Cannot configure a running application.')
    }

    // TODO: this may not be correct .. sdl might choose a different size

    this.width = width
    this.height = height
    this.fullscreen = fullscreen

    // TODO: attach now option?
  }

  isAttached() {
    return !!this._renderer
  }

  attach() {
    const SDL = this._SDL

    if ((SDL.SDL_WasInit(SDL.SDL_INIT_VIDEO) & SDL.SDL_INIT_VIDEO) === 0) {
      if (SDL.SDL_InitSubSystem(SDL.SDL_INIT_VIDEO) !== 0) {
        throw new SmallScreenError(`SDL_InitSubSystem(SDL_INIT_VIDEO): ${SDL.SDL_GetError()}`)
      }
    }

    try {
      // TODO: set title
      this._window = createWindow(SDL, this.title, this.width, this.height, this.fullscreen)
    } catch (e) {
      throw new SmallScreenError('Failed to create window.', e)
    }

    // TODO: error checking? is this too late?
    this._sdlTextureFormat = getRendererCaps(SDL, SDL.SDL_GetWindowPixelFormat(this._window)).textureFormat

    switch (this._sdlTextureFormat) {
      case SDL.SDL_PIXELFORMAT_ARGB8888:
        this.textureFormat = TextureFormat.ARGB
        break
      case SDL.SDL_PIXELFORMAT_RGBA8888:
        this.textureFormat = TextureFormat.RGBA
        break
      case SDL.SDL_PIXELFORMAT_ABGR8888:
        this.textureFormat = TextureFormat.ABGR
        break
      case SDL.SDL_PIXELFORMAT_BGRA8888:
        this.textureFormat = TextureFormat.BGRA
        break
      default:
        throw Error('No 32-bit texture format available.')
    }

    try {
      this._renderer = createRenderer(SDL, this._window, this.vsync)
    } catch (e) {
      this.detach()
      throw new SmallScreenError('Failed to create renderer.', e)
    }

    // TODO: configure logical size

    try {
      const { width, height } = this._SDL.SDL_GetRendererOutputSize(this._renderer)

      this.width = width
      this.height = height

      console.log(`app size: ${this.width}, ${this.height}`)
      console.log(`renderer size: ${width}, ${height}`)
    } catch (e) {
      this.detach()
      throw new SmallScreenError('Failed to query renderer.', e)
    }

    // TODO: just use constructor
    this._context._reset(this._renderer)
  }

  detach() {
    const SDL = this._SDL

    this._renderer && SDL.SDL_DestroyRenderer(this._renderer)
    this._renderer = undefined

    this._window && SDL.SDL_DestroyWindow(this._window)
    this._window = undefined
  }

  createRenderingContext () {
    const context = this._context
    context._prepare()
    return context
  }

  present() {
    this._SDL.SDL_RenderPresent(this._renderer)
  }

  processEvents() {
    const input = this._options.input

    const buffer = this._eventBuffer
    const {SDL_PumpEvents, SDL_PeepEvents} = this._SDL // eslint-disable-line

    SDL_PumpEvents()

    const eventCount = SDL_PeepEvents(
      buffer,
      MAX_EVENTS,
      2 /* SDL.SDL_eventaction.SDL_GETEVENT */,
      0 /* SDL.SDL_EventType.SDL_FIRSTEVENT */,
      65535 /* SDL.SDL_EventType.SDL_LASTEVENT */)

    const stride = this._eventStride
    const offsetLimit = eventCount * stride
    let offset = 0

    while (offset < offsetLimit) {
      switch (buffer.readInt32(0 /* EVENT_TYPE_OFFSET */ + offset)) {
        case 256: // SDL_QUIT:
          this.onQuit()
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

      offset += stride
    }
  }

  createTexture (image) {
    return this._SDL.createTexture(
      this._renderer,
      image.width,
      image.height,
      this._sdlTextureFormat,
      image.buffer)
  }

  destroyTexture (texturePtr) {
    texturePtr && this._SDL.destroyTexture(texturePtr)
  }
}



function createWindow(SDL, title, width, height, fullscreen) {
  let windowFlags
  let x
  let y

  if (fullscreen) {
    SDL.SDL_ShowCursor(0)
    x = y = SDL.SDL_WINDOWPOS_UNDEFINED
    windowFlags = SDL.SDL_WindowFlags.SDL_WINDOW_OPENGL | SDL.SDL_WindowFlags.SDL_WINDOW_FULLSCREEN
  } else {
    x = y = SDL.SDL_WINDOWPOS_CENTERED
    windowFlags = SDL.SDL_WindowFlags.SDL_WINDOW_OPENGL
  }

  const window = SDL.SDL_CreateWindow(title, x, y, width, height, windowFlags)

  if (!window) {
    throw new SmallScreenError(`SDL_CreateWindow: ${SDL.SDL_GetError()}`)
  }

  return window
}

function createRenderer(SDL, window, vsync) {
  let flags = SDL.SDL_RendererFlags.SDL_RENDERER_TARGETTEXTURE |
    SDL.SDL_RendererFlags.SDL_RENDERER_ACCELERATED

  if (vsync) {
    flags |= SDL.SDL_RendererFlags.SDL_RENDERER_PRESENTVSYNC
  }

  const renderer = SDL.SDL_CreateRenderer(window, 0, flags)

  if (!renderer) {
    throw new SmallScreenError(`SDL_CreateRenderer: ${SDL.SDL_GetError()}`)
  }

  return renderer
}

function getRendererCaps (SDL, currentPixelFormat) {
  const rendererInfo = SDL.SDL_GetRenderDriverInfo(0)

  if (!rendererInfo.textureFormats.length) {
    throw new Error(`Renderer '${rendererInfo.name}' has no available texture formats.`)
  }

  const DESIRED_FORMATS = [
    SDL.SDL_PIXELFORMAT_ARGB8888,
    SDL.SDL_PIXELFORMAT_RGBA8888,
    SDL.SDL_PIXELFORMAT_ABGR8888,
    SDL.SDL_PIXELFORMAT_BGRA8888
  ]

  const textureFormats = rendererInfo.textureFormats

  let textureFormat

  if (DESIRED_FORMATS.indexOf(currentPixelFormat) !== -1 && textureFormats.indexOf(currentPixelFormat) !== -1) {
    textureFormat = currentPixelFormat
  } else {
    for (let i = 0; i < DESIRED_FORMATS.length; i++) {
      if (textureFormats.indexOf(DESIRED_FORMATS[i]) !== -1) {
        textureFormat = DESIRED_FORMATS[i]
        break
      }
    }
  }

  const hasMask = (value, mask) => (value & mask) === mask
  const hasRenderToTexture = hasMask(rendererInfo.flags, SDL.SDL_RendererFlags.SDL_RENDERER_TARGETTEXTURE)
  const hasVsync = hasMask(rendererInfo.flags, SDL.SDL_RendererFlags.SDL_RENDERER_PRESENTVSYNC)
  const hasHardwareAcceleration = hasMask(rendererInfo.flags, SDL.SDL_RendererFlags.SDL_RENDERER_ACCELERATED)

  return { textureFormat, hasRenderToTexture, hasVsync, hasHardwareAcceleration }
}