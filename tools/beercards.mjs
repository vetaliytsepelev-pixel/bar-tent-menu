// Карточки пива в одном стиле: вырезанные бутылка и бокал на чёрном квадрате 1200×1200 (+ превью 480).
// node beercards.mjs — берёт PNG из _beer/ и _dl/, пишет в ../public/img/<id>.jpg и <id>-s.jpg
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const OUT = path.resolve('../public/img'); const SQ = 1200;
// trim прозрачных полей
async function trimmed(file) { const img = sharp(file).ensureAlpha(); const { data, info } = await img.raw().toBuffer({ resolveWithObject: true }); let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1; for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) { if (data[(y * info.width + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } return sharp(await img.extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer()); }
// элемент: file, высота в долях квадрата, центр по x (доля), низ по y (доля)
async function card(id, parts) {
  const comps = [];
  for (const p of parts) { const im = await trimmed(p.file); const buf = await im.resize({ height: Math.round(SQ * p.h), kernel: 'lanczos3' }).png().toBuffer(); const m = await sharp(buf).metadata(); comps.push({ input: buf, left: Math.round(SQ * p.cx - m.width / 2), top: Math.round(SQ * p.bottom - m.height) }); }
  // лёгкая «подсветка» снизу, как блик на столе
  const glow = Buffer.from(`<svg width="${SQ}" height="${SQ}"><defs><radialGradient id="g" cx="50%" cy="92%" r="55%"><stop offset="0" stop-color="#3a3a3a"/><stop offset="1" stop-color="#000"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const png = await sharp({ create: { width: SQ, height: SQ, channels: 3, background: '#000' } }).composite([{ input: glow, left: 0, top: 0 }, ...comps]).png().toBuffer();
  await sharp(png).jpeg({ quality: 86, chromaSubsampling: '4:4:4' }).toFile(path.join(OUT, id + '.jpg'));
  await sharp(png).resize(480, 480).jpeg({ quality: 82 }).toFile(path.join(OUT, id + '-s.jpg'));
  console.log(id, 'ok');
}
const GLASS = '_beer/glass_rmbg.png', TOWER = '_beer/tower_rmbg.png';
await card('cana', [{ file: GLASS, h: 0.56, cx: 0.5, bottom: 0.9 }]);
await card('pinta', [{ file: GLASS, h: 0.8, cx: 0.5, bottom: 0.92 }]);
await card('beer-tower', [{ file: TOWER, h: 0.88, cx: 0.5, bottom: 0.94 }]);
const brands = [['heineken-0', '_dl/heineken00.png'], ['amstel-0', '_dl/amstel_tostada00.png'], ['alhambra', '_dl/alhambra_rmbg.png']];
for (const [id, bottle] of brands) await card(id, [{ file: bottle, h: 0.82, cx: 0.36, bottom: 0.92 }, { file: GLASS, h: 0.56, cx: 0.68, bottom: 0.92 }]);
// общий вид «пиво» для плитки главной — бокал
fs.copyFileSync(path.join(OUT, 'pinta.jpg'), path.join(OUT, 'beer.jpg')); fs.copyFileSync(path.join(OUT, 'pinta-s.jpg'), path.join(OUT, 'beer-s.jpg'));
console.log('готово');
