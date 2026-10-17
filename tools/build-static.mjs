// Статическая демо-сборка для GitHub Pages: public/ → docs/ с относительными путями и demo.js вместо сервера.
import fs from 'node:fs';
import path from 'node:path';
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const PUB = path.join(ROOT, 'public'), OUT = path.join(ROOT, 'docs');
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(path.join(OUT, 'data'), { recursive: true });
const rel = s => s.replace(/(["'(])\/img\//g, '$1img/').replace(/(["'])\/(style\.css|app\.js|bar\.js)/g, '$1$2');
for (const f of fs.readdirSync(PUB)) {
  const src = path.join(PUB, f), dst = path.join(OUT, f);
  if (fs.statSync(src).isDirectory()) { fs.cpSync(src, dst, { recursive: true }); continue; }
  if (!/\.(html|js|css)$/.test(f)) { fs.copyFileSync(src, dst); continue; }
  let s = fs.readFileSync(src, 'utf8'); s = rel(s);
  if (f === 'index.html') s = s.replace('<script src="app.js"></script>', '<script src="demo.js"></script>\n<script src="app.js"></script>').replace('<title>Bar Tent — menú</title>', '<title>Bar Tent — menú (demo)</title><meta name="robots" content="noindex">');
  if (f === 'bar.html') s = s.replace('<script src="bar.js"></script>', '<script src="demo.js"></script>\n<script src="bar.js"></script>').replace('<title>', '<meta name="robots" content="noindex"><title>');
  fs.writeFileSync(dst, s);
}
fs.copyFileSync(path.join(ROOT, 'data', 'menu.json'), path.join(OUT, 'data', 'menu.json'));
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
const left = []; for (const f of ['index.html', 'app.js', 'bar.html', 'bar.js', 'style.css']) { const s = fs.readFileSync(path.join(OUT, f), 'utf8'); const m = s.match(/["'(]\/(img|style|app|bar)[^"')]*/g); if (m) left.push(f + ': ' + m.slice(0, 3).join(', ')); }
console.log('docs/ собран:', fs.readdirSync(OUT).join(', '), left.length ? '\nОСТАЛИСЬ абсолютные пути: ' + left.join(' | ') : '\nабсолютных путей не осталось');
