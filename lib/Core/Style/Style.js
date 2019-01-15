/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { parseColor } from './parseColor'

export function Style(style) {
  if (!(this instanceof Style)) {
    return new Style(style);
  }

  if (style) {
    if (!Array.isArray(style)) {
      ARRAY[0] = style
      style = ARRAY
    }

    for (const obj of style) {
      for (const key in obj) {
        const value = obj[key]
        if (value !== undefined) {
          this[key] = value
        }
      }
    }

    for (const key of TRANSKEYS) {
      const value = this[key]

      if (value !== undefined) {
        this[key] = TRANS[key](value)
      }
    }
  }
}

Style.EMPTY = new Style()

Style.prototype = {
  // YogaNode properties

  alignItems: undefined,
  alignContent: undefined,
  alignSelf: undefined,
  border: undefined,
  borderLeft: undefined,
  borderTop: undefined,
  borderRight: undefined,
  borderBottom: undefined,
  display: undefined,
  flex: undefined,
  flexBasis: undefined,
  flexGrow: undefined,
  flexShrink: undefined,
  flexWrap: undefined,
  flexDirection: undefined,
  height: undefined,
  justifyContent: undefined,
  margin: undefined,
  marginLeft: undefined,
  marginTop: undefined,
  marginRight: undefined,
  marginBottom: undefined,
  maxHeight: undefined,
  maxWidth: undefined,
  minHeight: undefined,
  minWidth: undefined,
  overflow: undefined,
  padding: undefined,
  paddingLeft: undefined,
  paddingTop: undefined,
  paddingRight: undefined,
  paddingBottom: undefined,
  left: undefined,
  top: undefined,
  right: undefined,
  bottom: undefined,
  position: undefined,
  width: undefined,

  // RenderingContext properties

  color: undefined,
  borderColor: undefined,
  backgroundColor: undefined,
  tintColor: undefined,
  lineHeight: undefined,
  textAlign: undefined,
  fontFamily: undefined,
  fontSize: undefined,
}

const ARRAY = [ Style.EMPTY ]
const TRANS = {
  color: parseColor,
  borderColor: parseColor,
  backgroundColor: parseColor,
  tintColor: parseColor,
}
const TRANSKEYS = Object.keys(TRANS)
