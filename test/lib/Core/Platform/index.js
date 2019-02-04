/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import sinon from 'sinon'

export function createNativeGamepad () {
  const stub = sinon.createStubInstance(class {
    getId () {}
    getGUID () {}
    getName () {}
    getButtonCount () {}
    getHatCount () {}
    getAxisCount () {}
    getGameControllerMapping () {}
    close () {}
  })

  stub.getId.returns(0)
  stub.getGUID.returns(''.padEnd(32, '1'))
  stub.getName.returns('gamepad')
  stub.getButtonCount.returns(10)
  stub.getHatCount.returns(1)
  stub.getAxisCount.returns(1)

  return stub
}
