import { TextChar } from './TextChar'

/**
 * Struct of a line in a TextGeometry
 */
export type Line = {
  index: number
  width: number
  chars: TextChar[]
}
