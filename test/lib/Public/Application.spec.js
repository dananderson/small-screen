/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Application } from '../../../lib/Public/Application'
import { testSetApplication } from '../../../lib/Public'
import sinon from 'sinon'

const listener = () => {}

describe('Application', () => {
  let app
  describe('addEventListener()', () => {
    it('should add an event listener', () => {
      Application.addEventListener(Application.Events.closing, listener)
      sinon.assert.calledWith(app.on, Application.Events.closing, listener)
    })
  })
  describe('removeEventListener()', () => {
    it('should remove an event listener', () => {
      Application.addEventListener(Application.Events.closing, listener)
      Application.removeEventListener(Application.Events.closing, listener)
      sinon.assert.calledWith(app.off, Application.Events.closing, listener)
    })
    it('should ignore non-function listener', () => {
      Application.removeEventListener(Application.Events.closing, undefined)
      Application.removeEventListener(Application.Events.closing, null)
      Application.removeEventListener(Application.Events.closing, '')
      Application.removeEventListener(Application.Events.closing, 'garbage')
    })
  })
  beforeEach(() => {
    testSetApplication(app = {
      on: sinon.spy(),
      off: sinon.spy()
    })
  })
  afterEach(() => {
    testSetApplication()
  })
})
