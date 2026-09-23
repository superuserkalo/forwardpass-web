export function buildGlyphBits(family: string, glyphs: string): Uint32Array<ArrayBuffer> {
  const bitW = 6;
  const bitH = 8;
  const scale = 8;
  const cellW = bitW * scale;
  const cellH = bitH * scale;
  const strip = document.createElement("canvas");
  strip.width = glyphs.length * cellW;
  strip.height = cellH;
  const ctx = strip.getContext("2d", { willReadFrequently: true });
  const bits = new Uint32Array(glyphs.length * bitH);
  if (!ctx) return bits;

  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `600 ${Math.round(cellH * 0.78)}px ${family}`;
  for (let i = 0; i < glyphs.length; i += 1) {
    ctx.fillText(glyphs[i], i * cellW + cellW / 2, cellH / 2);
  }

  const image = ctx.getImageData(0, 0, strip.width, strip.height).data;
  for (let i = 0; i < glyphs.length; i += 1) {
    for (let y = 0; y < bitH; y += 1) {
      let row = 0;
      for (let x = 0; x < bitW; x += 1) {
        let alpha = 0;
        for (let sy = 0; sy < scale; sy += 1) {
          for (let sx = 0; sx < scale; sx += 1) {
            const px = i * cellW + x * scale + sx;
            const py = y * scale + sy;
            alpha += image[(py * strip.width + px) * 4 + 3];
          }
        }
        if (alpha / (scale * scale * 255) > 0.3) {
          row |= 1 << (bitW - 1 - x);
        }
      }
      bits[i * bitH + y] = row;
    }
  }
  return bits;
}
