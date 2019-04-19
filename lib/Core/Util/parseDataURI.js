/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

// 1: mime type, 2: charset, 3: base64
import { SourceType } from './SourceType'

let DATA_URI_REGEX = /^data:([\w/+*-]+)?(?:;(charset=([\w]+))|;(base64|utf8))?,/i
let { BASE64, UTF8 } = SourceType

export function parseDataURI (uri) {
  const match = uri && uri.match(DATA_URI_REGEX)

  if (!match) {
    throw Error(`Malformed data uri: ${uri}`)
  }

  let type = match[4]

  if (type) {
    type = type.toLowerCase() === BASE64 ? BASE64 : UTF8
  } else if (!type) {
    if (match[3] && match[3] !== UTF8) {
      throw Error(`Invalid charset = ${match[3]}`)
    }
    type = UTF8
  }

  let data = uri.substr(uri.indexOf(',') + 1)

  if (!data) {
    throw Error(`Data URI does not contain a data section: ${uri}`)
  }

  if (type === UTF8) {
    data = decodeURIComponent(data)
  }

  return [
    type,
    match[1],
    data
  ]
}
