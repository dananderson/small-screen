/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { isAbsolute, join } from 'path'
import isUrl from 'is-url'
import { parseDataURI } from './parseDataURI'

const FILE_URI_ABS_PREFIX = 'file:///'
const FILE_URI_REL_PREFIX = 'file://resource/'

export const SourceType = {
  REMOTE: 'remote',
  BASE64: 'base64',
  FILE: 'file',
  UTF8: 'utf8'
}

export function toSource ({ src, path, allowRemote = false, allowBase64 = false, allowUTF8 = false }) {
  let uri

  if (typeof src === 'string') {
    uri = src
    src = { uri }
  } else {
    uri = src && src.uri

    if (typeof src.uri !== 'string') {
      throw Error('src must contain a "uri" string property contain a file path, data uri or url.')
    }

    src = { ...src }
  }

  if (isAbsolute(uri)) {
    src.type = SourceType.FILE
  } else if (uri.startsWith(FILE_URI_REL_PREFIX)) {
    src.uri = join(path, uri.substr(FILE_URI_REL_PREFIX.length))
    src.type = SourceType.FILE
  } else if (uri.startsWith(FILE_URI_ABS_PREFIX)) {
    src.uri = uri.substr(FILE_URI_ABS_PREFIX.length)
    src.type = SourceType.FILE
  } else if (uri.startsWith('data:')) {
    const parsed = parseDataURI(uri)

    src.uri = uri
    src.data = parsed.data
    src.type = parsed.type
  } else if (isUrl(uri)) {
    src.type = SourceType.REMOTE
  } else {
    src.uri = path ? join(path, uri) : uri
    if (!src.alias) {
      src.alias = uri
    }
    src.type = SourceType.FILE
  }

  if (!src.alias) {
    src.alias = uri
  }

  if (src.type === SourceType.REMOTE && !allowRemote) {
    throw Error('URL is not allowed as source.')
  }

  if (src.type === SourceType.BASE64 && !allowBase64) {
    throw Error('Base64 encoded data URI is not allowed as source.')
  }

  if (src.type === SourceType.UTF8 && !allowUTF8) {
    throw Error('UTF-8 encoded data URI is not allowed as source.')
  }

  return src
}

export function getSourceId (src) {
  return (!src || typeof src === 'string') ? src : (src.alias || src.uri)
}
