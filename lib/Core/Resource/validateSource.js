/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { isAbsolute, join } from 'path'
import isUrl from 'is-url'

// 1: mime type, 2: charset, 3: base64, 4: data
const DATA_URI_REGEX = /^data:([\w\/\+\*-]+)?(?:;(?:charset=([\w]+))|;(base64|utf8))?,([\s\S]*)/i

export function prepareSource({src, path, allowRemote = false, allowBase64 = false, allowXML = false}) {
  if (typeof src === 'string') {
    src = { uri: src }
  } else {
    src = { ...src }
  }

  const { uri } = src

  if (typeof uri !== 'string') {
    throw Error('src must contain a "uri" string property contain a file path, data uri or url.')
  }

  if (isAbsolute(uri)) {
    src.type = prepareSource.SOURCE_TYPE_FILE
  } else if (uri.startsWith('file://')) {
    src.uri = uri.replace(/file:\/\//, '')
    src.type = prepareSource.SOURCE_TYPE_FILE
  } else if (uri.startsWith('data:')) {
    const match = uri.match(DATA_URI_REGEX)

    if (!match) {
      throw Error(`src.uri contains a malformed data uri: ${uri}`)
    }

    src.uri = match[4]
    src.type = match[3] ? prepareSource.SOURCE_TYPE_BASE64 : prepareSource.SOURCE_TYPE_XML
  } else if (isUrl(uri)) {
    src.type = 'remote'
  } else {
    src.uri = path ? join(path, uri) : uri
    src.type = prepareSource.SOURCE_TYPE_FILE
  }

  if (!src.alias) {
    src.alias = uri
  }

  if (src.type === prepareSource.SOURCE_TYPE_REMOTE && !allowRemote) {
    throw Error('URL is not allowed as source.')
  }

  if (src.type === prepareSource.SOURCE_TYPE_BASE64 && !allowBase64) {
    throw Error('Base64 is not allowed as source.')
  }

  if (src.type === prepareSource.SOURCE_TYPE_XML && !allowXML) {
    throw Error('XML string is not allowed as source.')
  }

  return src
}

prepareSource.SOURCE_TYPE_REMOTE = 'remote'
prepareSource.SOURCE_TYPE_BASE64 = 'base64'
prepareSource.SOURCE_TYPE_FILE = 'file'
prepareSource.SOURCE_TYPE_XML = 'xml'
