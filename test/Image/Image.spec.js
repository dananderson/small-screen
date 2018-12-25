/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import chai, { assert } from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Image } from '../../lib/Resource/Image'
import os from 'os'

chai.use(chaiAsPromised)

const TEST_IMG = 'test/resources/tiger.png'
const TEST_SVG = 'test/resources/tiger.svg'
const TEST_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQIHWPgFpUHAABuAEAHgNGQAAAAAElFTkSuQmCC'
const TEST_SVG_XML = '<svg width="400" height="110"><rect width="300" height="100" style="fill:rgb(0,0,255);" />'

const TEST_BAD_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQIHWPgFpUHAABuAEAHgNGQAAA'
const TEST_BAD_SVG_XML = '<svg width="400" height="110"><rect width="300" height="100" style="fill:rgb(0,0,255);"'

describe('Image', () => {
  let image

  describe('load()', () => {
    it('should load a png image from file', () => {
      return image.load(TEST_IMG)
        .then(() => {
          assert.equal(image.width, 600)
          assert.equal(image.height, 600)
          assert.isOk(image.buffer)
        })
    })
    it('should load a png image from base64 encoded string', () => {
      return image.load(TEST_BASE64, { sourceType: 'base64' })
        .then(() => {
          assert.equal(image.width, 1)
          assert.equal(image.height, 1)
          assert.isOk(image.buffer)
        })
    })
    it('should NOT load an image from Base64 encoded string when no sourceType is set', () => {
      return image.load(TEST_BASE64)
        .then(() => {
          assert.isOk(false, 'Resolve was not expected.')
        })
        .catch((err) => {
          assert.isOk(err)
        })
    })
    it('should NOT load an image from corrupt Base64 encoded string', () => {
      return image.load(TEST_BAD_BASE64, { sourceType: 'base64' })
        .then(() => {
          assert.isOk(false, 'Resolve was not expected.')
        })
        .catch((err) => {
          assert.isOk(err)
        })
    })
    it('should load an SVG image from file', () => {
      return image.load(TEST_SVG)
        .then(() => {
          assert.equal(image.width, 900)
          assert.equal(image.height, 900)
          assert.isOk(image.buffer)
        })
    })
    it('should load an SVG image with dimensions from file', () => {
      return image.load('test/resources/tiger.svg', { width: 100, height: 100 })
        .then(() => {
          assert.equal(image.width, 100)
          assert.equal(image.height, 100)
          assert.isOk(image.buffer)
        })
    })
    it('should load an SVG image from an XML string', () => {
      return image.load(TEST_SVG_XML, { sourceType: 'xml' })
        .then(() => {
          assert.equal(image.width, 400)
          assert.equal(image.height, 110)
          assert.isOk(image.buffer)
        })
    })
    it('should NOT load an image from a corrupt XML string', () => {
      return image.load(TEST_BAD_SVG_XML, { sourceType: 'xml' })
        .then(() => {
          assert.isOk(false, 'Resolve was not expected.')
        })
        .catch((err) => {
          assert.isOk(err)
        })
    })
    it('should NOT load an SVG image from xml when no sourceType is set', () => {
      return image.load(TEST_SVG_XML)
        .then(() => {
          assert.isOk(false, 'Resolve was not expected.')
        })
        .catch((err) => {
          assert.isOk(err)
        })
    })
  })
  describe('concurrency()', () => {
    it('should update to 2', () => {
      Image.concurrency = 2
      assert.equal(Image.concurrency, 2)
      Image.concurrency = 1
    })
    it('should update to 0', () => {
      Image.concurrency = 0
      assert.equal(Image.concurrency, 0)
      Image.concurrency = 1
    })
    it('should throw Error for negative numbers', () => {
      assert.throws(() => {
        Image.concurrency = -1
      })
    })
    it('should throw Error for non-numbers', () => {
      assert.throws(() => {
        Image.concurrency = undefined
      })
    })
  })
  describe('threads()', () => {
    it('should update to 2', () => {
      Image.threads = 2
      assert.equal(Image.threads, 2)
      Image.threads = 1
    })
    it('should update to cpu count', () => {
      Image.threads = 0
      assert.equal(Image.threads, os.cpus().length)
      Image.threads = 1
    })
    it('should throw Error for negative numbers', () => {
      assert.throws(() => {
        Image.threads = -1
      })
    })
    it('should throw Error for non-numbers', () => {
      assert.throws(() => {
        Image.threads = undefined
      })
    })
  })
  beforeEach(() => {
    image = new Image()
  })

  afterEach(() => {
    if (image) {
      image.release()
    }
  })
})
