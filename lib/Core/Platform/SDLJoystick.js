/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

export class SDLGameControllerInputDevice {
  constructor (SDL, index) {
    this.SDL = SDL

    if (index >= SDL.SDL_NumJoysticks()) {
      throw Error(`Index ${index} out of range.`)
    }

    // if (!SDL.SDL_IsGameController(index)) {
    //   const result = SDL.SDL_GameControllerAddMapping([
    //     SDL.SDL_JoystickGetDeviceGUID(index),
    //     SDL.SDL_JoystickNameForIndex(index),
    //     'platform:' + SDL.SDL_GetPlatform(),
    //     ','
    //   ].join(','))
    //
    //   if (!result) {
    //     throw Error(`Failed to add mapping for index: ${index}`)
    //   }
    // }
    //
    // this._controller = SDL.SDL_GameControllerOpen(index)
    //
    // if (!this._controller) {
    //   throw Error(`Failed to open game controller for index: ${index}`)
    // }

    // const joystick = this._joystick = SDL.SDL_GameControllerGetJoystick(this._controller)
    const joystick = this._joystick = SDL.SDL_JoystickOpen(index);

    this.id = SDL.SDL_JoystickInstanceID(joystick)
    this.name = SDL.SDL_JoystickName(joystick)
    this.axisCount = SDL.SDL_JoystickNumAxes(joystick)
    this.buttonCount = SDL.SDL_JoystickNumButtons(joystick)
    this.hatCount = SDL.SDL_JoystickNumHats(joystick)
    this.guid = SDL.SDL_JoystickGetGUID(joystick)

    this.isGamepad = true
    this.isKeyboard = false
  }

  destroy () {
    if (this._controller) {
      // this.SDL.SDL_GameControllerClose(this._controller)
      SDL.SDL_JoystickClose(this._joystick);
      this._controller = undefined
      this._joystick = undefined
    }
  }
}
