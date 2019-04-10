/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { FastEventEmitter } from '../Util'
import { loadFont } from '../Util/small-screen-lib'
import { FONT_STYLE_ITALIC, FONT_STYLE_NORMAL, FONT_WEIGHT_BOLD, FONT_WEIGHT_NORMAL } from '../Style/Constants'

// Font and FontSample status values.

const STATUS_ERROR = 0
const STATUS_READY = 1
const STATUS_PENDING = 2

// FontStore internal loading signals.

let ON_FONT = 'on-font'
let ON_SAMPLE = 'on-sample'

// family + style (int) + weight (int) => Font
class FontTable extends Map {
  getFamilyTable (family) {
    const weightEntries = [ [FONT_WEIGHT_NORMAL, undefined], [FONT_WEIGHT_BOLD, undefined] ]
    let table = this.get(family)

    if (!table) {
      this.set(family, table = new Map([
        [FONT_STYLE_NORMAL, new Map(weightEntries)],
        [FONT_STYLE_ITALIC, new Map(weightEntries)]
      ]))
    }

    return table
  }
}

// family + style (int) + weight (int) + fontSize (int) => FontSample
class FontSampleTable extends Map {
  getFamilyTable (family) {
    let table = this.get(family)

    if (!table) {
      this.set(family, table = new Map([
        [FONT_STYLE_NORMAL, new Map([ [FONT_WEIGHT_NORMAL, new Map()], [FONT_WEIGHT_BOLD, new Map()] ])],
        [FONT_STYLE_ITALIC, new Map([ [FONT_WEIGHT_NORMAL, new Map()], [FONT_WEIGHT_BOLD, new Map()] ])]
      ]))
    }

    return table
  }
}

function getPendingFont (signal, family, style, weight) {
  return new Promise((resolve, reject) => {
    const listener = (font, err) => {
      if (font.family === family && font.style === style && font.weight === weight) {
        signal.off(ON_FONT, listener)

        if (err) {
          reject(err)
        } else {
          resolve(font)
        }
      }
    }

    signal.on(ON_FONT, listener)
  })
}

function getPendingSample (signal, family, style, weight, fontSize) {
  return new Promise((resolve, reject) => {
    const listener = (sample, err) => {
      if (sample.family === family && sample.style === style && sample.weight === weight && sample.fontSize === fontSize) {
        signal.off(ON_SAMPLE, listener)

        if (err) {
          reject(err)
        } else {
          resolve(sample)
        }
      }
    }

    signal.on(ON_SAMPLE, listener)
  })
}

// TODO: move enum stuff to.. style?

const styleMap = new Map([ ['normal', FONT_STYLE_NORMAL], ['italic', FONT_STYLE_ITALIC] ])
const validStyles = new Set([FONT_STYLE_NORMAL, FONT_STYLE_ITALIC])

function toStyleEnum (style) {
  if (style === undefined) {
    return FONT_STYLE_NORMAL
  }

  if (styleMap.has(style)) {
    return styleMap.get(style)
  }

  throw Error(`Invalid font style value: ${style}`)
}

const weightMap = new Map([ ['normal', FONT_WEIGHT_NORMAL], ['bold', FONT_WEIGHT_BOLD] ])
const validWeights = new Set([FONT_WEIGHT_NORMAL, FONT_WEIGHT_BOLD])

function toWeightEnum (weight) {
  if (weight === undefined) {
    return FONT_WEIGHT_NORMAL
  }

  if (weightMap.has(weight)) {
    return weightMap.get(weight)
  }

  throw Error(`Invalid font weight value: ${weight}`)
}

function validateFamily (family) {
  if (typeof family !== 'string') {
    throw Error(`Font family must be a string. Got ${family}`)
  }
}

function validateFontId (availableFonts, family, style, weight) {
  validateFamily(family)

  if (!availableFonts.has(family)) {
    throw Error(`Font family (${family}) has not been registered.`)
  }

  if (!validStyles.has(style)) {
    throw Error(`Font style must be an integer enum. Got ${style}`)
  }

  if (!validWeights.has(weight)) {
    throw Error(`Font weight must be an integer enum. Got ${weight}`)
  }
}

export class FontStore {
  _fonts = new FontTable()
  _samples = new FontSampleTable()
  _signal = new FastEventEmitter()

  async add (file, family, style, weight) {
    // TODO: accept file or Buffer

    validateFamily(family)
    // style and weight are expected to be strings, convert them to int enums
    style = toStyleEnum(style)
    weight = toWeightEnum(weight)

    const { _fonts, _signal } = this
    const familyTable = _fonts.getFamilyTable(family)

    // Cannot add the same font twice.
    if (familyTable.get(style).get(weight)) {
      throw Error('Font already exists.')
    }

    const tempFont = { family, style, weight, status: STATUS_PENDING }

    // Put the temp font in the table so subsequent callers (samplers) know how to handle this font spec.
    familyTable.get(style).set(weight, tempFont)

    try {
      const font = await loadFont(file)

      // Note: Native layer does not have the font spec, so add it here.
      Object.assign(font, tempFont).status = STATUS_READY

      // Update the table with the new font.
      familyTable.get(style).set(weight, font)

      // Notify listeners of successful load.
      _signal.emit(ON_FONT, font)
    } catch (err) {
      tempFont.status = STATUS_ERROR

      // Notify listeners of error.
      _signal.emit(ON_FONT, tempFont, err)

      // Notify caller of error
      throw Error(err.message)
    }
  }

  async getSample (family, style, weight, fontSize) {
    validateFontId(this._fonts, family, style, weight)

    const { _samples, _signal } = this
    const familyTable = _samples.getFamilyTable(family)
    let sample = familyTable.get(style).get(weight).get(fontSize)

    if (sample) {
      const { status } = sample

      if (status === STATUS_READY) {
        return sample
      }

      if (status === STATUS_PENDING) {
        // wait for sample to finish loading.
        sample = await getPendingSample(_signal, family, style, weight, fontSize)

        if (sample.status === STATUS_READY) {
          return sample
        }
      }

      // status === STATUS_ERROR
      throw Error('Sample failed to load previously.')
    }

    let font = this._fonts.get(family).get(style).get(weight)

    if (!font) {
      // TODO: fallback to another style + weight or a default font
      throw Error(`Font not found for ${family}, style=${style}, weight=${weight}`)
    } else if (font.status === STATUS_READY) {
      // continue with this font.
    } else if (font.status === STATUS_PENDING) {
      // wait for this font to finish loading.
      font = await getPendingFont(_signal, family, style, weight)
    }

    if (font.status === STATUS_ERROR) {
      throw Error('Cannot sample from font that failed to load.')
    }

    const tempSample = { family, style, weight, fontSize, status: STATUS_PENDING }

    // Put the temp sample in the table so subsequent callers know how to handle the same font spec.
    familyTable.get(style).get(weight).set(fontSize, tempSample)

    try {
      sample = await font.createSample(fontSize)

      // Note: native layer does not receive the font spec, so fill it in here.
      Object.assign(sample, tempSample).status = STATUS_READY

      // Put the sample into the sample table
      familyTable.get(style).get(weight).set(fontSize, sample)

      // Notify listeners of successful load.
      _signal.emit(ON_SAMPLE, sample)
    } catch (err) {
      tempSample.status = STATUS_ERROR

      // Notify listeners of error.
      _signal.emit(ON_SAMPLE, tempSample, err)

      // Notify caller of error
      throw Error(err.message)
    }

    return sample
  }
}
