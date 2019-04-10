/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { ImageResource } from './ImageResource'
import { Resource } from './Resource'
import { getSourceId, toSource } from '../Util'
import { FontResource } from './FontResource'
import assert from 'assert'
import { performance } from 'perf_hooks'
import { AudioResource } from './AudioResource'
import { Queue } from '../Util/Queue'
import { FONT_STYLE_NORMAL, FONT_WEIGHT_NORMAL } from '../Style/Constants'

const now = performance.now

const LOAD = 1
const ATTACH = 2
const SKIP = 3

const RESOURCE_ERROR = Resource.ERROR

export class ResourceManager {
  constructor (devices) {
    this._devices = devices
    this._resources = new Map()
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

  addAudio (src) {
    src = toSource({ src, path: this.path, allowUTF8: false, allowBase64: true, allowRemote: true })

    return this._addResource(src.alias || src.uri, new AudioResource(src))
  }

  addFont ({ fontFamily, fontStyle, fontWeight, fontSize }) {
    assert(typeof fontFamily === 'string', 'fontFamily is required.')
    assert(fontSize >= 0, 'fontSize is required.')

    fontStyle = fontStyle || FONT_STYLE_NORMAL
    fontWeight = fontWeight || FONT_WEIGHT_NORMAL

    return this._addResource(
      `${fontFamily}-${fontStyle}-${fontWeight}-${fontSize}`,
      new FontResource({ fontFamily, fontStyle, fontWeight, fontSize }))
  }

  acquire (id) {
    const resource = this._resources.get(id)

    if (resource) {
      resource._ref++
    }

    return resource
  }

  acquireBySource (src) {
    return this.acquire(getSourceId(src))
  }

  acquireFont ({ fontFamily, fontStyle, fontWeight, fontSize }) {
    // TODO: need a more sophisticated search.. style and weight are optional
    return this.acquire(`${fontFamily}-${fontStyle || FONT_STYLE_NORMAL}-${fontWeight || FONT_WEIGHT_NORMAL}-${fontSize}`)
  }

  get (id) {
    return this._resources.get(id)
  }

  release (id) {
    const resource = this._resources.get(id)

    if (resource) {
      if (--resource._ref > 0) {
        return
      }

      const { isAttached, _devices, _workQueue, _resources } = this

      if (isAttached && resource.isAttached) {
        resource._detach(_devices)
      }

      const item = _workQueue.find(item => item.id === id)

      if (item) {
        item.type = SKIP
      }

      _resources.delete(id)
    }
  }

  releaseBySource (src) {
    this.release(getSourceId(src))
  }

  attach () {
    this.isAttached = true

    const { _resources, _workQueue } = this

    for (const [ id, resource ] of _resources.entries()) {
      if (resource._state !== RESOURCE_ERROR) {
        _workQueue.enqueue({ id, resource, type: LOAD })
      }
    }
  }

  detach () {
    const { _resources, _devices, _workQueue } = this

    _workQueue.clear()
    this.isAttached = false

    for (const resource of _resources.values()) {
      resource._detach(_devices)
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
    const { _devices, _resWorkerTimeLimitMs, _workQueue } = this
    let dirty = false

    while (_workQueue.length) {
      const { id, resource, type } = _workQueue.dequeue()

      try {
        if (type === LOAD) {
          this._loadResource(id, resource)
        } else if (type === ATTACH) {
          resource._attach(_devices)
          dirty = true
        }
      } catch (err) {
        console.log('Failed to process resource: ', id, err)
      }

      if (now() - start > _resWorkerTimeLimitMs) {
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
    const { _resources, isAttached, _workQueue } = this

    if (_resources.has(id)) {
      throw Error(`Resource already exists for id = ${id}`)
    }

    _resources.set(id, resource)

    if (isAttached) {
      _workQueue.enqueue({ id, resource, type: LOAD })
    }

    resource._ref = 1

    return resource
  }
}
