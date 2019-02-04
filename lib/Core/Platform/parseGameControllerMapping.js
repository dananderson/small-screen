/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { StandardKey } from '../Input/StandardKey'
import { Mapping } from '../Input/Mapping'
import { hatToButton } from './hatToButton'
import { toUUID } from './toUUID'
import { format } from 'util'
import { StandardMapping } from '../Input/StandardMapping'

const GC_TO_KEY = {
  a: StandardKey.A,
  b: StandardKey.B,
  x: StandardKey.X,
  y: StandardKey.Y,
  dpdown: StandardKey.DOWN,
  dpleft: StandardKey.LEFT,
  dpright: StandardKey.RIGHT,
  dpup: StandardKey.UP,
  leftshoulder: StandardKey.L1,
  leftstick: StandardKey.LS,
  lefttrigger: StandardKey.L2,
  leftx: StandardKey.LS_LEFT,
  lefty: StandardKey.LS_UP,
  rightshoulder: StandardKey.R1,
  rightstick: StandardKey.RS,
  righttrigger: StandardKey.R2,
  rightx: StandardKey.RS_LEFT,
  righty: StandardKey.RS_UP,
  start: StandardKey.START,
  guide: StandardKey.HOME,
  back: StandardKey.SELECT
}

const HAT_REGEX = /h([\d]+).([1248])/
const SIGNED_AXIS_REGEX = /([+-])a([\d]+)/
const AXIS_REGEX = /a([\d]+)(~)?/

const AXIS_NEGATIVE = Mapping.Axis.NEGATIVE
const AXIS_RANGE = Mapping.Axis.RANGE
const AXIS_POSITIVE = Mapping.Axis.POSITIVE

function flipAxisValue (value) {
  return value === AXIS_NEGATIVE ? AXIS_POSITIVE : AXIS_NEGATIVE
}

function getGameControllerMapping (gamepad) {
  let mapping

  try {
    mapping = gamepad._nativeGamepad.getGameControllerMapping()
  } catch (err) {
    // Ignore error. Assume this gamepad just does not have native mapping.
  }

  if (mapping) {
    const fields = mapping.split(',')

    // Sanity check that the first field is a GUID that matches the Gamepad UUID.
    const mappingGUID = fields.shift()

    if (toUUID(mappingGUID) === gamepad.uuid) {
      // Skip the name field
      fields.shift()

      return fields
    } else {
      throw Error(format('GameControllerMapping: Mapping GUID (%s) does not match Gamepad UUID (%s)', mappingGUID, gamepad.uuid))
    }
  }

  return undefined
}

function parseSignedAxis (gamepad, axis, key, mapping) {
  const match = axis.match(SIGNED_AXIS_REGEX)

  if (!match) {
    throw Error(format('GameControllerMapping: Cannot parse axis info: %s', axis))
  }

  const axisId = parseInt(match[2], 10)

  if (isNaN(axisId) || axisId < 0 || axisId >= gamepad.axes.length) {
    throw Error(format('GameControllerMapping: axis index (%s) out of range', axis))
  }

  const sign = match[1]

  mapping.push([ axisId, sign === '+' ? AXIS_POSITIVE : AXIS_NEGATIVE, key ])
}

function parseAxis (gamepad, axis, key, mapping) {
  const match = axis.match(AXIS_REGEX)

  if (!match) {
    throw Error(format('GameControllerMapping: Cannot parse axis info: %s', axis))
  }

  const axisId = parseInt(match[1], 10)

  if (isNaN(axisId) || axisId < 0 || axisId >= gamepad.axes.length) {
    throw Error(format('GameControllerMapping: axis index (%s) out of range', axis))
  }

  const axisValue = match[2] ? AXIS_POSITIVE : AXIS_NEGATIVE

  switch (key) {
    case StandardKey.LS_LEFT:
      mapping.push([ axisId, axisValue, StandardKey.LS_LEFT ])
      mapping.push([ axisId, flipAxisValue(axisValue), StandardKey.LS_RIGHT ])
      break
    case StandardKey.LS_UP:
      mapping.push([ axisId, axisValue, StandardKey.LS_UP ])
      mapping.push([ axisId, flipAxisValue(axisValue), StandardKey.LS_DOWN ])
      break
    case StandardKey.RS_LEFT:
      mapping.push([ axisId, axisValue, StandardKey.RS_LEFT ])
      mapping.push([ axisId, flipAxisValue(axisValue), StandardKey.RS_RIGHT ])
      break
    case StandardKey.RS_UP:
      mapping.push([ axisId, axisValue, StandardKey.RS_UP ])
      mapping.push([ axisId, flipAxisValue(axisValue), StandardKey.RS_DOWN ])
      break
    default:
      mapping.push([ axisId, AXIS_RANGE, key ])
      break
  }
}

function parseHat (gamepad, hat, key, mapping) {
  const match = hat.match(HAT_REGEX)

  if (!match) {
    throw Error(format('GameControllerMapping: Cannot parse hat info: %s', hat))
  }

  const hatIndex = parseInt(match[1], 10)
  const hatValue = parseInt(match[2], 16)

  if (isNaN(hatIndex) || hatIndex < 0 || hatIndex >= gamepad._hats.length) {
    throw Error(format('GameControllerMapping: hat index (%s) out of range', hat))
  }

  if (isNaN(hatValue)) {
    throw Error(format('GameControllerMapping: Cannot parse hat value: ', hat))
  }

  const buttonId = hatToButton(gamepad, hatIndex, hatValue)

  if (buttonId === -1) {
    throw Error(format('GameControllerMapping: Invalid hat value (%s)', hat))
  }

  mapping.push([ buttonId, key ])
}

function parseButton (gamepad, button, key, mapping) {
  const buttonId = parseInt(button.substr(1), 10)

  if (isNaN(buttonId) || buttonId < 0 || buttonId >= gamepad._physicalButtonCount) {
    throw Error(format('GameControllerMapping: buttonID (%s) out of range', button))
  }

  mapping.push([ buttonId, key ])
}

export function parseGameControllerMapping (gamepad) {
  const fields = getGameControllerMapping(gamepad)

  if (!fields) {
    return undefined
  }

  const mapping = []

  for (const field of fields) {
    const m = field.split(':')

    if (m.length !== 2) {
      continue
    }

    const name = m[0]
    const key = GC_TO_KEY[name]

    if (key === undefined) {
      continue
    }

    const value = m[1]

    switch (value.charAt(0)) {
      case 'b':
        parseButton(gamepad, value, key, mapping)
        break
      case 'h':
        parseHat(gamepad, value, key, mapping)
        break
      case 'a':
        parseAxis(gamepad, value, key, mapping)
        break
      case '+':
      case '-':
        parseSignedAxis(gamepad, value, key, mapping)
        break
      default:
        throw Error(format('GameControllerMapping: Unexpected value format %s', field))
    }
  }

  return new StandardMapping(mapping)
}
