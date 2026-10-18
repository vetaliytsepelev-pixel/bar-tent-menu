/* Bar Tent — экран гостя. Без сборки: один файл, маршруты в #hash. */
(() => {
  const T = {
    es: { menu: 'Menú', back: 'Atrás', add: 'Añadir', order: 'Ver pedido', yourOrder: 'Tu pedido', table: 'Mesa', tableNo: 'Número de mesa', tableHint: 'Está escrito en la mesa', note: 'Comentario (opcional)', notePh: 'Sin hielo, sin azúcar…', total: 'Total', send: 'Enviar pedido', sending: 'Enviando…', sent: '¡Pedido enviado!', thanks: 'En seguida lo llevamos a la mesa', orderNo: 'Pedido nº', again: 'Volver al menú', empty: 'Todavía no has añadido nada', needTable: 'Indica el número de mesa', failed: 'No se pudo enviar. Inténtalo otra vez o avisa al camarero.', schedule: 'Horario 11:00 – 1:00', lang: 'Idioma', shot: 'Chupito', bottle: 'Botella', clear: 'Vaciar', items: 'artículos' },
    en: { menu: 'Menu', back: 'Back', add: 'Add', order: 'View order', yourOrder: 'Your order', table: 'Table', tableNo: 'Table number', tableHint: 'It is written on the table', note: 'Comment (optional)', notePh: 'No ice, no sugar…', total: 'Total', send: 'Send order', sending: 'Sending…', sent: 'Order sent!', thanks: 'We will bring it to your table shortly', orderNo: 'Order no.', again: 'Back to menu', empty: 'Nothing added yet', needTable: 'Enter your table number', failed: 'Could not send. Try again or call the waiter.', schedule: 'Open 11:00 – 1:00', lang: 'Language', shot: 'Shot', bottle: 'Bottle', clear: 'Clear', items: 'items' },
    uk: { menu: 'Меню', back: 'Назад', add: 'Додати', order: 'Моє замовлення', yourOrder: 'Ваше замовлення', table: 'Стіл', tableNo: 'Номер столика', tableHint: 'Написаний на столику', note: 'Коментар (необов’язково)', notePh: 'Без льоду, без цукру…', total: 'Разом', send: 'Надіслати замовлення', sending: 'Надсилаємо…', sent: 'Замовлення надіслано!', thanks: 'Незабаром принесемо до вашого столика', orderNo: 'Замовлення №', again: 'До меню', empty: 'Ще нічого не додано', needTable: 'Вкажіть номер столика', failed: 'Не вдалося надіслати. Спробуйте ще раз або покличте офіціанта.', schedule: 'Працюємо 11:00 – 1:00', lang: 'Мова', shot: 'Шот', bottle: 'Пляшка', clear: 'Очистити', items: 'позицій' },
  };
  const FLAGS = {
    es: '<svg viewBox="0 0 3 2" class="flag"><rect width="3" height="2" fill="#c60b1e"/><rect y="0.5" width="3" height="1" fill="#ffc400"/></svg>',
    en: '<svg viewBox="0 0 60 30" class="flag"><rect width="60" height="30" fill="#012169"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/><path d="M0,0 L60,30 M60,0 L0,30" stroke="#c8102e" stroke-width="2.5"/><path d="M30,0 V30 M0,15 H60" stroke="#fff" stroke-width="10"/><path d="M30,0 V30 M0,15 H60" stroke="#c8102e" stroke-width="6"/></svg>',
    uk: '<svg viewBox="0 0 3 2" class="flag"><rect width="3" height="1" fill="#0057b7"/><rect y="1" width="3" height="1" fill="#ffd700"/></svg>',
  };
  const CAT_EMOJI = { soft: '🥤', alcohol: '🍷', beer: '🍺', cocktails: '🍸', platos: '🍽️' };
  const ICON = {
    platos: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M6 30h36"/><path d="M9 30a15 15 0 0 1 30 0"/><path d="M24 15v-3"/><path d="M10 36h28"/></svg>',
    cocktails: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M8 8h32L24 26z"/><path d="M24 26v14"/><path d="M15 40h18"/><path d="M13 14h22"/><circle cx="31" cy="7" r="2.5"/></svg>',
    soft: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14h24l-3 26H15z"/><path d="M12 14l-2-6h28l-2 6"/><path d="M26 14l6-10"/><path d="M15 24h17"/></svg>',
    alcohol: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M14 6h8v8c0 4 4 6 4 12v14H10V26c0-6 4-8 4-12z"/><path d="M30 10h10c0 10-4 14-5 15v11h4v4H27v-4h4V25c-1-1-5-5-5-15z"/></svg>',
    beer: '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M12 14h20v26H12z"/><path d="M32 20h5a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-5"/><path d="M12 14c-2-6 4-8 6-6 1-4 9-4 10 0 3-2 7 1 4 6"/><path d="M18 22v12M26 22v12"/></svg>',
  };

  const $app = document.getElementById('app');
  const store = { get: (k, d) => { try { const v = localStorage.getItem('bt.' + k); return v === null ? d : JSON.parse(v); } catch { return d; } }, set: (k, v) => { try { localStorage.setItem('bt.' + k, JSON.stringify(v)); } catch {} } };
  const qs = new URLSearchParams(location.search);
  const state = { lang: store.get('lang', null), table: qs.get('t') || store.get('table', ''), cart: store.get('cart', []), menu: null, busy: false };
  if (qs.get('t')) store.set('table', state.table);
  if (!state.lang) { const nav = (navigator.language || 'es').slice(0, 2); state.lang = ['es', 'en', 'uk'].includes(nav) ? nav : (nav === 'ru' ? 'uk' : 'es'); }
  const t = k => (T[state.lang] || T.es)[k] || k;
  const L = obj => (obj && (obj[state.lang] || obj.es || obj.en)) || '';
  const money = v => (state.lang === 'en' ? '€' + v.toFixed(2) : v.toFixed(2).replace('.', ',') + ' €');
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---- данные меню ----
  const allItems = () => { const out = []; for (const c of state.menu.categories) { const lists = c.items ? [[c, null, c.items]] : c.groups.map(g => [c, g, g.items]); for (const [cat, grp, items] of lists) for (const it of items) out.push({ cat, grp, it }); } return out; };
  const findItem = id => allItems().find(x => x.it.id === id);
  function priceList(entry) { // варианты цены позиции
    const { grp, it } = entry;
    if (it.variants) return it.variants.map(v => ({ vid: v.id, label: L(v.name), price: v.price }));
    if (grp && grp.shotBottle) return [{ vid: 'chupito', label: t('shot'), price: 2.5 }, { vid: 'botella', label: t('bottle') + ' 0,7', price: 39 }];
    return [{ vid: null, label: null, price: it.price }];
  }

  // ---- корзина ----
  const key = (id, vid) => id + (vid ? '|' + vid : '');
  function cartQty(id, vid) { const l = state.cart.find(x => x.key === key(id, vid)); return l ? l.qty : 0; }
  function setQty(id, vid, qty) {
    const k = key(id, vid); const i = state.cart.findIndex(x => x.key === k);
    if (qty <= 0) { if (i >= 0) state.cart.splice(i, 1); } else if (i >= 0) state.cart[i].qty = qty; else state.cart.push({ key: k, id, vid, qty });
    store.set('cart', state.cart); render();
  }
  const cartCount = () => state.cart.reduce((s, l) => s + l.qty, 0);
  function cartLines() { return state.cart.map(l => { const e = findItem(l.id); if (!e) return null; const p = priceList(e).find(v => v.vid === l.vid) || priceList(e)[0]; return { ...l, entry: e, price: p.price, label: p.label }; }).filter(Boolean); }
  const cartTotal = () => cartLines().reduce((s, l) => s + l.price * l.qty, 0);

  // ---- вывод ----
  let lastRoute = null;
  const route = () => { const h = location.hash.replace(/^#\/?/, ''); const [a, b] = h.split('/'); return { page: a || 'home', arg: b }; };
  function render() {
    if (!state.menu) return;
    const r = route(); let html = '';
    if (r.page === 'c') html = renderCategory(r.arg);
    else if (r.page === 'cart') html = renderCart();
    else if (r.page === 'done') html = renderDone(r.arg);
    else html = renderHome();
    if (r.page !== 'cart' && r.page !== 'done' && cartCount()) html += `<div class="cartbar"><button data-go="cart"><span><span class="cnt">${cartCount()}</span></span><span>${t('order')} · ${money(cartTotal())}</span><span>→</span></button></div>`;
    const routeKey = r.page + '/' + (r.arg || ''); const sameScreen = routeKey === lastRoute; const y = window.scrollY;
    $app.innerHTML = html; $app.classList.toggle('home', r.page === 'home' && !cartCount());
    if (sameScreen) window.scrollTo(0, y); else window.scrollTo(0, 0);
    lastRoute = routeKey;
  }
  const langs = () => `<div class="langs">${['es', 'en', 'uk'].map(l => `<button data-lang="${l}" class="${l === state.lang ? 'on' : ''}" aria-label="${l}">${FLAGS[l]}</button>`).join('')}</div>`;
  const tableBadge = () => state.table ? `<span class="table-badge">${t('table')} ${esc(state.table)}</span>` : '';
  function head(title, back) { return `<div class="top"><div class="band">Bar Tent · ${t('schedule')}</div><div class="row">${back !== undefined ? `<button class="back" data-go="${back}" aria-label="${t('back')}">‹</button>` : `<img class="logo" src="/img/logo.svg" alt="Bar Tent">`}<h1>${esc(title)}</h1>${tableBadge()}${langs()}</div></div>`; }
  function renderHome() {
    const m = state.menu;
    const list = m.categories.map(c => `<button class="catbtn" data-go="c/${c.id}"><span class="ico">${ICON[c.id] || ''}</span><span class="lbl">${esc(L(c.name))}</span><span class="chev">›</span></button>`).join('');
    return `<div class="top"><div class="band">Bar Tent · ${t('schedule')}</div><div class="row"><h1>${t('menu')}</h1>${tableBadge()}${langs()}</div></div>
      <div class="hero xl"><img src="/img/logo.svg" alt="Bar Tent"></div>
      ${m.tapasNote ? `<div class="note">${esc(L(m.tapasNote))}</div>` : ''}
      <div class="catlist">${list}</div>`;
  }
  function itemCard(entry) {
    const { it } = entry; const pl = priceList(entry); const q = cartQty(it.id, pl[0].vid);
    const ctrl = pl.length > 1 ? priceButtons(entry, pl) : (q ? stepper(it.id, pl[0].vid, q) : `<button class="add" data-add="${it.id}" aria-label="${t('add')}">+</button>`);
    return `<div class="card"><div class="ph" ${it.photo ? `data-zoom="${it.photo}"` : ''}>${it.photo ? `<img src="/img/${it.photo}-s.jpg" alt="" loading="lazy">` : ''}</div><div class="body"><div class="nm">${esc(L(it.name))}</div>${it.desc ? `<div class="ds">${esc(L(it.desc))}</div>` : ''}<div class="bt">${pl.length > 1 ? '' : `<span class="price">${money(pl[0].price)}</span>`}${ctrl}</div></div></div>`;
  }
  const stepper = (id, vid, q) => `<div class="step"><button data-dec="${id}" data-vid="${vid || ''}">−</button><b>${q}</b><button data-inc="${id}" data-vid="${vid || ''}">+</button></div>`;
  function priceButtons(entry, pl) { return `<div class="pv">${pl.map(v => { const q = cartQty(entry.it.id, v.vid); return `<button data-add="${entry.it.id}" data-vid="${v.vid || ''}"><small>${esc(v.label || '')}</small><b>${money(v.price)}</b>${q ? `<span class="q">×${q}</span>` : ''}</button>`; }).join('')}</div>`; }
  function itemRow(entry) {
    const { it } = entry; const pl = priceList(entry);
    let ctrl; if (pl.length > 1) ctrl = priceButtons(entry, pl); else { const q = cartQty(it.id, pl[0].vid); ctrl = `<span class="price">${money(pl[0].price)}</span>${q ? stepper(it.id, pl[0].vid, q) : `<button class="add" data-add="${it.id}">+</button>`}`; }
    return `<div class="rowitem"><div class="nm">${esc(L(it.name))}${it.desc ? `<span class="ds">${esc(L(it.desc))}</span>` : ''}</div>${ctrl}</div>`;
  }
  function renderCategory(id) {
    const c = state.menu.categories.find(x => x.id === id); if (!c) return renderHome();
    let body = '';
    if (c.layout === 'cards') body = `<div class="cards cat-${c.id}">${c.items.map(it => itemCard({ cat: c, grp: null, it })).join('')}</div>`;
    else body = c.groups.map(g => `<div class="group"><h2>${esc(L(g.name))}</h2>${g.items.map(it => itemRow({ cat: c, grp: g, it })).join('')}</div>`).join('');
    return head(L(c.name), '') + body + '<div class="footer"></div>';
  }
  function renderCart() {
    const lines = cartLines();
    if (!lines.length) return head(t('yourOrder'), '') + `<div class="empty">${t('empty')}</div><div class="cart"><button class="big ghost" data-go="">${t('again')}</button></div>`;
    const rows = lines.map(l => `<div class="line"><div class="nm">${esc(L(l.entry.it.name))}${l.label ? `<small>${esc(l.label)}</small>` : ''}<small>${money(l.price)}</small></div>${stepper(l.id, l.vid, l.qty)}<span class="price">${money(l.price * l.qty)}</span></div>`).join('');
    return head(t('yourOrder'), '') + `<div class="cart">${rows}<div class="sum"><span>${t('total')}</span><span>${money(cartTotal())}</span></div>
      <label>${t('tableNo')}</label><input class="table" id="table" inputmode="numeric" maxlength="4" placeholder="12" value="${esc(state.table)}"><div style="color:var(--muted);font-size:13px;margin-top:4px">${t('tableHint')}</div>
      <label>${t('note')}</label><textarea id="note" rows="2" placeholder="${t('notePh')}"></textarea><div class="err" id="err"></div>
      <button class="big" id="send">${t('send')}</button><button class="big ghost" data-go="">${t('again')}</button></div>`;
  }
  function renderDone(no) { return head(t('sent'), '') + `<div class="done"><div class="ok">✓</div><h2>${t('sent')}</h2><p>${t('orderNo')}</p><div class="no">${esc(no || '')}</div><p>${t('table')} ${esc(state.table)} · ${t('thanks')}</p><button class="big" data-go="">${t('again')}</button></div>`; }

  // ---- события ----
  $app.addEventListener('click', async e => {
    const z = e.target.closest('[data-zoom]');
    if (z) { const ov = document.createElement('div'); ov.className = 'zoom'; ov.innerHTML = `<img src="/img/${z.dataset.zoom}.jpg" alt=""><span class="x">✕</span>`; ov.addEventListener('click', () => ov.remove()); document.body.appendChild(ov); return; }
    const b = e.target.closest('button'); if (!b) return;
    if (b.dataset.lang) { state.lang = b.dataset.lang; store.set('lang', state.lang); document.documentElement.lang = state.lang; render(); return; }
    if (b.dataset.go !== undefined) { location.hash = b.dataset.go ? '#/' + b.dataset.go : ''; return; }
    const vid = b.dataset.vid || null;
    if (b.dataset.add) { setQty(b.dataset.add, vid, cartQty(b.dataset.add, vid) + 1); return; }
    if (b.dataset.inc) { setQty(b.dataset.inc, vid, cartQty(b.dataset.inc, vid) + 1); return; }
    if (b.dataset.dec) { setQty(b.dataset.dec, vid, cartQty(b.dataset.dec, vid) - 1); return; }
    if (b.id === 'send') sendOrder(b);
  });
  $app.addEventListener('input', e => { if (e.target.id === 'table') { state.table = e.target.value.trim(); store.set('table', state.table); } });
  async function sendOrder(btn) {
    const err = document.getElementById('err'); err.textContent = '';
    const table = (document.getElementById('table').value || '').trim(); if (!table) { err.textContent = t('needTable'); return; }
    state.table = table; store.set('table', table);
    btn.disabled = true; btn.textContent = t('sending');
    try {
      const r = await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ table, lang: state.lang, note: document.getElementById('note').value, items: state.cart.map(l => ({ id: l.id, variant: l.vid, qty: l.qty })) }) });
      const j = await r.json(); if (!r.ok || !j.ok) throw new Error('bad');
      state.cart = []; store.set('cart', []); location.hash = '#/done/' + j.no;
    } catch { err.textContent = t('failed'); btn.disabled = false; btn.textContent = t('send'); }
  }
  window.addEventListener('hashchange', render);
  fetch('/api/menu').then(r => r.json()).then(m => { state.menu = m; document.documentElement.lang = state.lang; render(); }).catch(() => { $app.innerHTML = '<div class="loading">Error</div>'; });
})();
