// Карточки коктейлей: вырезка на чёрном квадрате 1600×1600, бокал по центру, высота ~88 % кадра у всех. node cocktails-cards.mjs [trimReflection]
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const OUT = path.resolve('../public/img'); const S = 1600; const FILL_H = 0.88, FILL_W = 0.84;
const TRIM = process.argv[2] !== '0';
// обрезка отражения снизу: ищем снизу вверх первую строку, где «плотных» пикселей (alpha>240) больше 35 % ширины объекта в этой строке
async function trimmedObject(file) {
  const img = sharp(file).ensureAlpha(); const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  const W = info.width, H = info.height; let cutBottom = H;
  if (TRIM) {
    // ширина объекта по строкам (alpha>20) и доля плотных пикселей
    let maxWidth = 0; const rowW = new Array(H).fill(0), rowSolid = new Array(H).fill(0);
    for (let y = 0; y < H; y++) { let w = 0, s = 0; for (let x = 0; x < W; x++) { const a = data[(y * W + x) * 4 + 3]; if (a > 20) w++; if (a > 240) s++; } rowW[y] = w; rowSolid[y] = s; if (w > maxWidth) maxWidth = w; }
    // снизу вверх: отражение — строки, где плотных < 35 % ширины строки или ширина < 25 % максимума
    let y = H - 1; while (y > H * 0.5 && (rowW[y] < maxWidth * 0.25 || rowSolid[y] < rowW[y] * 0.35)) y--;
    cutBottom = Math.min(H, y + 1 + Math.round(H * 0.01));
  }
  // bbox по alpha>20 в пределах cutBottom
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < cutBottom; y++) for (let x = 0; x < W; x++) { if (data[(y * W + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  // мягкое затухание альфы в нижних 4 % (чтобы срез отражения не был резким)
  const fade = Math.round((y1 - y0) * 0.04);
  for (let y = y1 - fade; y <= y1; y++) { const k = (y1 - y) / fade; for (let x = x0; x <= x1; x++) { const i = (y * W + x) * 4 + 3; data[i] = Math.round(data[i] * k); } }
  const buf = await sharp(data, { raw: { width: W, height: H, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer();
  return { buf, w: x1 - x0 + 1, h: y1 - y0 + 1, trimmed: H - cutBottom };
}
const ids = fs.readdirSync('_cocktails').filter(f => f.endsWith('_cut.png')).map(f => f.replace('_cut.png', ''));
const glow = Buffer.from(`<svg width="${S}" height="${S}"><defs><radialGradient id="g" cx="50%" cy="80%" r="60%"><stop offset="0" stop-color="#242424"/><stop offset="1" stop-color="#000"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
for (const id of ids) {
  const o = await trimmedObject(`_cocktails/${id}_cut.png`);
  const scale = Math.min((S * FILL_H) / o.h, (S * FILL_W) / o.w);
  const obj = await sharp(o.buf).resize({ width: Math.max(1, Math.round(o.w * scale)), height: Math.max(1, Math.round(o.h * scale)), fit: 'fill', kernel: 'lanczos3' }).sharpen({ sigma: 0.7, m1: 0.4, m2: 1.0 }).png().toBuffer();
  const m = await sharp(obj).metadata();
  const png = await sharp({ create: { width: S, height: S, channels: 3, background: '#000' } }).composite([{ input: glow, left: 0, top: 0 }, { input: obj, left: Math.round((S - m.width) / 2), top: Math.round((S - m.height) / 2) }]).png().toBuffer();
  await sharp(png).jpeg({ quality: 88, chromaSubsampling: '4:4:4' }).toFile(path.join(OUT, id + '.jpg'));
  await sharp(png).resize(900, 900).jpeg({ quality: 84 }).toFile(path.join(OUT, id + '-s.jpg'));
  console.log(id.padEnd(18), `объект ${o.w}x${o.h}${o.trimmed ? ' (срезано отражение ' + o.trimmed + ' px)' : ''} → ${m.width}x${m.height}`);
}
console.log('готово', ids.length);
