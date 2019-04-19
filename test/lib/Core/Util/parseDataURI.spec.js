/*
 * Copyright (C) 2019 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

import { assert } from 'chai'
import { parseDataURI } from '../../../../lib/Core/Util/parseDataURI'

describe('parseDataURI()', () => {
  it('should parse data uri with no mime type and no charset', () => {
    assert.deepEqual(parseDataURI(`data:,${SVG}`), [ 'utf8', undefined, SVG ])
  })
  it('should parse data uri with mime type and utf8 charset', () => {
    assert.deepEqual(parseDataURI(`data:image/svg+xml;utf8,${SVG}`), [ 'utf8', 'image/svg+xml', SVG ])
  })
  it('should parse data uri with mime type, utf8 charset and uri encoded svg', () => {
    assert.deepEqual(parseDataURI(`data:image/svg+xml;utf8,${encodeURIComponent(SVG)}`), [ 'utf8', 'image/svg+xml', SVG ])
  })
  it('should parse data uri with mime type and explicit utf8 charset', () => {
    assert.deepEqual(parseDataURI(`data:image/svg+xml;charset=utf8,${SVG}`), [ 'utf8', 'image/svg+xml', SVG ])
  })
  it('should parse data uri with no mime type and base 64 encoding', () => {
    assert.deepEqual(parseDataURI(`data:;base64,${SVG_BASE64}`), [ 'base64', undefined, SVG_BASE64 ])
  })
  it('should throw Error for an invalid data uri', () => {
    assert.throws(() => parseDataURI(`,${SVG}`))
    assert.throws(() => parseDataURI(`data:&&&,${SVG}`))
    assert.throws(() => parseDataURI(`data:;base128,${SVG}`))
    assert.throws(() => parseDataURI(`data:;charset=utf16,${SVG}`))
    assert.throws(() => parseDataURI(`data:,`))
  })
})

function base64 (str) {
  return Buffer.from(str).toString('base64')
}

const SVG = '<svg/>'
const SVG_BASE64 = base64(SVG)
