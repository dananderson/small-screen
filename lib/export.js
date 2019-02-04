/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { rgb } from './Core/Style/parseColor'
import KeyCode from './Core/Input/KeyCode'
import { StandardKey } from './Core/Input/StandardKey'
import { Easing } from './Core/ThirdParty/Easing'
import { Value } from './Core/Style/Value'
import { Direction } from './Core/Views/Direction'
import { Mapping } from './Core/Input/Mapping'
import { StandardMapping } from './Core/Input/StandardMapping'
import { main } from './Public/main'
import * as Scene from './Public/Scene'
import * as Lifecycle from './Public/Lifecycle'
import * as Display from './Public/Display'
import * as Animated from './Public/Animated'
import { Input } from './Public/Input'
import * as Resource from './Public/Resource'
import * as Audio from './Public/Audio'
import { BurnInProtection } from './Public/BurnInProtection'
import { Style, StyleSheet, vw, vh, vmin, vmax } from './Public/Style'
import { FocusGroup } from './Public/Components/FocusGroup'

BurnInProtection.enabled = true

export {
  Animated,
  Audio,
  Display,
  Input,
  Lifecycle,
  Resource,
  Scene,
  Style,

  BurnInProtection,

  StandardKey as Key,
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
  vw,
  vh,
  vmin,
  vmax,

  main
}
