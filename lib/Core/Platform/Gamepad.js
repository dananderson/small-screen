/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { parseGameControllerMapping } from './parseGameControllerMapping'
import { toUUID } from './toUUID'
import { InputDevice } from './InputDevice'

/**
 * Gamepad input device.
 */
export class Gamepad extends InputDevice {
  /**
   * Construct a Gamepad object.
   *
   * @param nativeGamepad Native gamepad.
   */
  constructor (nativeGamepad) {
    super(toUUID(nativeGamepad.getGUID()))

    const hatCount = nativeGamepad.getHatCount()
    const buttonCount = nativeGamepad.getButtonCount()
    const axisCount = nativeGamepad.getAxisCount()

    /**
     * Integer identifier for this Gamepad. This identifier is unique among connected Gamepads; however, if the Gamepad
     * is disconnected and reconnected, the same id number may not be assigned.
     *
     * @type {number}
     */
    this.id = nativeGamepad.getId()

    /**
     * System name for this Gamepad.
     *
     * @type {string}
     */
    this.name = nativeGamepad.getName()

    /**
     * Snapshot of button state.
     *
     * @type {Uint8Array}
     */
    this.buttons = new Uint8Array(buttonCount + hatCount)

    /**
     * Snapshot of axis values.
     *
     * @type {Float64Array}
     */
    this.axes = new Float64Array(axisCount)

    this._nativeGamepad = nativeGamepad

    // Hats, which are just direction pad representations on some controllers, are exposed to the upper layers as
    // buttons to simplify app land. However, the actual button could and hat state need to be tracked internally to
    // properly dispatch events.

    this._physicalButtonCount = buttonCount
    this._hats = new Uint8Array(hatCount)
  }

  /**
   * Get the default Mapping, in standard mapping format, for this Gamepad. If system mapping information is not
   * available for this classification (via uuid) of Gamepad, then undefined is returned.
   *
   * @return {Mapping}
   */
  getDefaultMapping () {
    try {
      return parseGameControllerMapping(this)
    } catch (err) {
      console.log(err.message)
    }
  }

  get isGamepad () {
    return true
  }

  _close () {
    this._nativeGamepad && this._nativeGamepad.close()
    this._nativeGamepad = undefined
    super._close()
  }
}
