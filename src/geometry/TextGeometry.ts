import { BufferGeometry, BufferAttribute, Box3, PlaneGeometry } from 'three'
import type { Line, AlignY, AlignX } from './types'
import type { FontDefinition, Font } from '../font'
import { attributesDefinitions } from './const'
import { LayoutOptions, TextLayout } from './TextLayout'
import { newline, whitespace } from '../utils/regexp'

export type Attribute = keyof typeof attributesDefinitions
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
  tabSize?: number
  lineHeight?: number
  wordSpacing?: number
  wordBreak?: boolean
  lineBreak?: boolean
  widthSegments?: number
  heightSegments?: number
}

export class TextGeometry extends BufferGeometry {
  private charGeometry?: PlaneGeometry
  layout: TextLayout
  computedWidth: number
  computedHeight: number
  lineCount: number
  recordedAttributes: Record<Attribute, boolean>

  constructor({
    widthSegments = 1,
    heightSegments = 1,
    ...options
  }: TextGeometryOptions = {}) {
    super()
    this.layout = new TextLayout(options)
    this.charGeometry = new PlaneGeometry(1, 1, widthSegments, heightSegments)

    this.recordedAttributes = (
      Object.keys(attributesDefinitions) as Attribute[]
    ).reduce((acc, value) => {
      const isGenerated = attributesDefinitions[value].default || options[value]
      acc[value] = isGenerated
      return acc
    }, {} as Record<Attribute, boolean>)

    this.computeGeometry()
  }

  get text() {
    return this.layout.text
  }

  set text(value: string) {
    this.layout.text = value
  }

  /**
   * Allocate attributes buffer, compute geometry indexes
   */
  private computeGeometry() {
    // Strip spaces and newlines to get actual character length for buffers
    const chars = this.layout.text.replace(/[ \n]/g, '')
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

    this.computeLayout()
    this.populateBuffers()
  }

  computeLayout() {
    this.layout.compute()
  }

  populateBuffers() {
    const l = this.layout
    const vcc = this.charGeometry.attributes.position.count // vertices per char count
    const icc = this.charGeometry.index.count // indexes per char count
    const charUvs = this.charGeometry.attributes.uv.array

    // Interpolation methods for subdivied geometries (vec2)
    const populateAttrSize2 = (
      attr: string,
      xMin: number,
      yMin: number,
      xMax: number,
      yMax: number,
      offset: number,
    ) => {
      const target = this.attributes[attr].array as Array<number>
      for (let i = 0, l = vcc * 2; i < l; i += 2) {
        target[offset + i] = charUvs[i] * (xMax - xMin) + xMin
        target[offset + i + 1] = charUvs[i + 1] * (yMax - yMin) + yMin
      }
    }

    // Interpolation methods for subdivied geometries (vec3)
    const populateAttrSize3 = (
      attr: string,
      xMin: number,
      yMin: number,
      xMax: number,
      yMax: number,
      offset: number,
      defaultZ: number = 0,
    ) => {
      const target = this.attributes[attr].array as Array<number>
      for (let i = 0, j = 0, l = vcc * 3; i < l; i += 3, j += 2) {
        target[offset + i] = charUvs[j] * (xMax - xMin) + xMin
        target[offset + i + 1] = charUvs[j + 1] * (yMax - yMin) + yMin
        target[offset + i + 2] = defaultZ
      }
    }

    const texW = l.font.common.scaleW
    const texH = l.font.common.scaleH
    const cH = l.computedHeight
    const cW = l.computedWidth
    const tW = l.width !== 'auto' ? l.width : cW
    const tH = l.height !== 'auto' ? l.height : cH
    let y = -(l.lineHeight * l.size - l.size) / 2
    let x = 0
    let j = 0
    let offsetHeight = 0
    let uy, ux

    // Initialize counters
    const c = {
      lineIndex: 0,
      charIndex: 0,
      wordIndex: 0,
      lineCharIndex: 0,
      lineWordIndex: 0,
      lineWordCount: 0,
      lineCharCount: 0,
    }

    // Apply y alignment offset
    if (l.alignY === 'center') {
      offsetHeight = l.computedHeight / 2
    } else if (l.alignY === 'bottom') {
      offsetHeight = l.computedHeight
    }
    y += offsetHeight

    for (c.lineIndex = 0; c.lineIndex < l.lines.length; c.lineIndex++) {
      const line = l.lines[c.lineIndex]
      const normalizedY = y - offsetHeight

      // Initialize counters
      c.lineCharIndex = c.lineWordIndex = c.lineWordCount = 0
      c.lineCharCount = line.chars.length

      // Count words per line for optional attribute
      if (this.recordedAttributes.lineWordCount) {
        c.lineWordCount = line.chars.reduce((acc, value, index) => {
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

        // Current vertex
        const vertexIndex = j * vcc

        // If space, don't add to geometry
        if (whitespace.test(glyph.char)) {
          c.wordIndex++
          c.lineWordIndex++
          continue
        }

        // Each letter is a quad. axis bottom left
        const w = glyph.width * l.textScale
        const h = glyph.height * l.textScale

        x = line.chars[i].x

        // Apply char sprite offsets
        x += glyph.xoffset * l.textScale
        y -= glyph.yoffset * l.textScale

        // Compute global uv top-left corner
        ux = x
        uy = y - offsetHeight

        // Apply x alignment offset
        if (l.alignX === 'center') {
          ux = tW * 0.5 - line.width * 0.5 + x
          x -= line.width * 0.5
        } else if (l.alignX === 'right') {
          ux = tW - line.width + x
          x -= line.width
        }

        // Compute char uv
        const u = glyph.x / texW
        const uw = glyph.width / texW
        const v = 1.0 - glyph.y / texH
        const vh = glyph.height / texH

        // Populate needed attributes
        populateAttrSize3('position', x, y - h, x + w, y, vertexIndex * 3)
        populateAttrSize2('charUv', u, v - vh, u + uw, v, vertexIndex * 2)

        // Populate optional UV attribute
        if (this.recordedAttributes.uv) {
          populateAttrSize2(
            'uv',
            ux / tW,
            1 - (uy - h) / -tH,
            (ux + w) / tW,
            1 - uy / -tH,
            vertexIndex * 2,
          )
        }

        // Populate optional charPosition attribute
        if (this.recordedAttributes.charPosition) {
          populateAttrSize3(
            'charPosition',
            x + w / 2,
            y - h / 2,
            x + w / 2,
            y - h / 2,
            vertexIndex * 3,
          )
        }

        // Populate optional normal attribute
        if (this.recordedAttributes.normal) {
          populateAttrSize3('normal', 0, 0, 0, 0, vertexIndex * 3, 1)
        }

        // Populate optional charSize attribute
        if (this.recordedAttributes.charSize) {
          populateAttrSize2('charSize', w, h, w, h, vertexIndex * 2)
        }

        // Populate optionals counter attributes
        for (let key in c) {
          if (this.recordedAttributes[key]) {
            for (let i = 0; i < vcc; i++) {
              ;(this.attributes[key].array as unknown as Array<Number>)[
                vertexIndex * 4
              ] = c[key]
            }
          }
        }

        // Reset cursor to baseline
        y += glyph.yoffset * l.textScale

        j++
        c.charIndex++
        c.lineCharIndex++
      }

      c.wordIndex++

      // Jump to next line
      y -= l.size * l.lineHeight
    }

    this.computeBoundingBox()
  }

  computeBoundingBox() {
    const { alignX, alignY, computedWidth, computedHeight } = this.layout

    if (!this.boundingBox) this.boundingBox = new Box3()
    this.boundingBox.min.setScalar(0)
    this.boundingBox.max.setScalar(0)

    if (alignX === 'center') {
      this.boundingBox.min.x = -computedWidth / 2
      this.boundingBox.max.x = computedWidth / 2
    }

    if (alignY === 'center') {
      this.boundingBox.min.y = -computedHeight / 2
      this.boundingBox.max.y = computedHeight / 2
    }

    if (alignX === 'left') this.boundingBox.max.x = computedWidth
    if (alignX === 'right') this.boundingBox.min.x = -computedWidth
    if (alignY === 'bottom') this.boundingBox.max.y = computedHeight
    if (alignY === 'top') this.boundingBox.min.y = -computedHeight

    if (isNaN(computedWidth) || isNaN(computedHeight)) {
      console.error(
        'THREE.TextGeometry.computeBoundingBox(): Computed min/max have NaN values. The layout may be corrupted.',
        this,
      )
    }
  }

  /**
   * Update buffers with new layout
   */
  resize(width: number | 'auto', height: number | 'auto' = 'auto') {
    this.layout.width = width
    this.layout.height = height
    this.computeGeometry()
  }

  /**
   * Update text and re-compute geometry (like creating new Text)
   */
  updateText(text: string) {
    this.layout.text = text
    this.computeGeometry()
  }
}
