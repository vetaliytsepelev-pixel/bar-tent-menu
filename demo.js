/* Демо-режим без сервера (GitHub Pages): /api/* работает в браузере, заказы хранятся в localStorage,
   экран бара на том же устройстве получает их через BroadcastChannel. Подключается только в статической сборке. */
(() => {
  const KEY = 'bt.demo.orders';
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } };
  const save = o => { try { localStorage.setItem(KEY, JSON.stringify(o.slice(-200))); } catch {} };
  const bc = 'BroadcastChannel' in window ? new BroadcastChannel('bar-tent-demo') : null;
  const realFetch = window.fetch.bind(window);
  const json = (obj, status = 200) => new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
  let menu = null;
  async function getMenu() { if (!menu) menu = await (await realFetch('data/menu.json', { cache: 'no-cache' })).json(); return menu; }
  function priceOf(m, id, variant) {
    for (const c of m.categories) {
      const lists = c.items ? [[null, c.items]] : (c.groups || []).map(g => [g, g.items]);
      for (const [g, list] of lists) for (const it of list) if (it.id === id) {
        if (it.variants) { const v = it.variants.find(x => x.id === variant); return v ? { price: v.price, item: it, variant: v } : null; }
        if (g && g.shotBottle) { const v = variant === 'botella' ? { id: 'botella', price: 39 } : { id: 'chupito', price: 2.5 }; return { price: v.price, item: it, variant: v }; }
        return { price: it.price, item: it, variant: null };
      }
    }
    return null;
  }
  const emit = msg => { if (bc) bc.postMessage(msg); };
  window.fetch = async (url, opts = {}) => {
    const u = typeof url === 'string' ? url : (url && url.url) || '';
    if (!u.startsWith('/api/')) return realFetch(url, opts);
    let body = {}; try { body = opts.body ? JSON.parse(opts.body) : {}; } catch {}
    if (u === '/api/menu') return json(await getMenu());
    if (u === '/api/config') return json({ tables: 20, name: 'Bar Tent (demo)' });
    if (u === '/api/orders' && (opts.method || 'GET') === 'POST') {
      const m = await getMenu(); const orders = load(); const table = String(body.table || '').trim();
      if (!table) return json({ error: 'table' }, 400);
      const items = [];
      for (const it of (body.items || []).slice(0, 50)) { const p = priceOf(m, String(it.id), it.variant || undefined); if (!p) continue; items.push({ id: p.item.id, variant: p.variant ? p.variant.id : null, name: p.item.name, variantName: p.variant && p.variant.name ? p.variant.name : null, qty: Math.max(1, Math.min(50, parseInt(it.qty, 10) || 1)), price: p.price }); }
      if (!items.length) return json({ error: 'items' }, 400);
      const total = +items.reduce((s, i) => s + i.price * i.qty, 0).toFixed(2);
      const order = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), no: orders.reduce((x, o) => Math.max(x, o.no || 0), 0) + 1, table, items, total, note: String(body.note || '').slice(0, 300), lang: body.lang || 'es', status: 'new', created: new Date().toISOString(), updated: new Date().toISOString() };
      orders.push(order); save(orders); emit({ type: 'order', order });
      return json({ ok: true, no: order.no, id: order.id, total });
    }
    if (u === '/api/bar/login') return json({ token: 'demo' });
    if (u === '/api/bar/orders') { const since = Date.now() - 24 * 3600 * 1000; return json(load().filter(o => new Date(o.created).getTime() > since)); }
    const st = u.match(/^\/api\/bar\/orders\/([^/]+)\/status$/);
    if (st) { const orders = load(); const o = orders.find(x => x.id === st[1]); if (!o) return json({ error: 'nf' }, 404); o.status = body.status; o.updated = new Date().toISOString(); save(orders); emit({ type: 'status', id: o.id, status: o.status }); return json({ ok: true }); }
    return json({ error: 'demo' }, 404);
  };
  // живое обновление экрана бара на этом же устройстве
  window.EventSource = class {
    constructor() { this.readyState = 1; this._h = e => { if (this.onmessage) this.onmessage({ data: JSON.stringify(e.data) }); }; if (bc) bc.addEventListener('message', this._h); setTimeout(() => this.onopen && this.onopen(), 0); }
    close() { if (bc) bc.removeEventListener('message', this._h); }
  };
  // значок «демо» со ссылкой на экран бара / обратно в меню
  document.addEventListener('DOMContentLoaded', () => {
    const isBar = /bar\.html$/.test(location.pathname);
    const a = document.createElement('a'); a.href = isBar ? 'index.html' : 'bar.html'; a.textContent = isBar ? '‹ меню гостя' : 'DEMO · экран бара ›';
    a.style.cssText = 'position:fixed;left:10px;bottom:' + (isBar ? '12px' : '96px') + ';z-index:50;background:#222;color:#e4d791;border:1px solid #444;border-radius:999px;padding:6px 12px;font:600 12px/1.2 Arial,sans-serif;text-decoration:none;opacity:.9';
    document.body.appendChild(a);
  });
})();
