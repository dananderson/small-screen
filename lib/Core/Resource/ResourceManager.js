/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { ImageResource } from './ImageResource'
import { Resource } from './Resource'
import Queue from 'queue-fifo'
import { getSourceId, toSource } from '../Util'
import { FontResource } from './FontResource'
import assert from 'assert'
import { performance } from 'perf_hooks'
import { AudioResource } from './AudioResource'

const now = performance.now

const LOAD = 1
const ATTACH = 2
const SKIP = 3

export class ResourceManager {
  constructor (devices) {
    this._devices = devices
    this._resources = {}
    this._workQueue = new Queue()
    // TODO: make this configurable..
    this._resWorkerTimeLimitMs = 10
    this.isAttached = false
    this.path = ''
  }

  addImage (src) {
    src = toSource({ src, path: this.path, allowUTF8: true, allowBase64: true, allowRemote: true })

    return this._addResource(src.alias || src.uri, new ImageResource(src))
  }

  addFontResource ({ fontFamily, fontStyle, fontWeight, fontSize }) {
    assert(typeof fontFamily === 'string', 'fontFamily is required.')
    assert(fontSize >= 0, 'fontSize is required.')

    return this._addResource(
      `${fontFamily}-${fontStyle || 'normal'}-${fontWeight || 'normal'}-${fontSize}`,
      new FontResource({ fontFamily, fontStyle, fontWeight, fontSize }))
  }

  acquireResource(id) {
    return this._resources[id]
  }

  acquireResourceBySource (src) {
    return this._resources[getSourceId(src)]
  }

  acquireFontResource ({ fontFamily, fontStyle, fontWeight, fontSize }) {
    // TODO: more sophisticated search.. style and weight are optional
    return this._resources[`${fontFamily}-${fontStyle || 'normal'}-${fontWeight || 'normal'}-${fontSize}`]
  }

  addAudio (src) {
    src = toSource({ src, path: this.path, allowUTF8: false, allowBase64: false, allowRemote: false })

    return this._addResource(src.alias || src.uri, new AudioResource(src))
  }

  releaseResourceBySource (src) {
    const id = getSourceId(src)
    const resource = this._resources[id]

    if (resource) {
      resource._ref--

      if (resource._ref > 0) {
        return
      }

      if (this.isAttached) {
        resource._detach(this._devices)
      }

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

  attach () {
    this.isAttached = true

    const resources = this._resources

    for (const id in resources) {
      const resource = resources[id]

      if (resource._state !== Resource.ERROR) {
        this._workQueue.enqueue({ id, resource, type: LOAD })
      }
    }
  }

  detach () {
    this._workQueue.clear()
    this.isAttached = false

    const resources = this._resources

    for (const id in resources) {
      resources[id]._detach(this._devices)
    }
  }

  destroy () {
    this._resources = undefined
    this.isAttached = false
    this._workQueue = undefined
    this._devices = undefined
  }

  run () {
    if (!this.isAttached) {
      return
    }

    const start = now()
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
          console.time('attach')
          item.resource._attach(devices)
          console.timeEnd('attach')
          dirty = true
        }
      } catch (err) {
        console.log('Failed to process resource: ', item.id, err)
      }

      if (now() - start > timeLimit) {
        break
      }
    }

    return dirty
  }

  _loadResource (id, resource) {
    resource._load(this._devices)
      .then(() => {
        if (this.isAttached) {
          this._workQueue.enqueue({ id, resource, type: ATTACH })
        }
      })
      .catch((err) => {
        console.error(`Failed to load resource: ${id}`, err)
      })
  }

  _addResource (id, resource) {
    if (id && id in this._resources) {
      throw Error(`Resource already exists for id = ${id}`)
    }

    this._resources[id] = resource

    if (this.isAttached) {
      this._workQueue.enqueue({ id, resource, type: LOAD })
    }

    resource._ref = 1

    return resource
  }
}
