/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

const UUID = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/

/**
 * Base class for input devices.
 */
export class InputDevice {
  /**
   * Creates a InputDevice object.
   *
   * @param {string} uuid UUID representing the classification of InputDevice.
   */
  constructor (uuid) {
    if (!UUID.test(uuid)) {
      throw Error('Invalid UUID: ' + uuid)
    }

    /**
     * Represents the classification of InputDevice in UUID format. This is used primarily for input mapping
     * and should not be considered unique ID, as multiple connected InputDevices may share the same classification.
     */
    Object.defineProperty(this, 'uuid', {
      value: uuid,
      writable: false
    })

    /**
     * Indicates whether this InputDevice is currently connected and broadcasting events.
     *
     * @type {boolean}
     */
    this.connected = true
  }

  /**
   * Indicates whether this InputDevice is a Gamepad.
   *
   * @return {boolean}
   */
  get isGamepad () {
    return false
  }

  /**
   * Indicates whether this InputDevice is a Keyboard.
   *
   * @return {boolean}
   */
  get isKeyboard () {
    return false
  }

  /**
   * Get the default Mapping for this device. If no Mapping is available, undefined is returned.
   *
   * @return {Mapping}
   */
  getDefaultMapping () {

  }

  _close () {
    this.connected = false
  }
}
