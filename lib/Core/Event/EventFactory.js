/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Event } from './Event'

// Perf: To reduce object churn in event processing, the exported event objects are created once and reused.
//       Event listeners must not modify or hold these objects.

const gCloseRequestEvent = new Event(Event.CLOSE_REQUEST)
const gClosingRequestEvent = new Event(Event.CLOSING)
const gKeyUp = new Event(Event.KEY_UP)
const gKeyDown = new Event(Event.KEY_DOWN)
const gRawKeyboard = new Event(Event.RAW_KEYBOARD)
const gRawJoystick = new Event(Event.RAW_JOYSTICK)
const gGamepadConnected = new Event(Event.GAMEPAD_CONNECTED)
const gGamepadDisconnected = new Event(Event.GAMEPAD_DISCONNECTED)

export function createClosingEvent () {
  return gClosingRequestEvent
}

export function createCloseRequestEvent () {
  return gCloseRequestEvent
}

function createKeyEvent (event, key) {
  event.key = key
  event._stopPropagationRequested = false
  return event
}

export function createKeyUpEvent (key) {
  return createKeyEvent(gKeyUp, key)
}

export function createKeyDownEvent (key) {
  return createKeyEvent(gKeyDown, key)
}

// TODO: Is this in use?
//
// function createGamepadButtonEvent (event, button, gamepadIndex) {
//   event.button = button
//   event.gamepadIndex = gamepadIndex
//   event._stopPropagationRequested = false
//
//   return event
// }
//
// export function createGamepadKeyUpEvent (button, gamepadIndex) {
//   return createGamepadButtonEvent(gGamepadButtonUp, button, gamepadIndex)
// }
//
// export function createGamepadKeyDownEvent (button, gamepadIndex) {
//   return createGamepadButtonEvent(gGamepadButtonDown, button, gamepadIndex)
// }

export function createRawKeyboardEvent (keyCode) {
  gRawKeyboard.keyCode = keyCode
  gRawKeyboard._stopPropagationRequested = false
  return gRawKeyboard
}

export function createRawJoystickAxis (id, axis, value) {
  gRawJoystick.id = id
  gRawJoystick.type = 'axis'
  gRawJoystick.axis = axis
  gRawJoystick.value = value
  gRawJoystick._stopPropagationRequested = false

  return gRawJoystick
}

export function createRawJoystickHat (id, hat, value) {
  gRawJoystick.id = id
  gRawJoystick.type = 'hat'
  gRawJoystick.hat = hat
  gRawJoystick.value = value
  gRawJoystick._stopPropagationRequested = false

  return gRawJoystick
}

export function createRawJoystickButton (id, button, value) {
  gRawJoystick.id = id
  gRawJoystick.type = 'button'
  gRawJoystick.button = button
  gRawJoystick._stopPropagationRequested = false

  return gRawJoystick
}

function createGamepadConnectionEvent (event, index, state) {
  event.index = index
  event.state = state
  event._stopPropagationRequested = false

  return event
}

export function createGamepadConnectedEvent (index, state) {
  return createGamepadConnectionEvent(gGamepadConnected, index, state)
}

export function createGamepadDisconnectedEvent (index) {
  return createGamepadConnectionEvent(gGamepadDisconnected, index)
}
