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

  ['SIGINT', 'SIGUSR1', 'SIGUSR2'].forEach(e => {
    process.on(e, () => {
      process.exit()
    })
  });

  ['uncaughtException', 'unhandledRejection'].forEach(e => {
    process.on(e, obj => {
      obj.message && console.log(obj.message)
      obj.stack && console.log(obj.stack)
      process.exit()
    })
  })

  process.on('exit', () => {
    // TODO: Build server seg faults around this area when the tests finish. Might be due to SDL or SDL mixer not
    //       having a proper environment..

    // joinThreadPool()
    // platform && platform.detach()

    // When launching node from IntelliJ and the project includes native code, node
    // intermittently crashes (various methods in the v8 garbage collector). I have not tracked
    // down the root cause, but invoking the gc seems to work around the issue.
    global.gc && global.gc()
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
