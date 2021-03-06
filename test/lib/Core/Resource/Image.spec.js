/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { Image } from '../../../../lib/Core/Resource/Image'
import { SourceType } from '../../../../lib/Core/Util'
import { isRejected } from '../../../isRejected'

const TEST_IMG = 'test/resources/tiger.png'
const TEST_SVG = 'test/resources/tiger.svg'
const TEST_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQIHWPgFpUHAABuAEAHgNGQAAAAAElFTkSuQmCC'
const TEST_SVG_XML = '<svg width="400" height="110"><rect width="300" height="100" style="fill:rgb(0,0,255);" />'

const TEST_BAD_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVQIHWPgFpUHAABuAEAHgNGQAAA'
const TEST_BAD_SVG_XML = 'this is not xml'

const TEST_ONE = 'test/resources/one'

describe('Image', () => {
  let image

  describe('load()', () => {
    it('should load a png image from file', async () => {
      await image.load(TEST_IMG)

      assert.equal(image.width, 600)
      assert.equal(image.height, 600)
      assert.isOk(image.buffer)
    })
    it('should load a png image from base64 encoded string', async () => {
      await image.load(Buffer.from(TEST_BASE64, 'base64'), { type: SourceType.BASE64 })
      assert.equal(image.width, 1)
      assert.equal(image.height, 1)
      assert.isOk(image.buffer)
    })
    it('should NOT load an image from Base64 encoded string when no sourceType is set', async () => {
      await isRejected(image.load(TEST_BASE64))
    })
    it('should NOT load an image from corrupt Base64 encoded string', async () => {
      await isRejected(image.load(TEST_BAD_BASE64, { type: SourceType.BASE64 }))
    })
    it('should load an SVG image from file', async () => {
      await image.load(TEST_SVG)

      assert.equal(image.width, 900)
      assert.equal(image.height, 900)
      assert.isOk(image.buffer)
    })
    it('should load an SVG image with dimensions from file', async () => {
      await image.load('test/resources/tiger.svg', { width: 100, height: 100 })

      assert.equal(image.width, 100)
      assert.equal(image.height, 100)
      assert.isOk(image.buffer)
    })
    it('should load an SVG image from an XML string', async () => {
      await image.load(TEST_SVG_XML, { type: SourceType.UTF8 })

      assert.equal(image.width, 400)
      assert.equal(image.height, 110)
      assert.isOk(image.buffer)
    })
    it('should load image file with no extension when basename is set', async () => {
      await image.load(TEST_ONE, { basename: true })

      assert.equal(image.width, 1)
      assert.equal(image.height, 1)
      assert.isOk(image.buffer)
    })
    it('should NOT load an image from a corrupt XML string', async () => {
      await isRejected(image.load(TEST_BAD_SVG_XML, { type: SourceType.UTF8 }))
    })
    it('should NOT load an SVG image from xml when no sourceType is set', async () => {
      await isRejected(image.load(TEST_SVG_XML))
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
  beforeEach(() => {
    image = new Image()
  })
  afterEach(() => {
    if (image) {
      image.release()
    }
  })
})
