/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { application } from '..'
import { performance } from 'perf_hooks'
import { CurtainView } from '../Util/CurtainView'
import { clamp } from '../../Core/Util'

const { now } = performance

let isEnabled = false
let curtainView
let marker = 0
let timeoutMs = 15 * 60 * 1000
let dimPercent = 100

function fadeOut () {
  marker = application.input.lastActivity
  application.input.setEnabled(false)
  application.off('frame', checkInactivity)

  curtainView = new CurtainView({}, application)
  application.root.appendChild(curtainView)

  curtainView.show((dimPercent * 255 / 100) << 0, () => {
    application.stop()
    application.start(30)
    application.on('frame', checkActivity)
  })
}

function fadeIn () {
  application.stop()
  application.start()
  application.off('frame', checkActivity)

  curtainView.hide(() => {
    application.root.removeChild(curtainView)
    curtainView.destroy()
    curtainView = undefined
    application.input.setEnabled(true)
    application.on('frame', checkInactivity)
  })
}

function checkInactivity () {
  if (now() - application.input.lastActivity >= timeoutMs) {
    fadeOut()
  }
}

function checkActivity () {
  if (application.input.lastActivity > marker) {
    fadeIn()
  }
}

/**
 * Burn-In Protection triggers a screen saver when no user input activity occurs in a specified amount of time. The
 * screen saver is a dim or blackout of the screen. The user activity timeout, dim amount and enablement can be configured.
 */
export const BurnInProtection = {
  /**
   * Is burn-in protection enabled?
   *
   * @returns {boolean}
   */
  get enabled () {
    return isEnabled
  },

  /**
   * Enable or disable burn-in protection.
   *
   * When burn-in protection is enabled, if no user activity has occurred in a specified amount of time
   * (inactivityTimeoutMillis), the screen is dimmed or blacked out and the application goes into a low power mode. The
   * application returns to normal when user activity is detected. User activity includes keyboard key presses, gamepad
   * button presses or gamepads being added/removed from the system.
   *
   * @param {boolean} on New state of burn-in protection.
   */
  set enabled (on) {
    if (isEnabled === on) {
      return
    }

    if (curtainView) {
      throw Error('Cannot toggle BurnInProtection while dimming')
    }

    isEnabled = on

    if (on) {
      application.on('frame', checkInactivity)
    } else {
      application.off('frame', checkInactivity)
    }
  },

  /**
   * Get the timeout before the burn-in protection is triggered and the screen dims.
   *
   * The default value is 15 minutes.
   *
   * @returns {number}
   */
  get inactivityTimeoutMillis () {
    return timeoutMs
  },

  /**
   * Set the timeout before the burn-in protection is triggered and the screen dims.
   *
   * @param {number} value Timeout in milliseconds.
   * @throws Error If value is not an integer or value is less than 1 minute (60000ms).
   */
  set inactivityTimeoutMillis (value) {
    if (!Number.isInteger(value) || value < 60 * 1000) {
      throw Error(`Cannot set inactivityTimeoutMillis to '${value}'. Must use an integer greater than 1 minute (60000 milliseconds)`)
    }

    timeoutMs = value
  },

  /**
   * Get the screen dim percentage.
   *
   * @returns {number}
   */
  get dim () {
    return dimPercent
  },

  /**
   * Set the screen dim percentage.
   *
   * A dim percentage of 100 means the screen will fade to solid black when burn-in protection is triggered.
   *
   * @param {string|number} value A number between 0-100, inclusive. If using a string, values of '100' or '100%' are valid.
   * @throws Error If value cannot be parsed to a number or value is not in the range of [0-100].
   */
  set dim (value) {
    value = parseFloat(value)

    if (isNaN(value) || value < 0 || value > 100) {
      throw Error('dim value must be a value in the range of [0-100]')
    }

    dimPercent = clamp(value, 0, 100)
  }
}
