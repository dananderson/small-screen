/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { rgb } from './Core/Style/parseColor'
import { Event } from './Core/Event/Event'
import KeyCode from './Core/Event/KeyCode'
import { Key } from './Core/Input/Key'
import { Easing } from './Core/ThirdParty/Easing'
import { Value } from './Core/Style/Value'
import { Direction } from './Core/Views/Direction'
import { ScreenSaverMode } from './Core/Util/ScreenSaverMode'
import { main } from './Public'
import * as Scene from './Public/Scene'
import * as Lifecycle from './Public/Lifecycle'
import * as Display from './Public/Display'
import * as Animated from './Public/Animated'
import * as Input from './Public/Input'
import * as Resource from './Public/Resource'
import * as Audio from './Public/Audio'
import { BurnInProtection } from './Public/BurnInProtection'
import { Style, StyleSheet, vw, vh, vmin, vmax } from './Public/Style'
import { FocusGroup } from './Public/Components/FocusGroup'

BurnInProtection.enabled = true

export {
  Scene,
  Lifecycle,
  Display,

  Style,
  StyleSheet,

  Animated,
  Audio,
  BurnInProtection,
  Input,
  Resource,
  Event,
  Key,
  KeyCode,
  Easing,
  Value,
  Direction,
  ScreenSaverMode,

  FocusGroup,

  rgb,
  vw,
  vh,
  vmin,
  vmax,

  main
}
