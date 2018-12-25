/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { TextureFormat } from '../Utilities/TextureFormat'
import { SDLRenderingContext } from './SDLRenderingContext'

export class SDLGraphicsDevice {
  constructor (SDL, window, vsync) {
    this.SDL = SDL
    this.ref = null
    this.window = window
    this._caps = checkCaps(getRendererCaps(SDL, SDL.SDL_GetWindowPixelFormat(window.ref)), vsync)
    this._rendererFlags = SDL.SDL_RendererFlags.SDL_RENDERER_TARGETTEXTURE |
      SDL.SDL_RendererFlags.SDL_RENDERER_ACCELERATED

    if (vsync) {
      this._rendererFlags |= SDL.SDL_RendererFlags.SDL_RENDERER_PRESENTVSYNC
    }

    switch (this._caps.textureFormat) {
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

    this.graphics = new SDLRenderingContext(SDL)

    this.enable()
  }

  get isEnabled () {
    return !!this.ref
  }

  enable () {
    if (this.isEnabled) {
      return
    }

    const {SDL_CreateRenderer, SDL_RenderSetLogicalSize} = this.SDL // eslint-disable-line

    this.ref = SDL_CreateRenderer(this.window.ref, 0, this._rendererFlags)

    if (!this.ref) {
      throw Error('Failed to create renderer.')
    }

    if (this.window.width !== this.window.screenWidth && this.window.height !== this.window.screenHeight) {
      SDL_RenderSetLogicalSize(this.ref, this.window.width, this.window.height)
      // SDL_RenderSetIntegerScale(this.ref, this.SDL.SDL_TRUE)
    }

    this.graphics._reset(this.ref)
  }

  disable (clearScreen = false) {
    if (this.ref) {
      if (clearScreen) {
        // TODO: re-enable
        // const {SDL_RenderClear, SDL_RenderPresent, SDL_SetRenderTarget} = this.SDL // eslint-disable-line
        //
        // SDL_SetRenderTarget(this.ref, null)
        // SDL_RenderClear(this.ref)
        // SDL_RenderPresent(this.ref)
      }

      this.SDL.SDL_DestroyRenderer(this.ref)
    }

    this.ref = null
  }

  prepare () {
    this.graphics._prepare()
  }

  present () {
    this.SDL.SDL_RenderPresent(this.ref)
  }

  destroy () {
    this.disable()
    this.window = null
    this.SDL = null
  }

  createTexture (image) {
    return this.SDL.createTexture(
      this.ref,
      image.width,
      image.height,
      this._caps.textureFormat,
      image.buffer)
  }

  destroyTexture (texturePtr) {
    texturePtr && this.SDL.destroyTexture(texturePtr)
  }
}

function getRendererInfo (SDL) {
  return SDL.SDL_GetRenderDriverInfo(0)
}

function getRendererCaps (SDL, currentPixelFormat) {
  const rendererInfo = getRendererInfo(SDL)

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

function checkCaps (caps, vsync) {
  if (!caps.hasHardwareAcceleration) {
    throw Error('No hardware acceleration available.')
  }

  if (!caps.hasRenderToTexture) {
    throw Error('No render to texture available.')
  }

  if (!caps.textureFormat) {
    throw Error('No 32 bit texture format available.')
  }

  if (vsync && !caps.hasVsync) {
    throw Error('No vsync available.')
  }

  return caps
}
