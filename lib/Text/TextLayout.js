/*
 * Copyright (C) 2018 Daniel Anderson
 *
 * This source code is licensed under the MIT license found in the LICENSE file in the root directory of this source tree.
 */

const max = (a, b) => (a > b) ? a : b

export class TextLayout {
  constructor (text) {
    this._text = text
  }

  render (metrics, width, height, maxNumberOfLines) {
    // TODO: height comparison is not quite right here..
    if (this._cache && this._cache.fontId === metrics.fontId && this._cache.widthConstraint === width &&
      this._cache.height <= height) {
      return this._cache
    }

    const lineOffset = []
    const stream = []
    let prevC = 0
    let cursor = 0
    let xadvance, glyph
    let maxWidth = 0
    let charCode

    for (const char of this._text) {
      charCode = char.charCodeAt(0)
      glyph = metrics.glyph[charCode] || metrics.glyph[63] /* ? */
      xadvance = glyph.xadvance + (metrics.kerning[prevC << 8 | charCode] || 0)

      if (cursor + xadvance > width) {
        const lineNum = lineOffset.length + 1

        // TODO: consider the height constraint..

        if (lineNum < maxNumberOfLines) {
          const result = this._insertLineBreak(stream, cursor)

          cursor = result.cursor
          maxWidth = max(result.lastCursor, maxWidth)
          this._pushLineOffset(lineOffset, width - result.lastCursor)
        } else {
          cursor = this._ellipsize(stream, cursor, metrics, width)
          break
        }
      }

      stream.push(glyph.id)
      stream.push(xadvance)

      cursor += xadvance
      prevC = charCode
    }

    this._pushLineOffset(lineOffset, width - cursor)

    this._cache = {
      stream,
      fontId: metrics.fontId,
      widthConstraint: width,
      heightConstraint: height,
      width: max(cursor, maxWidth),
      height: lineOffset.length * metrics.lineHeight,
      lineOffset
    }

    return this._cache
  }

  _pushLineOffset (lineOffset, offset) {
    // 0 - left
    // 1 - right
    // 2 - center
    lineOffset.push([0, offset, offset / 2])
  }

  _insertLineBreak (stream, cursor) {
    let i, id
    let back = 0

    // walk backwards until the first space and replace that character with a newline
    // if a newline is hit or the beginning of the stream is hit, just insert a newline at the end of the stream
    // and continue
    for (i = stream.length - 1; i >= 0; i -= 2) {
      id = stream[i - 1]

      if (id === 32) {
        // XXX: could be more spaces.. but this works for the common use case
        stream[i - 1] = 10
        stream[i] = 0
        break
      } else if (id === 10) {
        i = -1
        break
      }

      back += stream[i]
    }

    if (i < 0) {
      stream.push(10)
      stream.push(0)
      return { cursor: 0, lastCursor: cursor }
    } else {
      return { cursor: back, lastCursor: cursor - back }
    }
  }

  _ellipsize (stream, cursor, metrics, width) {
    const ellipsisGlyph = metrics.glyph[46] /* . */
    const ellipsisWidth = ellipsisGlyph.xadvance * 3

    // ellipsis will not fit
    if (ellipsisWidth >= width) {
      return cursor
    }

    let xadvance, id
    let moved = false

    // remove characters from the stream until the ellipsis fits
    while (width - cursor <= ellipsisWidth) {
      xadvance = stream.pop()
      id = stream.pop()

      // hit a line break.. bail
      // TODO: can produce \n...
      if (id === 10) {
        break
      }

      cursor -= xadvance
      moved = true
    }

    // add ellipsis if there is space
    if (moved && (width - cursor) >= ellipsisWidth) {
      for (let i = 0; i < 3; i++) {
        stream.push(ellipsisGlyph.id)
        stream.push(ellipsisGlyph.xadvance)
      }

      return (cursor + ellipsisWidth)
    } else {
      return cursor
    }
  }
}
