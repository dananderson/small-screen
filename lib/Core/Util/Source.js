/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { isAbsolute, join } from 'path'
import isUrl from 'is-url'
import { parseDataURI } from './parseDataURI'
import { SourceType } from './SourceType'

let FILE_URI_ABS_PREFIX = 'file:///'
let FILE_URI_ABS_PREFIX_LEN = FILE_URI_ABS_PREFIX.length
let FILE_URI_REL_PREFIX = 'file://resource/'
let FILE_URI_REL_PREFIX_LEN = FILE_URI_REL_PREFIX.length
let { REMOTE, BASE64, FILE, UTF8 } = SourceType

export function toSource ({ src, path, allowRemote = false, allowBase64 = false, allowUTF8 = false }) {
  let uri

  if (typeof src === 'string') {
    uri = src
    src = { uri }
  } else {
    uri = src && src.uri

    checkUri(uri)

    src = { ...src }
  }

  if (isAbsolute(uri)) {
    src.type = FILE
  } else if (uri.startsWith(FILE_URI_REL_PREFIX)) {
    src.uri = join(path, uri.substr(FILE_URI_REL_PREFIX_LEN))
    src.type = FILE
  } else if (uri.startsWith(FILE_URI_ABS_PREFIX)) {
    src.uri = uri.substr(FILE_URI_ABS_PREFIX_LEN)
    src.type = FILE
  } else if (uri.startsWith('data:')) {
    const [ type, u, data ] = parseDataURI(uri)

    src.uri = u
    src.data = data
    src.type = type
  } else if (isUrl(uri)) {
    src.type = REMOTE
  } else {
    src.uri = path ? join(path, uri) : uri
    if (!src.alias) {
      src.alias = uri
    }
    src.type = FILE
  }

  if (!src.alias) {
    src.alias = uri
  }

  checkType(src, allowRemote, allowBase64, allowUTF8)

  return src
}

export function getSourceId (src) {
  return (!src || typeof src === 'string') ? src : (src.alias || src.uri)
}

function checkType ({ type }, allowRemote, allowBase64, allowUTF8) {
  if (type === REMOTE && !allowRemote) {
    throw Error('URL is not allowed as source.')
  }

  if (type === BASE64 && !allowBase64) {
    throw Error('Base64 encoded data URI is not allowed as source.')
  }

  if (type === UTF8 && !allowUTF8) {
    throw Error('UTF-8 encoded data URI is not allowed as source.')
  }
}

function checkUri (uri) {
  if (typeof uri !== 'string') {
    throw Error('src must contain a "uri" string property contain a file path, data uri or url.')
  }
}
