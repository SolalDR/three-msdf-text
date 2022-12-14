import { FontCommon } from './Common'
import { DistanceField } from './DistanceField'
import { FontChar } from './FontChar'
import { Kerning } from './Kerning'

export interface FontDefinition {
  pages: string[]
  chars: FontChar[]
  info: unknown
  common: FontCommon
  distanceField: DistanceField
  kernings: Kerning[]
}
