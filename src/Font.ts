export class Font {
  data = {}
  glyphs = {}
  common = {}
  constructor(font) {
    this.data = font
    this.common = font.common
    font.chars.forEach((d) => (this.glyphs[d.char] = d));
  }
}