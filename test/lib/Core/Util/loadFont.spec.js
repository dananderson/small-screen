/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { loadFont } from '../../../../lib/Core/Util/small-screen-lib'
import { isRejected } from '../../../isRejected'

const TTF = 'test/resources/OpenSans-Regular.ttf'
const TTC = 'test/resources/sample_font_collection.ttc'

describe('loadFont', () => {
  it('should load TrueType Font Collection', async () => {
    const fonts = await loadFont(TTC)

    assert.equal(fonts.length, 2)
    assert.equal(fonts[0].index, 0)
    assert.equal(fonts[1].index, 1)
  })
  it('should load sample from TrueType Font Collection', async () => {
    const fonts = await loadFont(TTC)
    const sample = await fonts[0].createSample(14)

    assert.equal(Object.getPrototypeOf(sample).constructor.name, 'StbFontSample')
  })
  it('should load TrueType Font', async () => {
    const fonts = await loadFont(TTF)

    assert.equal(fonts.length, 1)
    assert.equal(fonts[0].index, 0)

    const sample = await fonts[0].createSample(14)

    assert.equal(Object.getPrototypeOf(sample).constructor.name, 'StbFontSample')
  })
  it('should load sample TrueType Font', async () => {
    const fonts = await loadFont(TTF)
    const sample = await fonts[0].createSample(14)

    assert.equal(Object.getPrototypeOf(sample).constructor.name, 'StbFontSample')
  })
  it('should throw Error for file not found', async () => {
    await isRejected(loadFont('file.ttf'))
  })
  it('should throw Error for non-font file', async () => {
    await isRejected(loadFont('test/resources/one.png'))
  })
})
