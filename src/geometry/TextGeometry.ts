import * as THREE from 'three'
import { Line } from './types'
import { Font, FontChar, FontDefinition } from '../font'
import { newline, whitespace } from '../utils/regexp'
import { getKernPairOffset } from './getKernPairOffset'

export interface ExtraAttributeOptions {
  uv?: boolean
  charPosition?: boolean
  lineIndex?: boolean
  charIndex?: boolean
  wordIndex?: boolean
  lineCharIndex?: boolean
  lineWordIndex?: boolean
  lineWordCount?: boolean
  lineCharCount?: boolean
}

export interface TextGeometryOptions extends ExtraAttributeOptions {
  font?: Font | FontDefinition
  text?: string
  width?: number
  alignX?: string
  alignY?: string
  size?: number
  letterSpacing?: number
  lineHeight?: number
  wordSpacing?: number
  wordBreak?: boolean
}

export class TextGeometry extends THREE.BufferGeometry {
  font: Font
  text: string
  width: number
  alignX: string
  alignY: string
  size: number
  letterSpacing: number
  lineHeight: number
  wordSpacing: number
  wordBreak: boolean
  textScale: number
  computedWidth: number
  computedHeight: number
  lineCount: number

  constructor({
    font,
    text,
    width = Infinity,
    alignX = 'left',
    alignY = 'top',
    size = 1,
    letterSpacing = 0,
    lineHeight = 1.4,
    wordSpacing = 0,
    wordBreak = false,
    uv = false,
    charPosition = false,
    lineIndex = false,
    charIndex = false,
    wordIndex = false,
    lineCharIndex = false,
    lineWordIndex = false,
    lineWordCount = false,
    lineCharCount = false,
  }: TextGeometryOptions = {}) {
    super()
    this.font = font instanceof Font ? font : new Font(font)
    this.text = text
    this.width = width
    this.alignX = alignX
    this.alignY = alignY
    this.size = size
    this.letterSpacing = letterSpacing
    this.lineHeight = lineHeight
    this.wordSpacing = wordSpacing
    this.wordBreak = wordBreak
    this.textScale =
      this.size / (this.font.common.baseline || this.font.common.base)

    this.computeGeometry({
      uv,
      charPosition,
      lineIndex,
      charIndex,
      wordIndex,
      lineCharIndex,
      lineWordIndex,
      lineWordCount,
      lineCharCount,
    })
  }

  private computeGeometry({
    uv,
    charPosition,
    lineIndex,
    charIndex,
    wordIndex,
    lineCharIndex,
    lineWordIndex,
    lineWordCount,
    lineCharCount
  }: ExtraAttributeOptions = {}) {
    // Strip spaces and newlines to get actual character length for buffers
    const chars = this.text.replace(/[ \n]/g, '')
    const numChars = chars.length

    // Create output buffers
    this.setAttribute(
      'position',
      new THREE.BufferAttribute(new Float32Array(numChars * 4 * 3), 3),
    )
    this.setAttribute(
      'charUv',
      new THREE.BufferAttribute(new Float32Array(numChars * 4 * 2), 2),
    )
    if (charPosition)
      this.setAttribute(
        'charPosition',
        new THREE.BufferAttribute(new Float32Array(numChars * 4 * 3), 3),
      )
    if (uv)
      this.setAttribute(
        'uv',
        new THREE.BufferAttribute(new Float32Array(numChars * 4 * 2), 2),
      )

    if (lineIndex) {
      this.setAttribute(
        'lineIndex',
        new THREE.BufferAttribute(new Float32Array(numChars * 4), 1),
      )
    }

    if (charIndex) {
      this.setAttribute(
        'charIndex',
        new THREE.BufferAttribute(new Float32Array(numChars * 4), 1),
      )
    }

    if (wordIndex) {
      this.setAttribute(
        'wordIndex',
        new THREE.BufferAttribute(new Float32Array(numChars * 4), 1),
      )
    }

    if (lineCharIndex) {
      this.setAttribute(
        'lineCharIndex',
        new THREE.BufferAttribute(new Float32Array(numChars * 4), 1),
      )
    }

    if (lineWordIndex) {
      this.setAttribute(
        'lineWordIndex',
        new THREE.BufferAttribute(new Float32Array(numChars * 4), 1),
      )
    }

    if (lineWordCount) {
      this.setAttribute(
        'lineWordCount',
        new THREE.BufferAttribute(new Float32Array(numChars * 4), 1),
      )
    }

    if (lineCharCount) {
      this.setAttribute(
        'lineCharCount',
        new THREE.BufferAttribute(new Float32Array(numChars * 4), 1),
      )
    }

    this.setAttribute(
      'id',
      new THREE.BufferAttribute(new Float32Array(numChars * 4), 1),
    )

    const indexArray = new Uint32Array(numChars * 6)

    // Set values for buffers that don't require calculation
    for (let i = 0; i < numChars; i++) {
      ;(this.attributes.id.array as Float32Array).set([i, i, i, i], i * 4)
      indexArray.set(
        [i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3],
        i * 6,
      )
    }

    if (uv) {
      this.boundingBox = new THREE.Box3()
    }

    this.setIndex(Array.from(indexArray))

    this.computeLayout()
  }

  computeLayout() {
    const lines = []
    let cursor = 0

    let wordCursor = 0
    let wordWidth = 0
    let line = newLine()

    function newLine(): Line {
      const line = {
        index: lines.length,
        width: 0,
        chars: [],
      }
      lines.push(line)
      wordCursor = cursor
      wordWidth = 0
      return line
    }

    const maxTimes = 100
    let count = 0
    while (cursor < this.text.length && count < maxTimes) {
      count++

      const char = this.text[cursor]

      // Skip whitespace at start of line
      if (!line.width && whitespace.test(char)) {
        cursor++
        wordCursor = cursor
        wordWidth = 0
        continue
      }

      // If newline char, skip to next line
      if (newline.test(char)) {
        cursor++
        line = newLine()
        continue
      }

      const charDef: FontChar =
        this.font.indexedChar[char] || this.font.indexedChar[' ']

      if (!charDef) {
        throw new Error(`Missing glyph "${char}"`)
      }

      // Find any applicable kern pairs
      if (line.chars.length && charDef) {
        const prevGlyph = line.chars[line.chars.length - 1].definition
        const kern =
          getKernPairOffset(this.font, charDef.id || 0, prevGlyph.id) *
          this.textScale
        line.width += kern
        wordWidth += kern
      }

      // // add char to line
      line.chars.push({
        definition: charDef,
        x: line.width,
        y: 0,
        lineIndex: line.index,
        lineCharIndex: line.chars.length,
      })
      // // calculate advance for next glyph
      let advance = 0

      // // If whitespace, update location of current word for line breaks
      if (whitespace.test(char)) {
        wordCursor = cursor
        wordWidth = 0

        // Add wordspacing
        advance += this.wordSpacing * this.size
      } else {
        // Add letterspacing
        advance += this.letterSpacing * this.size
      }

      advance += charDef.xadvance * this.textScale

      line.width += advance
      wordWidth += advance

      // If width defined
      if (line.width > this.width) {
        // If can break words, undo latest glyph if line not empty and create new line
        if (this.wordBreak && line.chars.length > 1) {
          line.width -= advance
          line.chars.pop()
          line = newLine()
          continue

          // If not first word, undo current word and cursor and create new line
        } else if (!this.wordBreak && wordWidth !== line.width) {
          const numGlyphs = cursor - wordCursor + 1
          line.chars.splice(-numGlyphs, numGlyphs)
          cursor = wordCursor
          line.width -= wordWidth
          line = newLine()
          continue
        }
      }

      cursor++
      // Reset infinite loop catch
      count = 0
    }

    // Remove last line if empty
    if (!line.width) lines.pop()

    this.lineCount = lines.length
    this.computedHeight = this.lineCount * this.size * this.lineHeight
    this.computedWidth = Math.max(...lines.map(line => line.width))

    this.populateBuffers(lines)
  }

  populateBuffers(lines: Line[]) {
    const texW = this.font.common.scaleW
    const texH = this.font.common.scaleH

    const cH = this.computedHeight
    const cW = this.computedWidth

    // For all fonts tested, a little offset was needed to be right on the baseline, hence 0.07.
    let y = 0.07 * this.size,
      x = 0

    if (this.alignY === 'center') {
      y += this.computedHeight / 2
    } else if (this.alignY === 'bottom') {
      y += this.computedHeight
    }

    let j = 0
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]

      for (let i = 0; i < line.chars.length; i++) {
        const glyph = line.chars[i].definition
        x = line.chars[i].x

        if (this.alignX === 'center') {
          x -= line.width * 0.5
        } else if (this.alignX === 'right') {
          x -= line.width
        }

        // If space, don't add to geometry
        if (whitespace.test(glyph.char)) continue

        // Apply char sprite offsets
        x += glyph.xoffset * this.textScale
        y -= glyph.yoffset * this.textScale

        // each letter is a quad. axis bottom left
        const w = glyph.width * this.textScale
        const h = glyph.height * this.textScale
        ;(this.attributes.position.array as Float32Array).set(
          [x, y - h, 0, x, y, 0, x + w, y - h, 0, x + w, y, 0],
          j * 4 * 3,
        )

        if (this.hasCharPosition) {
          ;(this.attributes.charPosition.array as Float32Array).set(
            [x, y - h, 0, x, y, 0, x + w, y - h, 0, x + w, y, 0],
            j * 4 * 3,
          )
        }

        if (this.attributes.uv) {
          ;(this.attributes.uv.array as Float32Array).set(
            [
              x / cW,
              1 - (y - h) / -cH,
              x / cW,
              1 - y / -cH,
              (x + w) / cW,
              1 - (y - h) / -cH,
              (x + w) / cW,
              1 - y / -cH,
            ],
            j * 4 * 2,
          )
        }

        const u = glyph.x / texW
        const uw = glyph.width / texW
        const v = 1.0 - glyph.y / texH
        const vh = glyph.height / texH
        ;(this.attributes.charUv.array as Float32Array).set(
          [u, v - vh, u, v, u + uw, v - vh, u + uw, v],
          j * 4 * 2,
        )

        if (this.hasCharPosition) {
          ;(this.attributes.charPosition.array as Float32Array).set(
            [u, v - vh, u, v, u + uw, v - vh, u + uw, v],
            j * 4 * 3,
          )  
        }

        // Reset cursor to baseline
        y += glyph.yoffset * this.textScale

        j++
      }

      y -= this.size * this.lineHeight
    }
  }

  /**
   * Update buffers with new layout
   */
  resize(width: number) {
    this.width = width
    this.computeGeometry()
  }

  /**
   * Update text and re-compute geometry (like creating new Text)
   */

  updateText(text) {
    this.text = text
    this.computeGeometry()
  }

  get hasCharPosition() {
    return !!this.attributes.charPosition
  }
}
