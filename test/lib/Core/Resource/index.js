/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import sinon from 'sinon'

class Graphics {
  createTexture () {}
  destroyTexture () {}
}

export function createGraphics () {
  const graphics = sinon.createStubInstance(Graphics)

  graphics._renderer = {}
  graphics.textureFormat = 0 // TextureFormat.RGBA

  return graphics
}

class Audio {
  createAudioSample () {}
  destroyAudioSample () {}
}

export function createAudio () {
  return sinon.createStubInstance(Audio)
}
