// Убрать белый фон (заливка от краёв), оставить белое внутри (пена). node cutwhite.mjs <in> <out.png> [порог 225] [размытие 1]
import sharp from 'sharp';
const [inp, out, thrS = '225', blurS = '1'] = process.argv.slice(2); const thr = +thrS;
const { data, info } = await sharp(inp).removeAlpha().raw().toBuffer({ resolveWithObject: true });
const W = info.width, H = info.height; const bg = new Uint8Array(W * H); const stack = [];
const isWhite = p => data[p * 3] >= thr && data[p * 3 + 1] >= thr && data[p * 3 + 2] >= thr;
const push = p => { if (!bg[p] && isWhite(p)) { bg[p] = 1; stack.push(p); } };
for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); } for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
while (stack.length) { const p = stack.pop(); const x = p % W, y = (p / W) | 0; if (x > 0) push(p - 1); if (x < W - 1) push(p + 1); if (y > 0) push(p - W); if (y < H - 1) push(p + W); }
const alpha = Buffer.alloc(W * H); for (let p = 0; p < W * H; p++) alpha[p] = bg[p] ? 0 : 255;
let a = sharp(alpha, { raw: { width: W, height: H, channels: 1 } }); if (+blurS > 0) a = a.blur(+blurS);
const ab = await a.extractChannel(0).raw().toBuffer();
const rgba = Buffer.alloc(W * H * 4); for (let p = 0, i = 0, j = 0; p < W * H; p++, i += 3, j += 4) { rgba[j] = data[i]; rgba[j + 1] = data[i + 1]; rgba[j + 2] = data[i + 2]; rgba[j + 3] = ab[p]; }
await sharp(rgba, { raw: { width: W, height: H, channels: 4 } }).png().toFile(out);
let n = 0; for (let p = 0; p < W * H; p++) if (!bg[p]) n++; console.log(out, W + 'x' + H, 'объект', (100 * n / (W * H)).toFixed(0) + '%');
