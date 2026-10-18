// Блюда: исходник из макета → кривая Xara → PNG 3000 px для вырезки (RMBG) → _platos/<id>_src.png
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const SRC = 'C:/Users/user/Documents/Meta-Bitrix/цветокор/монтаж/xara-меню/tent/bitmaps';
const rows = JSON.parse(fs.readFileSync(path.join(SRC, '_bitmaps.json'), 'utf8'));
const pts = [[0, 0], [16, 22], [32, 40], [64, 89], [96, 127], [128, 158], [160, 204], [192, 234], [208, 248], [220, 255], [255, 255]];
const lut = new Uint8Array(256); for (let v = 0; v < 256; v++) { let i = 1; while (i < pts.length - 1 && v > pts[i][0]) i++; const [x0, y0] = pts[i - 1], [x1, y1] = pts[i]; lut[v] = Math.round(y0 + (y1 - y0) * (v - x0) / (x1 - x0)); }
const items = { langostinos: '7P3A3365.jpg', queso: '7P3A3357.jpg', jamon: '7P3A3353.jpg', chuleton: '7P3A3371.jpg' };
for (const [id, name] of Object.entries(items)) {
  const file = path.join(SRC, rows.find(r => r.name === name).file);
  const { data, info } = await sharp(file).rotate().removeAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i++) data[i] = lut[data[i]];
  await sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } }).resize({ width: 3000, kernel: 'lanczos3' }).png({ compressionLevel: 3 }).toFile(`_platos/${id}_src.png`);
  console.log(id, name, info.width + 'x' + info.height, '→ 3000 px');
}
