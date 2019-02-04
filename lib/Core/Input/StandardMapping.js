/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { Mapping } from './Mapping'
import { StandardKey } from './StandardKey'
import { Direction } from '../Views/Direction'

export class StandardMapping extends Mapping {
  static NAME = 'standard'

  static DIRECTION = new Map([
    [ StandardKey.LEFT, Direction.LEFT ],
    [ StandardKey.RIGHT, Direction.RIGHT ],
    [ StandardKey.UP, Direction.UP ],
    [ StandardKey.DOWN, Direction.DOWN ],
    [ StandardKey.LS_LEFT, Direction.LEFT ],
    [ StandardKey.LS_RIGHT, Direction.RIGHT ],
    [ StandardKey.LS_UP, Direction.UP ],
    [ StandardKey.LS_DOWN, Direction.DOWN ]
  ])

  constructor (entries) {
    super(StandardMapping.NAME, entries)
  }
}
