// Фото для сайта: авто-обрезка по сюжету, квадрат на чёрном, кривая Xara (как в печатном меню), 1200 px + превью 480 px.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const SRC = 'C:/Users/user/Documents/Meta-Bitrix/цветокор/монтаж/xara-меню/tent/bitmaps';
const OUT = path.resolve('../public/img');
const rows = JSON.parse(fs.readFileSync(path.join(SRC, '_bitmaps.json'), 'utf8'));
const file = name => path.join(SRC, rows.find(r => r.name === name).file);
const pts = [[0, 0], [16, 22], [32, 40], [64, 89], [96, 127], [128, 158], [160, 204], [192, 234], [208, 248], [220, 255], [255, 255]];
const lut = new Uint8Array(256); for (let v = 0; v < 256; v++) { let i = 1; while (i < pts.length - 1 && v > pts[i][0]) i++; const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; lut[v] = Math.round(y0 + (y1 - y0) * (v - x0) / (x1 - x0)); }
const items = {
  // platos
  'langostinos': ['7P3A3365.jpg', 'jpeg'], 'queso': ['7P3A3357.jpg', 'jpeg'], 'jamon': ['7P3A3353.jpg', 'jpeg'], 'chuleton': ['7P3A3371.jpg', 'jpeg'],
  // коктейли
  'pina-colada': ['7P3A3130.jpg', 'jpeg'], 'irish-mule': ['7P3A3150.jpg', 'jpeg'], 'aperol-sour': ['7P3A3162.jpg', 'jpeg'], 'daiquiri': ['7P3A3231.jpg', 'jpeg'], 'aperol-spritz': ['7P3A3175.jpg', 'jpeg'], 'cosmopolitan': ['7P3A3170.jpg', 'jpeg'], 'french-77': ['7P3A3208.jpg', 'jpeg'], 'boulevardier': ['7P3A3216.jpg', 'jpeg'], 'tent-club': ['DFF52F8F-0C0A-46DC-9422-EEBCCF09945C.png', 'png'], 'mojito': ['7P3A3154.jpg', 'jpeg'],
  'margarita': ['7P3A3186.jpg', 'jpeg'], 'bloody-mary': ['1475BCDE-7259-447D-8299-4CE8128A0633.png', 'png'], 'espresso-martini': ['7P3A3202.jpg', 'jpeg'], 'negroni': ['7P3A3240.jpg', 'jpeg'], 'gin-tonic': ['7P3A3244.jpg', 'jpeg'], 'blue-lagoon': ['IMG_9054.png', 'png'], 'sex-on-the-beach': ['7P3A3274.jpg', 'jpeg'], 'cuba-libre': ['7P3A3255.jpg', 'jpeg'], 'mai-tai': ['F007BCFD-E96A-41A4-B44F-7149259B9F7C.png', 'png'], 'pornstar-martini': ['A80F2E46-7C3C-420E-897B-B345A3CC905F.png', 'png'], 'whisky-sour': ['7P3A3265.jpg', 'jpeg'],
  // пиво, вино
  'beer': ['photo_2025-06-09_19-37-14.jpg', 'jpeg-nocurve'], 'beer-tower': ['photo_2025-06-09_21-13-45.jpg', 'jpeg-nocurve'], 'wine': ['Lovepik_com_380708790_wine_clinking_glass_png_file_festival_beverage.png', 'png'],
};
for (const [id, [name, kind]] of Object.entries(items)) {
  let img = sharp(file(name)).rotate();
  if (kind === 'png') { // PNG из Xara: альфа наоборот (0 = видно)
    const px = await img.ensureAlpha().raw().toBuffer({ resolveWithObject: true }); const d = px.data; for (let i = 3; i < d.length; i += 4) d[i] = 255 - d[i];
    img = sharp(d, { raw: { width: px.info.width, height: px.info.height, channels: 4 } }).flatten({ background: '#000000' });
  }
  let { data, info } = await img.removeAlpha().raw().toBuffer({ resolveWithObject: true });
  if (kind === 'jpeg') for (let i = 0; i < data.length; i++) data[i] = lut[data[i]];
  // bbox сюжета: яркость > 28 (фон чёрный)
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
  for (let y = 0; y < info.height; y += 2) for (let x = 0; x < info.width; x += 2) { const i = (y * info.width + x) * 3; const Y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]; if (Y > 28) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
  const pad = Math.round(Math.max(x1 - x0, y1 - y0) * 0.06); x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(info.width - 1, x1 + pad); y1 = Math.min(info.height - 1, y1 + pad);
  const side = Math.max(x1 - x0, y1 - y0) + 1; const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const L = Math.round(cx - side / 2), T = Math.round(cy - side / 2);
  const base = sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } });
  // расширяем холст чёрным, если квадрат выходит за кадр
  const extendL = Math.max(0, -L), extendT = Math.max(0, -T), extendR = Math.max(0, L + side - info.width), extendB = Math.max(0, T + side - info.height);
  const ext = await base.extend({ left: extendL, top: extendT, right: extendR, bottom: extendB, background: '#000000' }).png().toBuffer();
  const buf = await sharp(ext).extract({ left: L + extendL, top: T + extendT, width: side, height: side }).png().toBuffer();
  await sharp(buf).resize(1200, 1200).jpeg({ quality: 86, chromaSubsampling: '4:4:4' }).toFile(path.join(OUT, id + '.jpg'));
  await sharp(buf).resize(480, 480).jpeg({ quality: 82 }).toFile(path.join(OUT, id + '-s.jpg'));
  console.log(id.padEnd(18), name.padEnd(28), `кадр ${info.width}x${info.height} → квадрат ${side}`);
}
