/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Application } from './Application'
import { AudioManager } from '../Audio/AudioManager'
import { InputManager } from '../Input/InputManager'
import { ResourceManager } from '../Resource/ResourceManager'
import os from "os"
import { AnimationManager } from '../Animated/AnimationManager'
import { factory } from '../Platform'

let instance

function getInstance() {
  if (!instance) {
    instance = new Application({
      audio: new AudioManager(this),
      input: new InputManager(),
      resource: new ResourceManager({
        resWorkerTimeLimitMs: 10,
        resWorkerRescheduleDelayMs: (1000 / 30) << 0,
        resImageThreadPoolSize: os.cpus().length,
        resImageConcurrency: 2,
      }),
      animation: new AnimationManager(),
      platform: factory,
    })
  }

  return instance
}

export {
  Application,
  getInstance
}