/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { format } from 'util'

const GUID = /([a-f0-9]{8})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{4})([a-f0-9]{12})/i

export function toUUID (guid) {
  const match = GUID.exec(guid)

  return match ? format('%s-%s-%s-%s-%s', match[1], match[2], match[3], match[4], match[5]).toLowerCase() : undefined
}
