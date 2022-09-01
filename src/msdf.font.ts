export class MSDFFont {
  font = {}
  glyphs = {}
  constructor(font) {
    this.font = font
    font.chars.forEach((d) => (this.glyphs[d.char] = d));
  }
}