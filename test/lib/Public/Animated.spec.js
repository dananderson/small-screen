/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { testSetApplication } from '../../../lib/Public'
import sinon from 'sinon'
import { AnimationManager } from '../../../lib/Core/Animated/AnimationManager'
import { Animated } from '../../../lib/Public/Animated'
import { Value } from '../../../lib/Core/Style/Value'
import { TimingAnimation } from '../../../lib/Core/Animated/TimingAnimation'
import { SequenceAnimation } from '../../../lib/Core/Animated/SequenceAnimation'
import { ParallelAnimation } from '../../../lib/Core/Animated/ParallelAnimation'

describe('Animated', () => {
  describe('timing()', () => {
    it('should return timing animation', () => {
      const animation = Animated.timing(new Value(), { to: 255, duration: 500 })

      assert.instanceOf(animation, TimingAnimation)
    })
  })
  describe('sequence()', () => {
    it('should return sequence animation', () => {
      const animation = Animated.sequence([
        Animated.timing(new Value(), { to: 255, duration: 100 }),
        Animated.timing(new Value(), { to: 255, duration: 500 })
      ])

      assert.instanceOf(animation, SequenceAnimation)
      assert.lengthOf(animation._animations, 2)
    })
  })
  describe('parallel()', () => {
    it('should return parallel animation', () => {
      const animation = Animated.parallel([
        Animated.timing(new Value(), { to: 255, duration: 100 }),
        Animated.timing(new Value(), { to: 255, duration: 500 })
      ])

      assert.instanceOf(animation, ParallelAnimation)
      assert.lengthOf(animation._animations, 2)
    })
  })
  beforeEach(() => {
    testSetApplication({
      animation: sinon.createStubInstance(AnimationManager)
    })
  })
  afterEach(() => {
    testSetApplication()
  })
})
