/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { AnimationManager } from '../../lib/Animation/AnimationManager'
import { Value } from '../../lib/Style/Value'

describe('AnimationManager', () => {
  describe('run()', () => {
    it('should run animation until finished', () => {
      const animationManager = new AnimationManager()
      const value = new Value(0)
      const animation = animationManager.timing(value, {
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
      const animation = animationManager.sequence([
        animationManager.timing(value1, {
          from: 0,
          to: 3,
          duration: 3
        }),
        animationManager.timing(value2, {
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
      const animation = animationManager.parallel([
        animationManager.timing(value1, {
          from: 0,
          to: 3,
          duration: 3
        }),
        animationManager.timing(value2, {
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
