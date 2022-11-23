import { FontCommon } from './types/Common'
import { DistanceField } from './types/DistanceFIeld'
import { FontChar } from './types/FontChar'
import { FontDefinition } from './types/FontDefinition'
import { Kerning } from './types/Kerning'

/**
 * Class representation of a JSON font file.
 */
export class Font {
  pages: string[]
  chars: FontChar[]
  indexedChar: { [key: string]: FontChar } = {}
  info: unknown // no use
  common: FontCommon
  distanceField: DistanceField
  kernings: Kerning[]

  constructor(font: FontDefinition) {
    this.pages = font.pages
    this.chars = font.chars
    this.common = font.common
    this.info = font.info
    this.common = font.common
    this.distanceField = font.distanceField
    this.kernings = font.kernings

    if (this.distanceField.fieldType !== 'msdf') {
      console.warn(
        'three-msdf-text(font.distanceField): fieldType should be "msdf"',
      )
    }

    // Index font chars per key for better accessibility
    font.chars.forEach((d) => (this.indexedChar[d.char] = d))
  }
}
