/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

/**
 * Maps raw input buttons and axes to a common mapped key format.
 */
export class Mapping {
  /**
   * Raw input types.
   *
   * @type {{BUTTON: number, AXIS: number}}
   */
  static Type = {
    BUTTON: 1,
    AXIS: 2
  }

  /**
   * Indicates how to translate axis state to a mapped key's up and down state. One of these enumeration must be
   * used as the axis 'value' when mapping an axis.
   *
   * @type {{NEGATIVE: number, RANGE: number, POSITIVE: number}}
   */
  static Axis = {
    // 0 is up, -1 is down
    NEGATIVE: -1,
    // -1 is up, 1 is down
    RANGE: 0,
    // 0 is up, 1 is down
    POSITIVE: 1
  }

  /**
   * Creates a Mapping object.
   *
   * entries follows a similar array structure as Map. Examples:
   *
   * - [[ raw_button1, key1 ], [ raw_axis2, Mapping.Axis.POSITIVE, key2 ]]
   * - [[ Mapping.Type.BUTTON, 0, raw_button1, key1 ], [ Mapping.Type.AXIS, raw_axis2, Mapping.Axis.POSITIVE, key2 ]]
   *
   * @param name Mapping name.
   * @param {array[]|undefined} entries Array of mappings.
   */
  constructor (name, entries) {
    if (!name || typeof name !== 'string') {
      throw Error('Mapping: name must be a string')
    }

    if (entries && !Array.isArray(entries)) {
      throw Error('Mapping: entries must be an array')
    }

    let type
    let axis
    let value
    let key
    let combinedKey

    /**
     * Mapping name.
     *
     * @property {string}
     * @name Mapping#name
     */
    Object.defineProperty(this, 'name', {
      value: name,
      writable: false
    })

    this._map = new Map()
    this._axes = new Set()

    if (!entries) {
      return
    }

    for (const entry of entries) {
      if (!Array.isArray(entry)) {
        throw Error('Mapping: Found an entry that is not an array')
      }

      switch (entry.length) {
        case 2:
          type = Mapping.Type.BUTTON
          axis = 0
          value = entry[0]
          key = entry[1]
          break
        case 3:
          type = Mapping.Type.AXIS
          axis = entry[0]
          value = entry[1]
          key = entry[2]
          break
        case 4:
          type = entry[0]
          axis = entry[1]
          value = entry[2]
          key = entry[3]
          break
        default:
          throw Error('Mapping: Found an entry of an invalid length')
      }

      if (type !== Mapping.Type.BUTTON && type !== Mapping.Type.AXIS) {
        throw Error('Mapping: Entry has invalid type')
      }

      combinedKey = (type << 24) | ((axis & 0xFF) << 16) | (value & 0xFFFF)

      if (this._map.has(combinedKey)) {
        throw Error('Mapping: Button or axis already mapped to another key')
      }

      if (type === Mapping.Type.AXIS) {
        if (value !== Mapping.Axis.NEGATIVE && value !== Mapping.Axis.POSITIVE && value !== Mapping.Axis.RANGE) {
          throw Error('Mapping: Invalid axis hint')
        }
        // TODO: illegal for an AXIS_RANGE and AXIS_NEGATIVE/AXIS_POSITIVE to exist in the mapping.
      }

      this._map.set(combinedKey, key)

      if (type === Mapping.Type.AXIS) {
        this._axes.add(axis)
      }
    }
  }

  /**
   * Get a mapped key value for the given raw input info.
   *
   * @param {number} type Raw input type. Type#BUTTON or Type#AXIS.
   * @param {number} axis The raw axis index. If Type#BUTTON, use 0.
   * @param {number} value If Type#AXIS, use Axis enumeration. If Type#BUTTON, this the raw button ID.
   * @return {number|undefined} The mapped key value or undefined if no mapped key exists for the given raw input information
   */
  getKey (type, axis, value) {
    return this._map.get((type << 24) | ((axis & 0xFF) << 16) | (value & 0xFFFF))
  }

  /**
   * Get a mapped key value for the given raw input button.
   *
   * @param {number} button The raw button ID.
   * @return {number|undefined} The mapped key value or undefined if no mapped key exists for the give button ID.
   */
  getKeyForButton (button) {
    return this._map.get(BUTTON_MASK | (button & 0xFFFF))
  }

  /**
   * Get a mapped key value for the given raw axis index.
   *
   * @param {number} axis The raw axis index.
   * @param {number} value An Axis enumeration value.
   * @return {number|undefined} The mapped key value or undefined if no mapped key exists for the give axis index.
   */
  getKeyForAxis (axis, value) {
    return this._map.get(AXIS_MASK | ((axis & 0xFF) << 16) | (value & 0xFFFF))
  }

  /**
   * Checks if an axis index has been mapped.
   *
   * @param {number} axis The raw axis index.
   * @return {boolean} true, if the axis has a mapped key value; otherwise, false
   */
  hasAxis (axis) {
    return this._axes.has(axis)
  }
}

let BUTTON_MASK = Mapping.Type.BUTTON << 24
let AXIS_MASK = Mapping.Type.AXIS << 24
