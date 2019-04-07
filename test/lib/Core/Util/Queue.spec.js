/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { Queue } from '../../../../lib/Core/Util/Queue'

describe('Queue', () => {
  let queue
  describe('constructor()', () => {
    it('should create a 0 length queue', () => {
      assert.equal(queue.length, 0)
    })
    it('should create a 0 length queue when internal size specified', () => {
      queue = new Queue(3)

      assert.equal(queue.length, 0)
    })
  })
  describe('enqueue()', () => {
    it('should add items to the queue', () => {
      queue.enqueue(3)
      queue.enqueue(4)
      queue.enqueue(5)

      assert.equal(queue.length, 3)
    })
    it('should add items to the queue when adds exceed internal size', () => {
      queue = new Queue(1)

      queue.enqueue(3)
      queue.enqueue(4)
      queue.enqueue(5)

      assert.equal(queue.length, 3)
    })
  })
  describe('dequeue()', () => {
    it('should remove items', () => {
      queue.enqueue(3)
      queue.enqueue(4)
      queue.enqueue(5)

      assert.equal(queue.dequeue(), 3)
      assert.equal(queue.dequeue(), 4)
      assert.equal(queue.dequeue(), 5)

      assert.equal(queue.length, 0)
    })
    it('should return undefined if queue is empty', () => {
      queue.enqueue(3)

      queue.dequeue()

      assert.isUndefined(queue.dequeue())
      assert.equal(queue.length, 0)
    })
    it('should return undefined for new queue', () => {
      assert.isUndefined(queue.dequeue())
      assert.equal(queue.length, 0)
    })
  })
  describe('find()', () => {
    it('should find items in queue', () => {
      queue.enqueue(3)
      queue.enqueue(4)
      queue.enqueue(5)

      assert.equal(queue.find(value => value === 3), 3)
      assert.equal(queue.find(value => value === 4), 4)
      assert.equal(queue.find(value => value === 5), 5)
    })
    it('should return undefined for an empty queue', () => {
      assert.isUndefined(queue.find(value => value === 6))
    })
    it('should return undefined for value not in queue', () => {
      queue.enqueue(3)
      queue.enqueue(4)
      queue.enqueue(5)

      assert.isUndefined(queue.find(value => value === 6))
    })
  })

  describe('clear()', () => {
    it('should clear all items from queue', () => {
      queue.enqueue(3)
      queue.enqueue(4)
      queue.enqueue(5)
      queue.clear()

      assert.equal(queue.length, 0)
    })
  })
  beforeEach(() => {
    queue = new Queue()
  })
  afterEach(() => {
    queue = undefined
  })
})
