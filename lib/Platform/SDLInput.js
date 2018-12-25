/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SDLGameControllerInputDevice } from './SDLGameControllerInputDevice'
import { SDLKeyboardInputDevice } from './SDLKeyboardInputDevice'

export class SDLInput {
  constructor (SDL, options) {
    const { gameControllerDbFile } = options

    this.SDL = SDL
    this._controllers = []

    if (SDL.SDL_InitSubSystem(SDL.SDL_INIT_GAMECONTROLLER)) {
      throw Error(`Error initializing SDL Game Controller: ${SDL.SDL_GetError()}`)
    }

    if (gameControllerDbFile) {
      SDL.SDL_GameControllerAddMappingsFromFile(gameControllerDbFile)
    }

    this.keyboard = new SDLKeyboardInputDevice(SDL)

    // for (let i = 0; i < SDL.SDL_NumJoysticks(); i++) {
    //   try {
    //     const controller = new SDLGameControllerInputDevice(SDL, i)
    //
    //     this._controllers[controller.id] = controller
    //   } catch (err) {
    //     console.log(err.message)
    //   }
    // }
  }

  addInputDevice (index) {
    let controller

    try {
      controller = new SDLGameControllerInputDevice(this.SDL, index)
    } catch (err) {
      console.log(err.message)
      return undefined
    }

    this._controllers[controller.id] = controller

    return controller
  }

  removeInputDevice (id) {
    for (let i = 0; i < this._controllers.length; i++) {
      const controller = this._controllers[i]

      if (controller && controller.id === id) {
        controller.destroy()
        this._controllers[i] = undefined
        break
      }
    }
  }

  devices () {
    const devices = [this.keyboard]

    this._controllers.forEach(device => device && devices.push(device))

    return devices
  }

  processEvents () {

  }

  destroy () {
    this._controllers && this.devices().forEach(device => device.destroy())
    this._controllers = undefined
  }
}
