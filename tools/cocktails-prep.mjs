// Коктейли: JPEG из макета → кривая Xara → PNG 2400 px по высоте для RMBG; PNG из Xara → альфа наоборот → сразу вырезка.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const SRC = 'C:/Users/user/Documents/Meta-Bitrix/цветокор/монтаж/xara-меню/tent/bitmaps';
const rows = JSON.parse(fs.readFileSync(path.join(SRC, '_bitmaps.json'), 'utf8'));
const pts = [[0, 0], [16, 22], [32, 40], [64, 89], [96, 127], [128, 158], [160, 204], [192, 234], [208, 248], [220, 255], [255, 255]];
const lut = new Uint8Array(256); for (let v = 0; v < 256; v++) { let i = 1; while (i < pts.length - 1 && v > pts[i][0]) i++; const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; lut[v] = Math.round(y0 + (y1 - y0) * (v - x0) / (x1 - x0)); }
const items = { 'pina-colada': '7P3A3130.jpg', 'irish-mule': '7P3A3150.jpg', 'aperol-sour': '7P3A3162.jpg', 'daiquiri': '7P3A3231.jpg', 'aperol-spritz': '7P3A3175.jpg', 'cosmopolitan': '7P3A3170.jpg', 'french-77': '7P3A3208.jpg', 'boulevardier': '7P3A3216.jpg', 'tent-club': 'DFF52F8F-0C0A-46DC-9422-EEBCCF09945C.png', 'mojito': '7P3A3154.jpg', 'margarita': '7P3A3186.jpg', 'bloody-mary': '1475BCDE-7259-447D-8299-4CE8128A0633.png', 'espresso-martini': '7P3A3202.jpg', 'negroni': '7P3A3240.jpg', 'gin-tonic': '7P3A3244.jpg', 'blue-lagoon': 'IMG_9054.png', 'sex-on-the-beach': '7P3A3274.jpg', 'cuba-libre': '7P3A3255.jpg', 'mai-tai': 'F007BCFD-E96A-41A4-B44F-7149259B9F7C.png', 'pornstar-martini': 'A80F2E46-7C3C-420E-897B-B345A3CC905F.png', 'whisky-sour': '7P3A3265.jpg' };
const todo = [];
for (const [id, name] of Object.entries(items)) {
  const file = path.join(SRC, rows.find(r => r.name === name).file);
  if (name.endsWith('.png')) { // альфа Xara наоборот → обычная, обрезка по содержимому
    const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
    let x0 = info.width, y0 = info.height, x1 = -1, y1 = -1;
    for (let i = 3, p = 0; i < data.length; i += 4, p++) { data[i] = 255 - data[i]; if (data[i] > 20) { const x = p % info.width, y = (p / info.width) | 0; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } }
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toFile(`_cocktails/${id}_cut.png`);
    console.log(id, 'png готов', (x1 - x0 + 1) + 'x' + (y1 - y0 + 1));
  } else {
    const { data, info } = await sharp(file).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i++) data[i] = lut[data[i]];
    await sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).resize({ height: 2400, kernel: 'lanczos3' }).png({ compressionLevel: 3 }).toFile(`_cocktails/${id}_src.png`);
    todo.push(id); console.log(id, 'src 2400 px');
  }
}
fs.writeFileSync('_cocktails/_todo.txt', todo.join('\n'));
