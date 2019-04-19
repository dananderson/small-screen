/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { format } from 'util'

let GUID = /([a-f0-9]{8})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{12})/
let GUID_FMT = '%s-%s-%s-%s-%s'

export function toUUID (guid) {
  if (typeof guid === 'string') {
    const match = GUID.exec(guid.toLowerCase())

    if (match) {
      return format(GUID_FMT, match[1], match[2], match[3], match[4], match[5])
    }
  }
}
