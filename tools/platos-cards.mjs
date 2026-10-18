// Карточки блюд: вырезка на чёрном 4:3, доска ~94% ширины, 2000×1500 + превью 1000×750. node platos-cards.mjs
import path from 'node:path';
import sharp from 'sharp';
const OUT = path.resolve('../public/img'); const W = 2000, H = 1500;
for (const id of ['langostinos', 'queso', 'jamon', 'chuleton']) {
  const cut = sharp(`_platos/${id}_cut.png`); const m = await cut.metadata();
  const scale = Math.min((W * 0.94) / m.width, (H * 0.86) / m.height);
  const buf = await cut.resize({ width: Math.round(m.width * scale), kernel: 'lanczos3' }).sharpen({ sigma: 0.8, m1: 0.5, m2: 1.2 }).png().toBuffer();
  const bm = await sharp(buf).metadata();
  const glow = Buffer.from(`<svg width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="78%" r="60%"><stop offset="0" stop-color="#262626"/><stop offset="1" stop-color="#000"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/></svg>`);
  const png = await sharp({ create: { width: W, height: H, channels: 3, background: '#000' } }).composite([{ input: glow, left: 0, top: 0 }, { input: buf, left: Math.round((W - bm.width) / 2), top: Math.round((H - bm.height) / 2) }]).png().toBuffer();
  await sharp(png).jpeg({ quality: 88, chromaSubsampling: '4:4:4' }).toFile(path.join(OUT, id + '.jpg'));
  await sharp(png).resize(1000, 750).jpeg({ quality: 84 }).toFile(path.join(OUT, id + '-s.jpg'));
  console.log(id, `${bm.width}x${bm.height} на ${W}x${H}`);
}
