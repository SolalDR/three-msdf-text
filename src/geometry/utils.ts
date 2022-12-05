export function getKernPairOffset(font, id1, id2) {
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
