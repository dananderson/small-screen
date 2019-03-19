/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import KeyCode from './Core/Input/KeyCode'
import { StandardKey } from './Core/Input/StandardKey'
import { Easing } from './Core/ThirdParty/Easing'
import { Value } from './Core/Style/Value'
import { Direction } from './Core/Views/Direction'
import { Mapping } from './Core/Input/Mapping'
import { StandardMapping } from './Core/Input/StandardMapping'
import { init } from './Public'
import { main } from './Public/main'
import { Application } from './Public/Application'
import { Display } from './Public/Display'
import { Animated } from './Public/Animated'
import { Input } from './Public/Input'
import { Resource } from './Public/Resource'
import { Audio } from './Public/Audio'
import { BurnInProtection } from './Public/BurnInProtection'
import { Style, StyleSheet, vw, vh, vmin, vmax, rgb, rgba } from './Public/Style'
import { FocusGroup } from './Public/Components/FocusGroup'

init()
BurnInProtection.setEnabled(true)

export {
  Animated,
  Application,
  Audio,
  Display,
  Input,
  Resource,
  Style,

  BurnInProtection,

  StandardKey as Key, // TODO: remove
  StandardKey,
  KeyCode,
  Mapping,
  StandardMapping,
  Easing,
  Value,
  Direction,
  StyleSheet,

  FocusGroup,

  rgb,
  rgba,
  vw,
  vh,
  vmin,
  vmax,

  main
}
