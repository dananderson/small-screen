/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import sinon from 'sinon'
import { TextureFormat } from '../../lib/Utilities/TextureFormat'

export class StubGraphicsDevice {
  createTexture () {}

  destroyTexture () {}

  static createStubInstance () {
    const graphicsDevice = sinon.createStubInstance(StubGraphicsDevice)

    graphicsDevice._renderer = {}
    graphicsDevice._renderer.textureFormat = TextureFormat.RGBA

    return graphicsDevice
  }
}
