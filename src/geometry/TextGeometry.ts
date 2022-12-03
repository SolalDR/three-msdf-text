import { BufferGeometry, BufferAttribute, Box3, PlaneGeometry } from 'three'
import type { Line } from './types'
import { Font, FontChar, FontDefinition } from '../font'
import { newline, whitespace } from '../utils/regexp'
import { getKernPairOffset } from './getKernPairOffset'

const attributesDefinitions = {
  id: { size: 1, default: true },
  position: { size: 3, default: true },
  charUv: { size: 2, default: true },
  uv: { size: 2, default: false },
  normal: { size: 3, default: false },
  charPosition: { size: 3, default: false },
  lineIndex: { size: 1, default: false },
  charIndex: { size: 1, default: false },
  charSize: { size: 2, default: false },
  wordIndex: { size: 1, default: false },
  lineCharIndex: { size: 1, default: false },
  lineWordIndex: { size: 1, default: false },
  lineWordCount: { size: 1, default: false },
  lineCharCount: { size: 1, default: false },
}

type Attribute = keyof typeof attributesDefinitions
type AlignX = 'left' | 'right' | 'center'
type AlignY = 'top' | 'bottom' | 'center'

export type ExtraAttributeOptions = Partial<Record<Attribute, boolean>>

export interface TextGeometryOptions extends ExtraAttributeOptions {
  font?: Font | FontDefinition
  text?: string
  width?: number | 'auto'
  height?: number | 'auto'
  alignX?: AlignX
  alignY?: AlignY
  size?: number
  letterSpacing?: number
  lineHeight?: number
  wordSpacing?: number
  wordBreak?: boolean
  lineBreak?: boolean
  widthSegments?: number
  heightSegments?: number
}

export class TextGeometry extends BufferGeometry {
  private textScale: number
  private charGeometry?: PlaneGeometry

  font: Font
  text: string
  width: number | 'auto'
  height: number | 'auto'
  alignX: AlignX
  alignY: AlignY
  _size: number
  letterSpacing: number
  lineHeight: number
  wordSpacing: number
  wordBreak: boolean
  lineBreak: boolean
  computedWidth: number
  computedHeight: number
  lineCount: number
  recordedAttributes: Record<Attribute, boolean>

  constructor({
    font,
    text,
    width = 'auto',
    height = 'auto',
    alignX = 'left',
    alignY = 'top',
    size = 1,
    letterSpacing = 0,
    lineHeight = 1,
    wordSpacing = 0,
    wordBreak = false,
    lineBreak = true,
    widthSegments = 1,
    heightSegments = 1,
    ...attributes
  }: TextGeometryOptions = {}) {
    super()
    this.font = font instanceof Font ? font : new Font(font)
    this.text = text
    this.width = width
    this.height = height
    this.alignX = alignX
    this.alignY = alignY
    this.size = size
    this.letterSpacing = letterSpacing
    this.lineHeight = lineHeight
    this.wordSpacing = wordSpacing
    this.wordBreak = wordBreak
    this.lineBreak = lineBreak
    this.charGeometry = new PlaneGeometry(1, 1, widthSegments, heightSegments)

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

  get size() {
    return this._size
  }

  set size(value: number) {
    this._size = value
    this.textScale =
      this._size /
      (this.font.common.lineHeight ||
        this.font.common.baseline ||
        this.font.common.base)
  }

  /**
   * Allocate attributes buffer, compute geometry indexes
   */
  private computeGeometry() {
    // Strip spaces and newlines to get actual character length for buffers
    const chars = this.text.replace(/[ \n]/g, '')
    const attr = this.recordedAttributes
    const cc = chars.length // char count
    const vcc = this.charGeometry.attributes.position.count // vertices per char count
    const icc = this.charGeometry.index.count // indexes per char count
    const indexArray = new Uint32Array(cc * icc)

    // Create output buffers
    Object.keys(attr).forEach((name) => {
      if (attr[name]) {
        const size = attributesDefinitions[name].size
        this.setAttribute(
          name,
          new BufferAttribute(new Float32Array(cc * vcc * size), size),
        )
      }
    })

    // Set values for buffers that don't require calculation
    for (let i = 0; i < cc; i++) {
      if (this.charGeometry) {
        const ids = new Array(vcc)
        for (let j = 0, l = ids.length; j < l; j++) ids[j] = i
        ;(this.attributes.id.array as Float32Array).set(ids, i * vcc)

        const indexes = new Array(icc)
        for (let j = 0, l = indexes.length; j < l; j++)
          indexes[j] = i * vcc + this.charGeometry.index.array[j]
        indexArray.set(indexes, i * icc)
        continue
      }

      // Unique id for each char
      ;(this.attributes.id.array as Float32Array).set([i, i, i, i], i * 4)

      // Geometry index
      indexArray.set(
        [i * 4, i * 4 + 2, i * 4 + 1, i * 4 + 1, i * 4 + 2, i * 4 + 3],
        i * 6,
      )
    }

    this.setIndex(Array.from(indexArray))

    const lines = this.computeLayout()
    this.populateBuffers(lines)
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

      // Detect \n char
      if (newline.test(char)) {
        cursor++
        line = newLine()
        continue
      }

      // Skip whitespace at start of line
      if (!line.width && whitespace.test(char)) {
        cursor++
        wordCursor = cursor
        wordWidth = 0
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

      // If strict width defined
      if (this.width !== 'auto' && line.width > this.width && this.lineBreak) {
        // If can break words, undo latest glyph if line not empty. Then create new line
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

    // Compute boundaries
    this.computedHeight = this.lineCount * this.size * this.lineHeight
    this.computedWidth = Math.max(...lines.map((line) => line.width))

    return lines
  }

  populateBuffers(lines: Line[]) {
    const vcc = this.charGeometry.attributes.position.count // vertices per char count
    const icc = this.charGeometry.index.count // indexes per char count
    const charUvs = this.charGeometry.attributes.uv.array

    const populateAttrSize2 = (attr, xMin, yMin, xMax, yMax, offset) => {
      const target = this.attributes[attr].array as Array<number>
      for (let i = 0, l = vcc * 2; i < l; i += 2) {
        target[offset + i] = charUvs[i] * (xMax - xMin) + xMin
        target[offset + i + 1] = charUvs[i + 1] * (yMax - yMin) + yMin
      }
    }

    const populateAttrSize3 = (attr, xMin, yMin, xMax, yMax, offset, z = 0) => {
      const target = this.attributes[attr].array as Array<number>
      for (let i = 0, j = 0, l = vcc * 3; i < l; i += 3, j += 2) {
        target[offset + i] = charUvs[j] * (xMax - xMin) + xMin
        target[offset + i + 1] = charUvs[j + 1] * (yMax - yMin) + yMin
        target[offset + i + 2] = z
      }
    }

    const texW = this.font.common.scaleW
    const texH = this.font.common.scaleH

    const cH = this.computedHeight
    const cW = this.computedWidth
    const tW = this.width !== 'auto' ? this.width : cW
    const tH = this.height !== 'auto' ? this.height : cH

    let y = -(this.lineHeight * this.size - this.size) / 2
    let x = 0
    let yUnit, xUnit

    let charIndex = 0
    let wordIndex = 0
    let j = 0
    let offsetHeight = 0

    if (this.alignY === 'center') {
      offsetHeight = this.computedHeight / 2
    } else if (this.alignY === 'bottom') {
      offsetHeight = this.computedHeight
    }
    y += offsetHeight

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const normalizedY = y - offsetHeight

      // Initialize counters
      let lineCharIndex = 0
      let lineWordIndex = 0
      let lineWordCount = 0
      let lineCharCount = line.chars.length

      if (this.recordedAttributes.lineWordCount) {
        lineWordCount = line.chars.reduce((acc, value, index) => {
          const isWhitespace = whitespace.test(value.definition.char)
          const isInMiddle = index !== 0 && index !== line.chars.length - 1
          if (isWhitespace && isInMiddle) {
            acc++
          }
          return acc
        }, 1)
      }

      for (let i = 0; i < line.chars.length; i++) {
        const glyph = line.chars[i].definition

        // If space, don't add to geometry
        if (whitespace.test(glyph.char)) {
          wordIndex++
          lineWordIndex++
          continue
        }

        // Each letter is a quad. axis bottom left
        const w = glyph.width * this.textScale
        const h = glyph.height * this.textScale

        x = line.chars[i].x

        // Apply char sprite offsets
        x += glyph.xoffset * this.textScale
        y -= glyph.yoffset * this.textScale

        xUnit = x
        yUnit = y - offsetHeight
        if (this.alignX === 'center') {
          xUnit = tW * 0.5 - line.width * 0.5 + x
          x -= line.width * 0.5
        } else if (this.alignX === 'right') {
          xUnit = tW - line.width + x
          x -= line.width
        }

        const u = glyph.x / texW
        const uw = glyph.width / texW
        const v = 1.0 - glyph.y / texH
        const vh = glyph.height / texH
        const offset3 = j * vcc * 3
        const offset2 = j * vcc * 2

        /**
         * Populate needed attributes buffers
         */
        populateAttrSize3('position', x, y - h, x + w, y, offset3)
        populateAttrSize2('charUv', u, v - vh, u + uw, v, offset2)

        /**
         * Populate optionals attributes buffers
         */

        if (this.recordedAttributes.uv) {
          populateAttrSize2(
            'uv',
            xUnit / tW,
            1 - (yUnit - h) / -tH,
            (xUnit + w) / tW,
            1 - yUnit / -tH,
            offset2,
          )
        }

        if (this.recordedAttributes.charPosition) {
          populateAttrSize3('charPosition', x, y - h, x + w, y, offset3)
          // ;(this.attributes.charPosition.array as Float32Array).set(
          //   [x, y - h, 0, x, y, 0, x + w, y - h, 0, x + w, y, 0],
          //   j * 4 * 3,
          // )
        }

        // if (this.recordedAttributes.charPosition) {
        //   ;(this.attributes.charPosition.array as Float32Array).set(
        //     [u, v - vh, u, v, u + uw, v - vh, u + uw, v],
        //     j * 4 * 3,
        //   )
        // }

        if (this.recordedAttributes.normal) {
          populateAttrSize3('normal', 0, 0, 0, 0, offset3, 1)
          // ;(this.attributes.normal.array as Float32Array).set(
          //   [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
          //   j * 4 * 3,
          // )
        }

        if (this.recordedAttributes.charSize) {
          populateAttrSize2('charSize', w, h, w, h, offset2)
        }

        if (this.recordedAttributes.lineIndex) {
          for (let i = 0; i < vcc; i++) {
            this.recordedAttributes.lineIndex[j * 4 + i] = lineIndex
          }
        }

        if (this.recordedAttributes.charIndex) {
          for (let i = 0; i < vcc; i++) {
            this.recordedAttributes.charIndex[j * 4 + i] = charIndex
          }
        }

        if (this.recordedAttributes.wordIndex) {
          for (let i = 0; i < vcc; i++) {
            this.recordedAttributes.wordIndex[j * 4 + i] = wordIndex
          }
        }

        if (this.recordedAttributes.lineCharIndex) {
          for (let i = 0; i < vcc; i++) {
            this.recordedAttributes.lineCharIndex[j * 4 + i] = lineCharIndex
          }
        }

        if (this.recordedAttributes.lineWordIndex) {
          for (let i = 0; i < vcc; i++) {
            this.recordedAttributes.lineWordIndex[j * 4 + i] = lineWordIndex
          }
        }

        if (this.recordedAttributes.lineWordCount) {
          for (let i = 0; i < vcc; i++) {
            this.recordedAttributes.lineWordCount[j * 4 + i] = lineWordCount
          }
        }

        if (this.recordedAttributes.lineCharCount) {
          for (let i = 0; i < vcc; i++) {
            this.recordedAttributes.lineCharCount[j * 4 + i] = lineCharCount
          }
        }

        // Reset cursor to baseline
        y += glyph.yoffset * this.textScale
        j++
        charIndex++
        lineCharIndex++
      }

      y -= this.size * this.lineHeight
    }

    this.computeBoundingBox()
  }

  computeBoundingBox() {
    if (!this.boundingBox) this.boundingBox = new Box3()

    this.boundingBox.min.z = 0
    this.boundingBox.max.z = 0

    if (this.alignX === 'center') {
      this.boundingBox.min.x = -this.computedWidth / 2
      this.boundingBox.max.x = this.computedWidth / 2
    }
    if (this.alignX === 'left') {
      this.boundingBox.min.x = 0
      this.boundingBox.max.x = this.computedWidth
    }
    if (this.alignX === 'right') {
      this.boundingBox.min.x = -this.computedWidth
      this.boundingBox.max.x = 0
    }
    if (this.alignY === 'center') {
      this.boundingBox.min.y = -this.computedHeight / 2
      this.boundingBox.max.y = this.computedHeight / 2
    }
    if (this.alignY === 'bottom') {
      this.boundingBox.min.y = 0
      this.boundingBox.max.y = this.computedHeight
    }
    if (this.alignY === 'top') {
      this.boundingBox.min.y = -this.computedHeight
      this.boundingBox.max.y = 0
    }

    if (
      isNaN(this.boundingBox.min.x) ||
      isNaN(this.boundingBox.min.y) ||
      isNaN(this.boundingBox.min.z)
    ) {
      console.error(
        'THREE.BufferGeometry.computeBoundingBox(): Computed min/max have NaN values. The "position" attribute is likely to have NaN values.',
        this,
      )
    }
  }

  /**
   * Update buffers with new layout
   */
  resize(width: number | 'auto', height: number | 'auto' = 'auto') {
    this.width = width
    this.height = height
    this.computeGeometry()
  }

  /**
   * Update text and re-compute geometry (like creating new Text)
   */

  updateText(text) {
    this.text = text
    this.computeGeometry()
  }
}
