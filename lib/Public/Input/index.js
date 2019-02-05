/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { app, input } from '..'
import { InputManager } from '../../Core/Input/InputManager'

const emptyArray = Object.freeze([])

export class Input {
  /**
   * Events dispatched by the Input API.
   *
   * @type {{keydown, axismove, buttondown, buttonup, disconnected, keyup, connected}}
   */
  static Events = InputManager.Events

  /**
   * Add an event listener.
   *
   * @param {string} eventName The event name from Input#Events.
   * @param {function} listener The event callback.
   */
  static addEventListener (eventName, listener) {
    input().on(eventName, listener)
  }

  /**
   * Remove an event listener.
   *
   * @param {string} eventName The event name from Input#Events.
   * @param {function} listener The event callback.
   */
  static removeEventListener (eventName, listener) {
    input().off(eventName, listener)
  }

  /**
   * Enable or disable input event dispatch.
   *
   * Controls whether input events (keydown, axismove, buttondown, buttonup, keyup) will be dispatched to event
   * listens. In disabled mode, connected and disconnected events will be dispatched.
   *
   * @param {boolean} enabled Enablement flag
   */
  static setEnabled (enabled) {
    input().setEnabled(enabled)
  }

  /**
   * Indicates whether input event dispatch is enabled.
   *
   * @returns {boolean}
   */
  static isEnabled () {
    return input().isEnabled()
  }

  /**
   * Set key mapping for a classification of input devices.
   *
   * @param {string} deviceUUID UUID, from InputDevice#uuid, for the input device classification.
   * @param {Mapping|undefined} mapping The mapping object to apply. If undefined, mapping will be disabled for the
   * given UUID.
   */
  static setMapping (deviceUUID, mapping) {
    if (deviceUUID) {
      const mappings = input().mappings

      if (mapping) {
        mappings.set(deviceUUID, mapping)
      } else {
        mappings.delete(deviceUUID)
      }
    }
  }

  /**
   * Get key mapping for a classification of input devices.
   *
   * @param {string} deviceUUID UUID, from InputDevice#uuid, for the input device classification.
   * @returns {Mapping|undefined}
   */
  static getMapping (deviceUUID) {
    return input().mappings.get(deviceUUID)
  }

  /**
   * Get the system keyboard input device.
   *
   * @returns {Keyboard}
   */
  static getKeyboard () {
    return app().window.keyboard
  }

  /**
   * Get an array of connected Gamepads.
   *
   * The returned array has no specific order.
   *
   * Each Gamepad contains the current button and axis value states.
   *
   * @returns {Gamepad[]}
   */
  static getGamepads () {
    const { gamepadsById } = app().window

    return gamepadsById ? [ ...gamepadsById.values() ] : emptyArray
  }
}
