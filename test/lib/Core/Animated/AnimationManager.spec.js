/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { AnimationManager } from '../../../../lib/Core/Animated/AnimationManager'
import { TimingAnimation } from '../../../../lib/Core/Animated/TimingAnimation'
import { Value } from '../../../../lib/Core/Style/Value'
import { SequenceAnimation } from '../../../../lib/Core/Animated/SequenceAnimation'
import { ParallelAnimation } from '../../../../lib/Core/Animated/ParallelAnimation'

describe('AnimationManager', () => {
  describe('timing()', () => {
    it('should run animation until finished', () => {
      const animationManager = new AnimationManager()
      const value = new Value(0)
      const animation = new TimingAnimation(animationManager, value, {
        from: 0,
        to: 3,
        duration: 3
      })
      const callback = () => {
        callback.called = true
      }

      assert.equal(value.getValue(), 0)
      assert.isFalse(animation.finished)

      animation.start(callback)

      assert.equal(value.getValue(), 0)
      assert.isFalse(animation.finished)

      animationManager.run(1)
      assert.equal(value.getValue(), 1)
      assert.isFalse(animation.finished)

      animationManager.run(1)
      assert.equal(value.getValue(), 2)
      assert.isFalse(animation.finished)

      animationManager.run(1)
      assert.equal(value.getValue(), 3)
      assert.isTrue(animation.finished)
      assert.isTrue(callback.called)
    })
  })
  describe('sequence()', () => {
    it('should run a list of animations sequentially', () => {
      const animationManager = new AnimationManager()
      const value1 = new Value(0)
      const value2 = new Value(0)
      const animation = new SequenceAnimation(animationManager, [
        new TimingAnimation(animationManager, value1, {
          from: 0,
          to: 3,
          duration: 3
        }),
        new TimingAnimation(animationManager, value2, {
          from: 0,
          to: 3,
          duration: 3
        })
      ])
      const callback = () => {
        callback.called = true
      }
      callback.called = false

      animation.start(callback)

      animationManager.run(1)
      animationManager.run(1)
      animationManager.run(1)

      assert.equal(value1.getValue(), 3)
      assert.equal(value2.getValue(), 0)
      assert.isFalse(callback.called)
      assert.isFalse(animation.finished)

      animationManager.run(1)
      animationManager.run(1)
      animationManager.run(1)

      assert.equal(value1.getValue(), 3)
      assert.equal(value2.getValue(), 3)
      assert.isTrue(callback.called)
      assert.isTrue(animation.finished)
    })
  })
  describe('parallel()', () => {
    it('should run list of animations in parallel', () => {
      const animationManager = new AnimationManager()
      const value1 = new Value(0)
      const value2 = new Value(0)
      const animation = new ParallelAnimation(animationManager, [
        new TimingAnimation(animationManager, value1, {
          from: 0,
          to: 3,
          duration: 3
        }),
        new TimingAnimation(animationManager, value2, {
          from: 0,
          to: 3,
          duration: 3
        })
      ])
      const callback = () => {
        callback.called = true
      }
      callback.called = false

      animation.start(callback)

      animationManager.run(1)
      animationManager.run(1)
      animationManager.run(1)

      assert.equal(value1.getValue(), 3)
      assert.equal(value2.getValue(), 3)
      assert.isTrue(callback.called)
      assert.isTrue(animation.finished)
    })
  })
})
