/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import Queue from 'queue-fifo'
import bindings from 'bindings'

const ImagePieces = bindings('small-screen').ImagePieces
const emptyObject = Object.freeze({})
const queue = new Queue()
let inflight = 0
let concurrency = 1

export class Image {
  /**
   * The maximum number of concurrent image load requests that javascript will have open at any given time.
   *
   * When the maximum number of active requests is hit, subsequent requests will be queued in javascript. These
   * queued requests are cancellable. The native layer has a queue and thread pool, but once an image loading request
   * goes into the native code, it cannot be cancelled.
   *
   * Note, at this stage of development, the javscript queue helps with image grid performance. But, it may be
   * overkill if the grid can better throttle image requests.
   *
   * @returns {number} Maximum number of concurrent image requests.
   */
  static get concurrency () {
    return concurrency
  }

  /**
   * Set the maximum number of concurrent image load requests that javascript will have open at any given time.
   *
   * If size = 0, image load requests will never be queued in javascript.
   *
   * If size > 0, this will be the new maximum number of outstanding image load requests.
   *
   * If size < 0, an Error is thrown.
   *
   * @param size {Number} New maximum.
   */
  static set concurrency (size) {
    if (typeof size !== 'number' || size < 0) {
      throw Error('size must be an integer value >= 0.')
    }
    concurrency = size
  }

  /**
   * The number of threads in the native image loading thread pool.
   *
   * @returns {Number}
   */
  static get threads () {
    return ImagePieces.getThreadPoolSize()
  }

  /**
   * Set the number of threads in the native image loading thread pool.
   *
   * If size = 0, the thread pool will be sized to the number of cpu cores.
   *
   * If size > 0, sets the size of the thread pool.
   *
   * If size < 0, an Error is thrown.
   *
   * @param size {Number} New size of thread pool.
   */
  static set threads (size) {
    // TODO: move this to the native layer
    if (typeof size !== 'number' || size < 0) {
      throw Error('size must be an integer value >= 0.')
    }
    ImagePieces.setThreadPoolSize(size)
  }

  constructor () {
    /**
     * Width of this image. Available after the image is loaded.
     *
     * @type {Number}
     */
    this.width = 0
    /**
     * Height of this image. Available after the image is loaded.
     *
     * @type {number}
     */
    this.height = 0
    /**
     * Image data. Available after the image is loaded.
     *
     * @type {Buffer}
     */
    this.buffer = null
    /**
     * Was this image's load request cancelled?
     *
     * @type {boolean}
     */
    this.wasCancelled = false
  }

  /**
   * Load an image.
   *
   * The image source can be a filename, a base64 encoded image file string or an SVG XML string. Use options.sourceType
   * to inform the load request what source is.
   *
   * @param source Image load path.
   * @param options.sourceType base64, xml (svg) or file path (default)
   * @param options.width Resize loaded image to this width. SVG is the only image format that supports resizing.
   * @param options.height Resize loaded image to this height. SVG is the only image format that supports resizing.
   * @returns {Promise<any>}
   */
  load (source, options) {
    const concurrency = Image.concurrency

    options = options || emptyObject

    if (concurrency !== 0 && inflight >= concurrency) {
      return new Promise((resolve, reject) => {
        queue.enqueue({
          resolve,
          reject,
          image: this,
          source,
          options
        })
      })
    } else {
      return loadImage(this, source, options)
    }
  }

  /**
   * Cancel the image loading request and release any native resources.
   */
  release () {
    this.wasCancelled = true

    if (this.buffer) {
      ImagePieces.release(this.buffer)
      this.buffer = undefined
    }
  }
}

function processNextLoadRequest () {
  inflight--

  while (!queue.isEmpty()) {
    const work = queue.dequeue()

    if (!work.image.i) {
      loadImage(work.image, work.source, work.options)
        .then(() => {
          if (!work.image.wasCancelled) {
            work.resolve()
          } else {
            work.image.release()
            work.reject(Error(`Cancelled image load: ${work.source}`))
          }
        })
        .catch((err) => {
          work.reject(err)
        })
      break
    } else {
      // Even though this request was cancelled, the Promise needs to be finished. reject() will notify listeners, so
      // they will need to guard against callbacks from this request.
      work.reject(Error(`Cancelled image load: ${work.source}`))
    }
  }
}

function loadImage (image, source, options) {
  inflight++

  return new Promise((resolve, reject) => {
    ImagePieces.load(source, options, (err, buffer, width, height) => {
      // The caller of this callback (in the native code) does not like exceptions..
      try {
        if (err) {
          image.release()
          reject(err)
        } else {
          image.buffer = buffer
          image.width = width
          image.height = height
          resolve()
        }

        processNextLoadRequest()
      } catch (err) {
        console.log('Something bad happened in the image loading callback!', err)
      }
    })
  })
}
