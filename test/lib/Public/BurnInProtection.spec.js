/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { BurnInProtection } from '../../../lib/Public/BurnInProtection'

const DEFAULT_TIMEOUT = 15 * 60
const TIMEOUT = 20 * 60

describe('BurnInProtection', () => {
  describe('setEnabled()', () => {
    it('should turn on burn-in protection', () => {
      BurnInProtection.setEnabled(true)

      assert.isTrue(BurnInProtection.isEnabled())
    })
    it('should turn off burn-in protection', () => {
      BurnInProtection.setEnabled(true)
      BurnInProtection.setEnabled(false)

      assert.isFalse(BurnInProtection.isEnabled())
    })
  })
  describe('setInactivityTimeout()', () => {
    it('should set inactivity timeout', () => {
      BurnInProtection.setInactivityTimeout(TIMEOUT)

      assert.equal(BurnInProtection.getInactivityTimeout(), TIMEOUT)
    })
    it('should reset inactivity timeout', () => {
      BurnInProtection.setInactivityTimeout(TIMEOUT)
      BurnInProtection.setInactivityTimeout()

      assert.equal(BurnInProtection.getInactivityTimeout(), DEFAULT_TIMEOUT)
    })
    it('should throw Error for invalid timeout values', () => {
      assert.throws(() => BurnInProtection.setInactivityTimeout(''))
      assert.throws(() => BurnInProtection.setInactivityTimeout(-1))
      assert.throws(() => BurnInProtection.setInactivityTimeout(NaN))
      assert.throws(() => BurnInProtection.setInactivityTimeout(null))
    })
  })
  describe('getBlackoutOpacity()', () => {
    it('should set blackout opacity', () => {
      for (const opacity of [ 50, '50', '50%' ]) {
        BurnInProtection.setBlackoutOpacity(opacity)
        assert.equal(BurnInProtection.getBlackoutOpacity(), 50)
        BurnInProtection.setBlackoutOpacity()
      }
    })
    it('should reset blackout opacity', () => {
      BurnInProtection.setBlackoutOpacity(50)
      BurnInProtection.setBlackoutOpacity()

      assert.equal(BurnInProtection.getBlackoutOpacity(), 100)
    })
    it('should throw Error for invalid opacity values', () => {
      assert.throws(() => BurnInProtection.setBlackoutOpacity(''))
      assert.throws(() => BurnInProtection.setBlackoutOpacity(-1))
      assert.throws(() => BurnInProtection.setBlackoutOpacity(101))
      assert.throws(() => BurnInProtection.setBlackoutOpacity(NaN))
      assert.throws(() => BurnInProtection.setBlackoutOpacity(null))
      assert.throws(() => BurnInProtection.setBlackoutOpacity('-1'))
      assert.throws(() => BurnInProtection.setBlackoutOpacity('101'))
      assert.throws(() => BurnInProtection.setBlackoutOpacity('garbage'))
    })
  })
  afterEach(() => {
    BurnInProtection.setEnabled(false)
    BurnInProtection.setInactivityTimeout()
    BurnInProtection.setBlackoutOpacity()
  })
})
