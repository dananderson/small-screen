/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { app } from '..'
import { performance } from 'perf_hooks'
import { CurtainView } from '../Util/CurtainView'

const { now } = performance
const DEFAULT_INACTIVITY_TIMEOUT = 15 * 60
const DEFAULT_BLACKOUT_PERCENTAGE = 100

let isEnabled = false
let curtainView
let marker = 0
let inactivityTimeout = DEFAULT_INACTIVITY_TIMEOUT
let blackoutOpacity = DEFAULT_BLACKOUT_PERCENTAGE

function fadeOut (application) {
  marker = application.input.lastActivity
  application.input.setEnabled(false)
  application.off('frame', checkInactivity)

  curtainView = new CurtainView({ opacity: (blackoutOpacity * 255 / 100) << 0 }, application)
  application.root.appendChild(curtainView)

  curtainView.show(() => {
    application.stop()
    application.start(30)
    application.on('frame', checkActivity)
  })
}

function fadeIn (application) {
  application.stop()
  application.start()
  application.off('frame', checkActivity)

  curtainView.hide(() => {
    application.root.removeChild(curtainView)
    curtainView.destroy()
    application.input.setEnabled(true)
    application.on('frame', checkInactivity)
  })
}

function checkInactivity () {
  const application = app()

  if (now() - application.input.lastActivity >= inactivityTimeout * 1000) {
    fadeOut(application)
  }
}

function checkActivity () {
  const application = app()

  if (application.input.lastActivity > marker) {
    fadeIn(application)
  }
}

/**
 * Burn-In Protection triggers a screen saver when no user input activity occurs in a specified amount of time. The
 * screen saver is a dim or blackout of the screen. The user activity timeout, dim amount and enablement can be configured.
 */
export class BurnInProtection {
  /**
   * Indicates whether screen burn-in protection is enabled.
   *
   * @returns {boolean}
   */
  static isEnabled () {
    return isEnabled
  }

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
  static setEnabled (on) {
    if (isEnabled === on) {
      return
    }

    if (curtainView) {
      throw Error('Cannot toggle BurnInProtection while dimming')
    }

    isEnabled = on

    if (on) {
      app().on('frame', checkInactivity)
    } else {
      app().off('frame', checkInactivity)
    }
  }

  /**
   * Get the timeout before the burn-in protection is triggered and the screen dims.
   *
   * The default value is 900 seconds (15 minutes).
   *
   * @returns {number}
   */
  static getInactivityTimeout () {
    return inactivityTimeout
  }

  /**
   * Set the timeout before the burn-in protection is triggered and the screen dims.
   *
   * @param {number} seconds Timeout in seconds.
   * @throws Error If value is not an integer or value is less than 60 seconds.
   */
  static setInactivityTimeout (seconds = DEFAULT_INACTIVITY_TIMEOUT) {
    if (!Number.isInteger(seconds) || seconds < 1) {
      throw Error(`Invalid inactivity timeout = '${seconds}'. Must be an integer of 60 seconds or greater.`)
    }

    inactivityTimeout = seconds
  }

  /**
   * Get the screen blackout opacity.
   *
   * @returns {number}
   */
  static getBlackoutOpacity () {
    return blackoutOpacity
  }

  /**
   * Set the screen blackout opacity.
   *
   * An opacity percentage of 100 means the screen will fade to solid black when burn-in protection is triggered.
   *
   * @param {string|number} opacity A number between 0-100, inclusive. If using a string, values of '100' or '100%' are valid.
   * @throws Error If value cannot be parsed to a number or value is not in the range of [0-100].
   */
  static setBlackoutOpacity (opacity = DEFAULT_BLACKOUT_PERCENTAGE) {
    opacity = parseFloat(opacity)

    if (isNaN(opacity) || opacity < 0 || opacity > 100) {
      throw Error('dim value must be a value in the range of [0-100]')
    }

    blackoutOpacity = opacity
  }
}
