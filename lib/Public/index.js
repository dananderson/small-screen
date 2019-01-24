/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { addFont, addImage } from './Resource'
import { abortController } from '../Core/Util'
import { createAudioDriver, createWindow, shutdown } from '../Core/Platform'
import os from 'os'
import { setThreadPoolSize } from '../Core/Util/small-screen-lib'
import { Image } from '../Core/Resource/Image'
import { AudioManager } from '../Core/Audio/AudioManager'
import { InputManager } from '../Core/Input/InputManager'
import { ResourceManager } from '../Core/Resource/ResourceManager'
import { AnimationManager } from '../Core/Animated/AnimationManager'
import { Application } from '../Core/Application'

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

  Object.getOwnPropertyNames(Buffer.prototype)
    .filter(name => name.endsWith(os.endianness()))
    .forEach(name => {
      Buffer.prototype[name.slice(0, -2)] = Buffer.prototype[name]
    })

  setThreadPoolSize(os.cpus().length)
  Image.concurrency = 2

  let window

  try {
    window = createWindow()
  } catch (err) {
    console.log(err)
    // TODO: create a stub window class
    window = {}
  }

  let audioDriver

  try {
    audioDriver = createAudioDriver()
  } catch (err) {
    console.log(err)
    // TODO: create a stub audio driver class
    audioDriver = {}
  }

  const audio = new AudioManager(audioDriver)
  const input = new InputManager(window)
  const resource = new ResourceManager({ graphics: window, audio: audioDriver })
  const animation = new AnimationManager()

  return new Application({ window, audio, input, resource, animation })
}

export const application = createApplication()

export function main ({ width, height, fullscreen, title, resourcePath, images, fonts, app, start }) {
  if (resourcePath) {
    application.resource.path = resourcePath
  }

  if (Array.isArray(images)) {
    addImage(images)
  }

  if (Array.isArray(fonts)) {
    addFont(fonts)
  }

  if (title) {
    application.title = title
  }

  application.resize(width, height, fullscreen)
  application.render(app)

  if (start) {
    application.start()
  }
}
