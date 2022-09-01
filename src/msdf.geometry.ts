import * as THREE from 'three'
import { MSDFFont } from './msdf.font'
import { newline, whitespace } from './regexp'

function getKernPairOffset(font, id1, id2) {
  for (let i = 0; i < font.kernings.length; i++) {
    const k = font.kernings[i]
    if (k.first < id1) continue
    if (k.second < id2) continue
    if (k.first > id1) return 0
    if (k.first === id1 && k.second > id2) return 0
    return k.amount
  }
  return 0
}

interface MSDFGeometryOptions {
  font?: MSDFFont
  text?: string
  width?: number
  align?: string
  size?: number
  letterSpacing?: number
  lineHeight?: number
  wordSpacing?: number
  wordBreak?: boolean
  
}

export class MSDFGeometry extends THREE.BufferGeometry {
  font: any
  text: string
  width: number
  align: string
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
    align = 'left',
    size = 1,
    letterSpacing = 0,
    lineHeight = 1.4,
    wordSpacing = 0,
    wordBreak = false,
  }: MSDFGeometryOptions = {}) {
    super()
    this.font = font
    this.text = text
    this.width = width
    this.align = align
    this.size = size
    this.letterSpacing = letterSpacing
    this.lineHeight = lineHeight
    this.wordSpacing = wordSpacing
    this.wordBreak = wordBreak
    this.textScale = this.size / this.font.common.baseline

    this.generateGeometry()
  }

  private generateGeometry() {
    // Strip spaces and newlines to get actual character length for buffers
    const chars = this.text.replace(/[ \n]/g, '')
    const numChars = chars.length

    // Create output buffers
    const buffers = {
      position: new Float32Array(numChars * 4 * 3),
      uv: new Float32Array(numChars * 4 * 2),
      id: new Float32Array(numChars * 4),
      index: new Uint16Array(numChars * 6),
    }

    this.setAttribute('position', new THREE.BufferAttribute(new Float32Array(numChars * 4 * 3), 3))
    this.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(numChars * 4 * 2), 2))
    this.setAttribute('id', new THREE.BufferAttribute(new Float32Array(numChars * 4), 1))
    this.setAttribute('index', new THREE.BufferAttribute(new Float32Array(numChars * 4), 1))

    // Set values for buffers that don't require calculation
    for (let i = 0; i < numChars; i++) {
      buffers.id.set([i, i, i, i], i * 4)
      buffers.index.set(
        [i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3],
        i * 6,
      )
    }

    this.generateLayout()
  }

  generateLayout() {
    const lines = []

    let cursor = 0

    let wordCursor = 0
    let wordWidth = 0
    let line = newLine()

    function newLine() {
      const line = {
        width: 0,
        glyphs: [],
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

      const glyph = this.font.glyphs[char] || this.font.glyphs[' ']

      // Find any applicable kern pairs
      if (line.glyphs.length) {
        const prevGlyph = line.glyphs[line.glyphs.length - 1][0]
        const kern = getKernPairOffset(this.font, glyph.id, prevGlyph.id) * this.textScale
        line.width += kern
        wordWidth += kern
      }

      // add char to line
      line.glyphs.push([glyph, line.width])

      // calculate advance for next glyph
      let advance = 0

      // If whitespace, update location of current word for line breaks
      if (whitespace.test(char)) {
        wordCursor = cursor
        wordWidth = 0

        // Add wordspacing
        advance += this.wordSpacing * this.size
      } else {
        // Add letterspacing
        advance += this.letterSpacing * this.size
      }

      advance += glyph.xadvance * this.textScale

      line.width += advance
      wordWidth += advance

      // If width defined
      if (line.width > this.width) {
        // If can break words, undo latest glyph if line not empty and create new line
        if (this.wordBreak && line.glyphs.length > 1) {
          line.width -= advance
          line.glyphs.pop()
          line = newLine()
          continue

          // If not first word, undo current word and cursor and create new line
        } else if (!this.wordBreak && wordWidth !== line.width) {
          const numGlyphs = cursor - wordCursor + 1
          line.glyphs.splice(-numGlyphs, numGlyphs)
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

    this.populateBuffers(lines)
  }

  populateBuffers(lines) {
    const texW = this.font.common.scaleW
    const texH = this.font.common.scaleH

    // For all fonts tested, a little offset was needed to be right on the baseline, hence 0.07.
    let y = 0.07 * this.size
    let j = 0

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]

      for (let i = 0; i < line.glyphs.length; i++) {
        const glyph = line.glyphs[i][0]
        let x = line.glyphs[i][1]

        if (this.align === 'center') {
          x -= line.width * 0.5
        } else if (this.align === 'right') {
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

        const u = glyph.x / texW
        const uw = glyph.width / texW
        const v = 1.0 - glyph.y / texH
        const vh = glyph.height / texH
        ;(this.attributes.uv.array as Float32Array).set([u, v - vh, u, v, u + uw, v - vh, u + uw, v], j * 4 * 2)

        // Reset cursor to baseline
        y += glyph.yoffset * this.textScale

        j++
      }

      y -= this.size * this.lineHeight
    }

    this.lineCount = lines.length
    this.computedHeight = this.lineCount * this.size * this.lineHeight
    this.computedWidth = Math.max(...lines.map(line => line.width))
  }

  // Update buffers to layout with new layout
  resize(width: number) {
    this.width = width;
    this.generateGeometry()
  }

  // Completely change text (like creating new Text)
  updateText(text) {
    this.text = text;
    this.generateGeometry()
  }
}
