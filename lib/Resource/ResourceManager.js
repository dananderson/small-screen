/*
 * Copyright (c) 2018 Daniel Anderson.
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { ImageResource } from './ImageResource'
import { BitmapFontResource } from './BitmapFontResource'
import { AudioResource } from './AudioResource'
import { Resource } from './Resource'
import Queue from 'queue-fifo'
import { now } from '../Utilities/now'
import { join, isAbsolute } from 'path'
import { Image } from './Image'

const LOAD = 1
const ATTACH = 2
const SKIP = 3

export class ResourceManager {
  isAttached = false
  path = ''

  constructor ({ resWorkerTimeLimitMs, resWorkerRescheduleDelayMs, resImageConcurrency, resImageThreadPoolSize }) {
    this._workerId = undefined
    this._resources = {}
    this._devices = undefined
    this._workQueue = new Queue()

    // TODO: set defaults?
    this._resWorkerTimeLimitMs = resWorkerTimeLimitMs
    this._resWorkerRescheduleDelayMs = resWorkerRescheduleDelayMs
    Image.threads = resImageThreadPoolSize
    Image.concurrency = resImageConcurrency
  }

  /**
   * Add a new resource.
   *
   * @param id Unique ID for the new resource.
   * @param resource Resource instance.
   * @returns {Resource}
   */
  addResource (id, resource) {
    if (id && id in this._resources) {
      throw Error('Resource already exists for id = ' + id)
    }

    this._resources[id] = resource

    if (this.isAttached) {
      this._workQueue.enqueue({ id, resource, type: LOAD })
      this._scheduleWorker()
    }

    resource._ref = 1

    return resource
  }

  /**
   * Add a new image file from file.
   *
   * .png, jpg, .gif and .svg are supported. See pixels-please for all supported image formats.
   *
   * @param id Unique ID for the new resource.
   * @param filename Absolute or relative image file name.
   * @param options Image loading options.
   * @param options.width Resize image to this width. Should be accompanied by height.
   * @param options.height Resize image to this height. Should be accompanied by width.
   * @returns {ImageResource}
   */
  addImageResource (id, filename, options) {
    if (!options || !options.sourceType || options.sourceType === 'file') {
      filename = this._resolveFilename(filename)
    }

    return this.addResource(id, new ImageResource(filename, options))
  }

  /**
   * Add a new font resource from file.
   *
   * AngelCode bitmap font files (.fnt) are supported. Image file names in the .fnt file are assumed to be relative
   * to the .fnt file path.
   *
   * @param id Unique ID for the new resource.
   * @param filename Absolute or relative font file name.
   * @returns {BitmapFontResource}
   */
  addBitmapFontResource (id, filename) {
    return this.addResource(id, new BitmapFontResource(this._resolveFilename(filename)))
  }

  /**
   * Add a new font resource by the style font ID. The font ID is a combination of the font family name and font size
   * (ex: arial-24).
   *
   * AngelCode bitmap font files (.fnt) are supported. Image file names in the .fnt file are assumed to be relative
   * to the .fnt file path.
   *
   * This method assumed that the ${fontId}.fnt file is in the resource manager's path.
   *
   * @param fontId Style font ID.
   * @returns {BitmapFontResource}
   */
  addBitmapFontResourceByFontId (fontId) {
    // TODO: add a path to the resource manager
    return this.addResource(fontId, new BitmapFontResource(this._resolveFilename(fontId + '.fnt')))
  }

  /**
   * Add an audio resource to the resource manager.
   *
   * Wave files are supported.
   *
   * @param id Unique ID for the new resource.
   * @param filename Absolute or relative audio file name.
   * @returns {AudioResource}
   */
  addAudioResource (id, filename) {
    return this.addResource(id, new AudioResource(this._resolveFilename(filename)))
  }

  /**
   * Increment the reference count of a resource.
   *
   * Note: add*Resource() calls set ref count to 1. A call to removeResource will decrement a resource's ref count.
   *
   * @param id Unique ID for the new resource.
   */
  addRef (id) {
    const resource = this._resources[id]

    if (resource) {
      resource._ref++
    }
  }

  /**
   * Remove a resource from the resource manager.
   *
   * If the resource has a reference count of 1, the resource will be removed and cleaned up. If the reference count
   * is greater than 1, the reference count will be decremented and the resource will remain in the resource manager.
   *
   * @param id Unique ID for the new resource.
   */
  removeResource (id) {
    const resource = this._resources[id]

    if (resource) {
      // TODO: add an api..
      resource._ref--

      if (resource._ref > 0) {
        return
      }

      if (this.isAttached) {
        resource._detach(this._devices)
      }

      resource._destroy()

      let walker = this._workQueue._list.head

      while (walker) {
        if (walker.data.id === id) {
          walker.data.type = SKIP
        }
        walker = walker.next
      }

      delete this._resources[id]
    }
  }

  /**
   * Does this resource exist?
   *
   * @param id Unique ID for the new resource.
   * @returns {boolean}
   */
  hasResource (id) {
    return id in this._resources
  }

  /**
   * Get a resource by ID.
   *
   * @param id Unique ID for the new resource.
   * @returns {Resource}
   */
  getResource (id) {
    return this._resources[id]
  }

  _attach (scene, devices) {
    this._scene = scene
    this._devices = devices
    this.isAttached = true

    const resources = this._resources

    for (const id in resources) {
      const resource = resources[id]

      if (resource._getState() !== Resource.ERROR) {
        this._workQueue.enqueue({ id, resource, type: LOAD })
      }
    }

    this._scheduleWorker()
  }

  _detach () {
    this._workQueue.clear()
    this.isAttached = false
    this._unscheduleWorker()

    const devices = this._devices

    if (devices) {
      const resources = this._resources

      for (const id in resources) {
        resources[id]._detach(devices)
      }

      this._devices = undefined
    }
  }

  destroy () {
    this._unscheduleWorker()

    if (this._resources) {
      for (const id in this._resources) {
        this._resources[id]._destroy()
      }

      this._resources = undefined
    }

    this.isAttached = false
    this._workQueue = undefined
    this._devices = undefined
  }

  _unscheduleWorker () {
    this._workerId && clearTimeout(this._workerId)
    this._workerId = undefined
  }

  _scheduleWorker (timeout = 0) {
    const worker = () => {
      const start = now()
      this._workerId = undefined

      if (!this.isAttached) {
        return
      }

      const devices = this._devices
      const timeLimit = this._resWorkerTimeLimitMs
      let dirty = false

      while (!this._workQueue.isEmpty()) {
        const item = this._workQueue.dequeue()
        const { type } = item

        try {
          if (type === LOAD) {
            this._loadResource(item.id, item.resource)
          } else if (type === ATTACH) {
            // TODO: if this fails, should it be put into the error state?
            item.resource._attach(devices)
            dirty = true
          }
        } catch (err) {
          console.log('Failed to process resource: ', item.id)
        }

        if (now() - start > timeLimit) {
          break
        }
      }

      dirty && this._scene.root.markDirty()

      if (!this._workQueue.isEmpty()) {
        this._scheduleWorker(this._resWorkerRescheduleDelayMs)
      }
    }

    if (!this._workerId) {
      this._workerId = setTimeout(worker, timeout)
    }
  }

  _loadResource (id, resource) {
    resource._load(this._devices)
      .then(() => {
        if (this.isAttached) {
          this._workQueue.enqueue({ id, resource, type: ATTACH })
          this._scheduleWorker()
        }
      })
      .catch((err) => {
        console.error(`Failed to load resource: ${id}`, err)
      })
  }

  _resolveFilename (filename) {
    if (isAbsolute(filename)) {
      return filename
    }

    return join(this.path, filename)
  }
}
