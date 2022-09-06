import { FontChar} from  "../../font/types/FontChar"

/**
 * Struct of a char in a TextGeometry
 */
export type TextChar = {
  definition: FontChar
  x: number
  y: number
  lineIndex: number
  lineCharIndex: number
}