/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { FastEventEmitter } from '../../../../lib/Core/Util'

describe('FastEventEmitter', () => {
  let emitter
  describe('on()', () => {
    it('should add a listener', () => {
      emitter.on('event', () => {})
      assert.equal(emitter.listenerCount('event'), 1)
    })
    it('should throw Error if listener is not a function', () => {
      assert.throws(() => emitter.on('event', 'not a function'))
      assert.throws(() => emitter.on('event', undefined))
    })
  })
  describe('off()', () => {
    it('should remove an added listener', () => {
      let listener = () => {}

      emitter.on('event', listener)
      assert.equal(emitter.listenerCount('event'), 1)
      emitter.off('event', listener)
      assert.equal(emitter.listenerCount('event'), 0)
    })
    it('should be a noop if listener is not a function', () => {
      emitter.off('event', undefined)
    })
  })
  describe('once()', () => {
    it('should add one listener', () => {
      emitter.once('event', () => { })
      assert.equal(emitter.listenerCount('event'), 1)
    })
    it('should not remove once listener', () => {

    })
    it('should throw Error if listener is not a function', () => {
      assert.throws(() => emitter.once('event', 'not a function'))
      assert.throws(() => emitter.once('event', undefined))
    })
  })
  describe('emit()', () => {
    it('should pass args to listeners', () => {
      let arg = false

      emitter.on('event', (a) => { arg = a })
      emitter.emit('event', true)
      assert.isTrue(arg)
    })
    it('should dispatch to added listeners', () => {
      let called = false

      emitter.on('event', () => { called = true })
      emitter.emit('event')
      assert.isTrue(called)
    })
    it('should dispatch to added once listener', () => {
      let called = false

      emitter.once('event', () => { called = true })
      emitter.emit('event')
      assert.isTrue(called)
      called = false
      emitter.emit('event')
      assert.isFalse(called)
    })
    it('should add listener on emit, but not call it', () => {
      let called = false
      let addedListener = () => { called = true }
      let listener = () => { emitter.on('event', addedListener) }

      emitter.on('event', listener)
      emitter.emit('event')
      assert.isFalse(called)
      emitter.off('event', listener)
      emitter.emit('event')
      assert.isTrue(called)
    })
  })
  beforeEach(() => {
    emitter = new FastEventEmitter()
  })
})
