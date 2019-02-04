/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { createNativeGamepad } from './index'
import { Gamepad } from '../../../../lib/Core/Platform/Gamepad'
import { parseGameControllerMapping } from '../../../../lib/Core/Platform/parseGameControllerMapping'
import { StandardKey } from '../../../../lib/Core/Input/StandardKey'
import { Mapping } from '../../../../lib/Core/Input/Mapping'
import { StandardMapping } from '../../../../lib/Core/Input/StandardMapping'

describe('parseGameControllerMapping', () => {
  it('should parse game controller mapping from Gamepad', () => {
    const mapping = parseGameControllerMapping(createGamepad())

    assert.equal(mapping.getKeyForButton(0), StandardKey.A)
    assert.equal(mapping.getKeyForButton(1), StandardKey.B)
    assert.equal(mapping.getKeyForButton(3), StandardKey.X)
    assert.equal(mapping.getKeyForButton(4), StandardKey.Y)
    assert.equal(mapping.getKeyForButton(15), StandardKey.SELECT)
    assert.equal(mapping.getKeyForButton(11), StandardKey.START)
    assert.equal(mapping.getKeyForButton(18), StandardKey.RIGHT)
    assert.equal(mapping.getKeyForButton(17), StandardKey.UP)
    assert.equal(mapping.getKeyForButton(19), StandardKey.DOWN)
    assert.equal(mapping.getKeyForButton(20), StandardKey.LEFT)
    assert.equal(mapping.getKeyForButton(13), StandardKey.LS)
    assert.equal(mapping.getKeyForButton(14), StandardKey.RS)
    assert.equal(mapping.getKeyForButton(6), StandardKey.L1)
    assert.equal(mapping.getKeyForButton(7), StandardKey.R1)
    assert.equal(mapping.getKeyForButton(16), StandardKey.HOME)

    assert.equal(mapping.getKeyForAxis(5, Mapping.Axis.RANGE), StandardKey.L2)
    assert.equal(mapping.getKeyForAxis(4, Mapping.Axis.RANGE), StandardKey.R2)
    assert.equal(mapping.getKeyForAxis(0, Mapping.Axis.NEGATIVE), StandardKey.LS_LEFT)
    assert.equal(mapping.getKeyForAxis(0, Mapping.Axis.POSITIVE), StandardKey.LS_RIGHT)
    assert.equal(mapping.getKeyForAxis(1, Mapping.Axis.NEGATIVE), StandardKey.LS_UP)
    assert.equal(mapping.getKeyForAxis(1, Mapping.Axis.POSITIVE), StandardKey.LS_DOWN)
    assert.equal(mapping.getKeyForAxis(2, Mapping.Axis.NEGATIVE), StandardKey.RS_LEFT)
    assert.equal(mapping.getKeyForAxis(2, Mapping.Axis.POSITIVE), StandardKey.RS_RIGHT)
    assert.equal(mapping.getKeyForAxis(3, Mapping.Axis.NEGATIVE), StandardKey.RS_UP)
    assert.equal(mapping.getKeyForAxis(3, Mapping.Axis.POSITIVE), StandardKey.RS_DOWN)

    assert.equal(mapping.name, StandardMapping.NAME)
  })
})

function createGamepad () {
  const nativeGamepad = createNativeGamepad()

  nativeGamepad.getGUID.returns('050000005e040000fd02000003090000')
  nativeGamepad.getButtonCount.returns(17)
  nativeGamepad.getHatCount.returns(1)
  nativeGamepad.getAxisCount.returns(6)
  nativeGamepad.getGameControllerMapping.returns('050000005e040000fd02000003090000,Xbox One Wireless Controller,a:b0,b:b1,' +
    'back:b15,dpdown:h0.4,dpleft:h0.8,dpright:h0.2,dpup:h0.1,guide:b16,leftshoulder:b6,leftstick:b13,lefttrigger:a5,' +
    'leftx:a0,lefty:a1,rightshoulder:b7,rightstick:b14,righttrigger:a4,rightx:a2,righty:a3,start:b11,x:b3,y:b4,' +
    'platform:Linux,')

  return new Gamepad(nativeGamepad)
}
