import type { Line } from './types'
import { BufferGeometry, BufferAttribute } from 'three'
import { Font, FontChar, FontDefinition } from '../font'
import { newline, whitespace } from '../utils/regexp'
import { getKernPairOffset } from './getKernPairOffset'

const attributesDefinitions = {
  id: { size: 1, default: true },
  position: { size: 3, default: true },
  charUv: { size: 2, default: true },
  uv: { size: 2, default: false },
  charPosition: { size: 3, default: false },
  normal: { size: 3, default: false },
  lineIndex: { size: 1, default: false },
  charIndex: { size: 1, default: false },
  wordIndex: { size: 1, default: false },
  lineCharIndex: { size: 1, default: false },
  lineWordIndex: { size: 1, default: false },
  lineWordCount: { size: 1, default: false },
  lineCharCount: { size: 1, default: false },
}

type Attribute = keyof typeof attributesDefinitions
export type ExtraAttributeOptions = Partial<Record<Attribute, boolean>>

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

export class TextGeometry extends BufferGeometry {
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
  recordedAttributes: Record<Attribute, boolean>

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
    ...attributes
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

    this.recordedAttributes = (
      Object.keys(attributesDefinitions) as Attribute[]
    ).reduce((acc, value) => {
      const isGenerated =
        attributesDefinitions[value].default || attributes[value]
      acc[value] = isGenerated
      return acc
    }, {} as Record<Attribute, boolean>)

    this.computeGeometry()
  }

  private computeGeometry() {
    // Strip spaces and newlines to get actual character length for buffers
    const attr = this.recordedAttributes
    const chars = this.text.replace(/[ \n]/g, '')
    const numChars = chars.length

    // Create output buffers
    Object.keys(attr).forEach((name) => {
      if (attr[name]) {
        const size = attributesDefinitions[name].size
        this.setAttribute(
          name,
          new BufferAttribute(new Float32Array(numChars * 4 * size), size),
        )
      }
    })

    const indexArray = new Uint32Array(numChars * 6)

    // Set values for buffers that don't require calculation
    for (let i = 0; i < numChars; i++) {
      ;(this.attributes.id.array as Float32Array).set([i, i, i, i], i * 4)
      indexArray.set(
        [i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3],
        i * 6,
      )
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
    this.computedWidth = Math.max(...lines.map((line) => line.width))

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
    let yUnit, xUnit

    let offsetHeight = 0
    if (this.alignY === 'center') {
      offsetHeight = this.computedHeight / 2
    } else if (this.alignY === 'bottom') {
      offsetHeight = this.computedHeight
    }

    y += offsetHeight

    let j = 0

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const normalizedY = y - offsetHeight

      for (let i = 0; i < line.chars.length; i++) {
        const glyph = line.chars[i].definition

        // each letter is a quad. axis bottom left
        const w = glyph.width * this.textScale
        const h = glyph.height * this.textScale

        x = line.chars[i].x

        // If space, don't add to geometry
        if (whitespace.test(glyph.char)) continue

        // Apply char sprite offsets
        x += glyph.xoffset * this.textScale
        y -= glyph.yoffset * this.textScale

        xUnit = x
        if (this.alignX === 'center') {
          xUnit = cW * 0.5 - line.width * 0.5 + x
          x -= line.width * 0.5
        } else if (this.alignX === 'right') {
          xUnit = cW - line.width + x
          x -= line.width
        }

        const u = glyph.x / texW
        const uw = glyph.width / texW
        const v = 1.0 - glyph.y / texH
        const vh = glyph.height / texH

        if (this.recordedAttributes.uv) {
          ;(this.attributes.uv.array as Float32Array).set(
            [
              xUnit / cW,
              1 - (normalizedY - h) / -cH,
              xUnit / cW,
              1 - normalizedY / -cH,
              (xUnit + w) / cW,
              1 - (normalizedY - h) / -cH,
              (xUnit + w) / cW,
              1 - normalizedY / -cH,
            ],
            j * 4 * 2,
          )
        }

        ;(this.attributes.position.array as Float32Array).set(
          [x, y - h, 0, x, y, 0, x + w, y - h, 0, x + w, y, 0],
          j * 4 * 3,
        )

        if (this.recordedAttributes.charPosition) {
          ;(this.attributes.charPosition.array as Float32Array).set(
            [x, y - h, 0, x, y, 0, x + w, y - h, 0, x + w, y, 0],
            j * 4 * 3,
          )
        }

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

        if (this.attributes.normal) {
          ;(this.attributes.normal.array as Float32Array).set(
            [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
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
