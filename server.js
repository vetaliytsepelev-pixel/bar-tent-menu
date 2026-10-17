// Bar Tent — QR-меню с заказом на столик. Запуск: node server.js  (порт 3000 или PORT)
// Гость: http://<адрес>/?t=12   Бар: http://<адрес>/bar   QR-коды для печати: http://<адрес>/qr
const express = require('express');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

const ROOT = __dirname;
const DATA = path.join(ROOT, 'data');
const ORDERS_FILE = path.join(DATA, 'orders.json');
const CONFIG = JSON.parse(fs.readFileSync(path.join(DATA, 'config.json'), 'utf8'));
const PORT = process.env.PORT || CONFIG.port || 3000;

const app = express();
app.use(express.json({ limit: '200kb' }));
app.use(express.static(path.join(ROOT, 'public'), { index: 'index.html', setHeaders: (res, p) => { res.set('Cache-Control', /[/]img[/]/.test(p) ? 'public, max-age=86400' : 'no-cache'); } }));

// ---------- меню ----------
let menu = loadMenu();
function loadMenu() { return JSON.parse(fs.readFileSync(path.join(DATA, 'menu.json'), 'utf8')); }
fs.watchFile(path.join(DATA, 'menu.json'), { interval: 2000 }, () => { try { menu = loadMenu(); console.log('меню перечитано'); } catch (e) { console.error('menu.json: ' + e.message); } });
app.get('/api/menu', (req, res) => res.json(menu));
app.get('/api/config', (req, res) => res.json({ tables: CONFIG.tables, name: CONFIG.name }));

// ---------- заказы ----------
let orders = [];
try { orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8')); } catch { orders = []; }
let nextNo = orders.reduce((m, o) => Math.max(m, o.no || 0), 0) + 1;
function saveOrders() { fs.writeFile(ORDERS_FILE, JSON.stringify(orders, null, 1), () => {}); }

// карта цен по меню — цены берём с сервера, а не от клиента
function priceOf(id, variant) {
  for (const c of menu.categories) {
    const lists = c.items ? [c.items] : (c.groups || []).map(g => g.items);
    for (const list of lists) for (const it of list) if (it.id === id) {
      if (it.variants) { const v = it.variants.find(x => x.id === variant); return v ? { price: v.price, item: it, variant: v } : null; }
      const g = (c.groups || []).find(gr => gr.items.includes(it));
      if (g && g.shotBottle) { const v = variant === 'botella' ? { id: 'botella', price: 39 } : { id: 'chupito', price: 2.5 }; return { price: v.price, item: it, variant: v }; }
      return { price: it.price, item: it, variant: null };
    }
  }
  return null;
}

app.post('/api/orders', (req, res) => {
  const b = req.body || {};
  const table = String(b.table || '').trim();
  if (!table || !/^[0-9A-Za-zА-Яа-яЇїІіЄє -]{1,8}$/.test(table)) return res.status(400).json({ error: 'table' });
  if (!Array.isArray(b.items) || !b.items.length) return res.status(400).json({ error: 'items' });
  const items = [];
  for (const it of b.items.slice(0, 50)) {
    const qty = Math.max(1, Math.min(50, parseInt(it.qty, 10) || 1));
    const p = priceOf(String(it.id), it.variant ? String(it.variant) : undefined);
    if (!p) continue;
    items.push({ id: p.item.id, variant: p.variant ? p.variant.id : null, name: p.item.name, variantName: p.variant && p.variant.name ? p.variant.name : null, qty, price: p.price });
  }
  if (!items.length) return res.status(400).json({ error: 'items' });
  const total = +items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
  const order = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), no: nextNo++, table, items, total, note: String(b.note || '').slice(0, 300), lang: String(b.lang || 'es').slice(0, 2), status: 'new', created: new Date().toISOString(), updated: new Date().toISOString() };
  orders.push(order); if (orders.length > 2000) orders = orders.slice(-2000);
  saveOrders(); broadcast({ type: 'order', order });
  console.log(`заказ №${order.no} стол ${table}: ${items.map(i => i.qty + '× ' + i.name.es).join(', ')} = ${total} €`);
  res.json({ ok: true, no: order.no, id: order.id, total });
});
app.get('/api/orders/:id', (req, res) => { const o = orders.find(x => x.id === req.params.id); if (!o) return res.status(404).end(); res.json({ no: o.no, status: o.status, table: o.table, total: o.total }); });

// ---------- бар ----------
const tokens = new Set();
function barAuth(req, res, next) { const t = (req.headers['x-bar-token'] || req.query.token || '').toString(); if (CONFIG.barPin && !tokens.has(t)) return res.status(401).json({ error: 'auth' }); next(); }
app.post('/api/bar/login', (req, res) => { if (CONFIG.barPin && String((req.body || {}).pin) !== String(CONFIG.barPin)) return res.status(403).json({ error: 'pin' }); const t = Math.random().toString(36).slice(2) + Date.now().toString(36); tokens.add(t); res.json({ token: t }); });
app.get('/api/bar/orders', barAuth, (req, res) => { const since = Date.now() - 24 * 3600 * 1000; res.json(orders.filter(o => new Date(o.created).getTime() > since)); });
app.post('/api/bar/orders/:id/status', barAuth, (req, res) => {
  const o = orders.find(x => x.id === req.params.id); if (!o) return res.status(404).end();
  const st = String((req.body || {}).status); if (!['new', 'working', 'done', 'cancelled'].includes(st)) return res.status(400).end();
  o.status = st; o.updated = new Date().toISOString(); saveOrders(); broadcast({ type: 'status', id: o.id, status: st }); res.json({ ok: true });
});
const clients = new Set();
app.get('/api/bar/stream', barAuth, (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' }); res.flushHeaders();
  res.write('data: {"type":"hello"}\n\n'); clients.add(res); const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  req.on('close', () => { clearInterval(ping); clients.delete(res); });
});
function broadcast(msg) { const s = 'data: ' + JSON.stringify(msg) + '\n\n'; for (const c of clients) c.write(s); }

// ---------- QR-коды ----------
function baseUrl(req) { return CONFIG.publicUrl || (req.protocol + '://' + req.get('host')); }
app.get('/qr/:table.png', async (req, res) => { res.type('png'); res.send(await QRCode.toBuffer(baseUrl(req) + '/?t=' + encodeURIComponent(req.params.table), { width: 600, margin: 1, color: { dark: '#000000', light: '#ffffff' } })); });
app.get('/qr', async (req, res) => {
  const n = Math.min(100, parseInt(req.query.n, 10) || CONFIG.tables || 20); const cells = [];
  for (let t = 1; t <= n; t++) cells.push(`<div class="c"><img src="/qr/${t}.png" alt="QR"><div class="t">Mesa · Table · Стіл<br><b>${t}</b></div><div class="u">${baseUrl(req)}/?t=${t}</div></div>`);
  res.send(`<!doctype html><html lang="es"><head><meta charset="utf-8"><title>QR Bar Tent</title><style>body{font-family:Arial,sans-serif;margin:10mm}h1{font-size:18px}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:8mm}.c{border:1px dashed #999;border-radius:6mm;padding:5mm;text-align:center;break-inside:avoid}.c img{width:45mm;height:45mm}.t{font-size:14px;margin-top:2mm}.t b{font-size:26px}.u{font-size:9px;color:#777;margin-top:1mm}@media print{h1,p{display:none}}</style></head><body><h1>QR-коды столиков (печать: Ctrl+P). Число столиков: /qr?n=30</h1><div class="g">${cells.join('')}</div></body></html>`);
});

app.get(['/bar', '/bar/'], (req, res) => res.sendFile(path.join(ROOT, 'public', 'bar.html')));
// статическое демо (как на GitHub Pages): node tools/build-static.mjs → docs/
if (fs.existsSync(path.join(ROOT, 'docs'))) app.use('/demo', express.static(path.join(ROOT, 'docs'), { setHeaders: res => res.set('Cache-Control', 'no-cache') }));

app.listen(PORT, () => console.log(`Bar Tent: http://localhost:${PORT}  бар: /bar  QR: /qr  (PIN бара: ${CONFIG.barPin || 'без PIN'})`));
