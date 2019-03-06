/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { SDLPlatform } from '../Core/Platform'
import { Application } from '../Core/Application'

let application
let applicationHolder

function createApplication () {
  const platform = new SDLPlatform();

  ['SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach(e => {
    process.on(e, (obj) => {
      obj.message && console.log(obj.message)
      obj.stack && console.log(obj.stack)
      process.exit()
    })
  })

  process.on('exit', () => {
    platform && platform.detach()
  })

  console.log('Graphics available: %j', !!platform.capabilities.hasGraphics)
  console.log('Gamepad available: %j', !!platform.capabilities.hasGamepad)
  console.log('Audio available: %j', !!platform.capabilities.hasAudio)

  return new Application({ platform })
}

export function app () {
  return application
}

export function animation () {
  return application.animation
}

export function audio () {
  return application.audio
}

export function input () {
  return application.input
}

export function resource () {
  return application.resource
}

export function window () {
  return application.window
}

export function testSetApplication (mockApp) {
  if (mockApp === undefined) {
    if (applicationHolder) {
      application = applicationHolder
      applicationHolder = undefined
    }
  } else {
    if (applicationHolder) {
      throw Error('Mock application has already been set!')
    }
    applicationHolder = application
    application = mockApp
  }
}

application = createApplication()
