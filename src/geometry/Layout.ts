import type { FontChar, FontDefinition } from '../font'
import { Font } from '../font'
import type { Line, AlignY, AlignX } from './types'
import { getKernPairOffset } from './getKernPairOffset'
import { newline, tabulation, whitespace } from '../utils/regexp'

export interface LayoutOptions {
  font?: Font | FontDefinition
  text?: string
  width?: number | 'auto'
  height?: number | 'auto'
  alignX?: AlignX
  alignY?: AlignY
  size?: number
  letterSpacing?: number
  tabSize?: number
  lineHeight?: number
  wordSpacing?: number
  wordBreak?: boolean
  lineBreak?: boolean
}

export class Layout {
  font: Font
  text: string
  width: number | 'auto'
  height: number | 'auto'
  alignX: AlignX
  alignY: AlignY
  _size: number
  letterSpacing: number
  tabSize: number
  lineHeight: number
  wordSpacing: number
  wordBreak: boolean
  lineBreak: boolean
  textScale: number

  lines: Line[]
  computedWidth: number
  computedHeight: number
  lineCount: number

  constructor({
    font,
    text,
    width = 'auto',
    height = 'auto',
    alignX = 'left',
    alignY = 'top',
    size = 1,
    letterSpacing = 0,
    tabSize = 4,
    lineHeight = 1,
    wordSpacing = 0,
    wordBreak = false,
    lineBreak = true,
  }: LayoutOptions = {}) {
    this.font = font instanceof Font ? font : new Font(font)
    this.text = text
    this.width = width
    this.height = height
    this.alignX = alignX
    this.alignY = alignY
    this.size = size
    this.letterSpacing = letterSpacing
    this.tabSize = tabSize
    this.lineHeight = lineHeight
    this.wordSpacing = wordSpacing
    this.wordBreak = wordBreak
    this.lineBreak = lineBreak

    this.compute()
  }

  get size(): number {
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

  compute() {
    this.lines = []

    const maxTimes = 100
    let cursor = 0
    let wordCursor = 0
    let wordWidth = 0

    const newLine = (): Line => {
      const line = {
        index: this.lines.length,
        width: 0,
        chars: [],
      }
      this.lines.push(line)
      wordCursor = cursor
      wordWidth = 0
      return line
    }

    let line = newLine()
    let count = 0

    while (cursor < this.text.length && count < maxTimes) {
      const char = this.text[cursor]
      let advance = 0
      count++

      // Detect \n char
      if (newline.test(char)) {
        cursor++
        line = newLine()
        continue
      }

      // Skip whitespace at start of line
      if (!line.width && whitespace.test(char) && !tabulation.test(char)) {
        cursor++
        wordCursor = cursor
        wordWidth = 0
        continue
      }

      const charDef: FontChar =
        this.font.indexedChar[char] || this.font.indexedChar[' ']

      if (!charDef) throw new Error(`Missing glyph "${char}"`)

      // Find any applicable kern pairs
      if (line.chars.length && charDef) {
        const prevGlyph = line.chars[line.chars.length - 1].definition
        const kern =
          getKernPairOffset(this.font, charDef.id || 0, prevGlyph.id) *
          this.textScale
        line.width += kern
        wordWidth += kern
      }

      // add char to line
      line.chars.push({
        definition: charDef,
        x: line.width,
        y: 0,
        lineIndex: line.index,
        lineCharIndex: line.chars.length,
      })

      // Handle whitespace, tabulation and others text advances
      if (tabulation.test(char)) {
        wordCursor = cursor
        wordWidth = 0
        advance +=
          this.font.indexedChar['o'].width * this.textScale * this.tabSize
      } else if (whitespace.test(char)) {
        wordCursor = cursor
        wordWidth = 0
        advance += this.wordSpacing * this.size
      } else {
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
    if (!line.width) this.lines.pop()

    this.lineCount = this.lines.length

    // Compute boundaries
    this.computedHeight = this.lineCount * this.size * this.lineHeight
    this.computedWidth = Math.max(...this.lines.map((line) => line.width))
  }
}
