/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { abortController } from '../Core/Util'
import { createAudioContext, createWindow, shutdown } from '../Core/Platform'
import { InputManager } from '../Core/Input/InputManager'
import { ResourceManager } from '../Core/Resource/ResourceManager'
import { AnimationManager } from '../Core/Animated/AnimationManager'
import { Application } from '../Core/Application'

let application
let applicationHolder

function createApplication () {
  ['SIGINT', 'SIGUSR1', 'SIGUSR2', 'uncaughtException'].forEach(e => {
    process.on(e, (obj) => {
      obj.message && console.log(obj.message)
      obj.stack && console.log(obj.stack)
      global.gc && global.gc()
      process.exit()
    })
  })

  process.on('exit', () => {
    // TODO: catch exceptions?
    abortController.abort()
    application && application.destroy()
    shutdown()
    global.gc && global.gc()
  })

  let window

  try {
    window = createWindow()
  } catch (err) {
    console.log(err)
    // TODO: create a stub window class
    window = {}
  }

  let audio

  try {
    audio = createAudioContext()
  } catch (err) {
    console.log(err)
    // TODO: create a stub audio driver class
    audio = {}
  }

  const input = new InputManager(window)
  const resource = new ResourceManager({ graphics: window, audio })
  const animation = new AnimationManager()

  window.inputReceiver = input

  return new Application({ window, audio, input, resource, animation })
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
