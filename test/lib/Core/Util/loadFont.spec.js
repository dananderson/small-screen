/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { loadFont } from '../../../../lib/Core/Util/small-screen-lib'

const TTF = 'test/resources/OpenSans-Regular.ttf'
const TTC = 'test/resources/sample_font_collection.ttc'

describe('loadFont', () => {
  it('should load TrueType Font Collection', async () => {
    const font = await loadFont(TTC)

    assert.equal(font.count, 2)
  })
  it('should load sample from TrueType Font Collection', async () => {
    const font = await loadFont(TTC)
    const sample = await font.createSample(14)

    assert.equal(Object.getPrototypeOf(sample).constructor.name, 'StbFontSample')
  })
  it('should load TrueType Font', async () => {
    const font = await loadFont(TTF)

    assert.equal(font.count, 1)

    const sample = await font.createSample(14)

    assert.equal(Object.getPrototypeOf(sample).constructor.name, 'StbFontSample')
  })
  it('should load sample TrueType Font', async () => {
    const font = await loadFont(TTF)
    const sample = await font.createSample(14)

    assert.equal(Object.getPrototypeOf(sample).constructor.name, 'StbFontSample')
  })
  it('should throw Error for file not found', async () => {
    try {
      await loadFont('file.ttf')
    } catch (err) {
      return
    }

    assert.fail('Expected exception.')
  })
})
