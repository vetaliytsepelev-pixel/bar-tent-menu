/* Bar Tent — экран бара: заказы по столикам, живое обновление, звук. */
(() => {
  const T = {
    es: { title: 'Pedidos', pin: 'PIN del bar', enter: 'Entrar', bad: 'PIN incorrecto', new: 'Nuevos', working: 'En preparación', done: 'Listos / servidos', accept: 'Aceptar', ready: 'Servido', cancel: 'Cancelar', undo: 'Devolver', table: 'Mesa', none: 'Nada por ahora', live: 'en vivo', offline: 'sin conexión', sound: 'Sonido', clearDone: 'Ocultar los servidos' },
    uk: { title: 'Замовлення', pin: 'PIN бару', enter: 'Увійти', bad: 'Невірний PIN', new: 'Нові', working: 'Готуються', done: 'Подано', accept: 'Прийняти', ready: 'Подано', cancel: 'Скасувати', undo: 'Повернути', table: 'Стіл', none: 'Поки нічого', live: 'онлайн', offline: 'немає зв’язку', sound: 'Звук', clearDone: 'Сховати подані' },
    en: { title: 'Orders', pin: 'Bar PIN', enter: 'Enter', bad: 'Wrong PIN', new: 'New', working: 'In progress', done: 'Served', accept: 'Accept', ready: 'Served', cancel: 'Cancel', undo: 'Return', table: 'Table', none: 'Nothing yet', live: 'live', offline: 'offline', sound: 'Sound', clearDone: 'Hide served' },
  };
  const $ = document.getElementById('app');
  let lang = localStorage.getItem('bt.barlang') || 'es'; const t = k => (T[lang] || T.es)[k];
  let token = sessionStorage.getItem('bt.token') || ''; let orders = []; let live = false; let sound = localStorage.getItem('bt.sound') !== '0';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const money = v => v.toFixed(2).replace('.', ',') + ' €';
  const nameOf = (obj) => obj && (obj.es || obj.en || obj.uk) || '';
  const hm = iso => { const d = new Date(iso); return d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0'); };

  function beep() { if (!sound) return; try { const ac = new (window.AudioContext || window.webkitAudioContext)(); const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.value = 880; o.connect(g); g.connect(ac.destination); g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.4, ac.currentTime + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.6); o.start(); o.stop(ac.currentTime + 0.65); setTimeout(() => { const o2 = ac.createOscillator(), g2 = ac.createGain(); o2.frequency.value = 1175; o2.connect(g2); g2.connect(ac.destination); g2.gain.setValueAtTime(0.3, ac.currentTime); g2.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.6); o2.start(); o2.stop(ac.currentTime + 0.6); }, 250); } catch {} }

  function renderLogin(err) { $.innerHTML = `<div class="login"><img src="/img/logo.svg" style="height:90px"><h2 style="margin-top:10px">${t('pin')}</h2><input id="pin" type="password" inputmode="numeric" autocomplete="off"><div style="color:var(--red);min-height:20px">${err ? t('bad') : ''}</div><button id="go">${t('enter')}</button></div>`; const i = document.getElementById('pin'); i.focus(); const go = async () => { const r = await fetch('/api/bar/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin: i.value }) }); if (!r.ok) return renderLogin(true); token = (await r.json()).token; sessionStorage.setItem('bt.token', token); start(); }; document.getElementById('go').onclick = go; i.onkeydown = e => { if (e.key === 'Enter') go(); }; }

  function card(o) {
    const items = o.items.map(i => `<li><b>${i.qty}×</b><span>${esc(nameOf(i.name))}${i.variantName ? ` <small>· ${esc(nameOf(i.variantName))}</small>` : ''}</span></li>`).join('');
    let btns = '';
    if (o.status === 'new') btns = `<button class="b-accept" data-st="working" data-id="${o.id}">${t('accept')}</button><button class="b-done" data-st="done" data-id="${o.id}">${t('ready')}</button><button class="b-cancel" data-st="cancelled" data-id="${o.id}">${t('cancel')}</button>`;
    else if (o.status === 'working') btns = `<button class="b-done" data-st="done" data-id="${o.id}">${t('ready')}</button><button class="b-cancel" data-st="cancelled" data-id="${o.id}">${t('cancel')}</button>`;
    else btns = `<button class="b-undo" data-st="new" data-id="${o.id}">${t('undo')}</button>`;
    return `<div class="card ${o.status}"><div class="hd"><span class="tb">${t('table')} ${esc(o.table)}</span><span class="no">#${o.no}</span><span class="tm">${hm(o.created)}</span></div><ul>${items}</ul>${o.note ? `<div class="note">${esc(o.note)}</div>` : ''}<div class="ft"><span class="tot">${money(o.total)}</span>${btns}</div></div>`;
  }
  function render() {
    const by = st => orders.filter(o => o.status === st).sort((a, b) => (st === 'done' ? -1 : 1) * (new Date(a.created) - new Date(b.created)));
    const col = (st, list) => `<div class="col"><h2>${t(st)} <b>${list.length}</b></h2>${list.length ? list.map(card).join('') : `<div class="empty">${t('none')}</div>`}</div>`;
    $.innerHTML = `<div class="top"><img src="/img/logo.svg" alt=""><h1>${t('title')}</h1><span class="st ${live ? 'on' : ''}">● ${live ? t('live') : t('offline')}</span><button id="snd">${sound ? '🔔' : '🔕'} ${t('sound')}</button><select id="lang">${['es', 'uk', 'en'].map(l => `<option value="${l}" ${l === lang ? 'selected' : ''}>${l.toUpperCase()}</option>`).join('')}</select></div>
      <div class="cols">${col('new', by('new'))}${col('working', by('working'))}${col('done', by('done').slice(0, 30))}</div>`;
    document.getElementById('lang').onchange = e => { lang = e.target.value; localStorage.setItem('bt.barlang', lang); render(); };
    document.getElementById('snd').onclick = () => { sound = !sound; localStorage.setItem('bt.sound', sound ? '1' : '0'); if (sound) beep(); render(); };
    document.title = (by('new').length ? `(${by('new').length}) ` : '') + 'Bar Tent — ' + t('title');
  }
  $.addEventListener('click', async e => { const b = e.target.closest('button[data-st]'); if (!b) return; b.disabled = true; const r = await fetch(`/api/bar/orders/${b.dataset.id}/status`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Bar-Token': token }, body: JSON.stringify({ status: b.dataset.st }) }); if (r.status === 401) return renderLogin(); const o = orders.find(x => x.id === b.dataset.id); if (o) o.status = b.dataset.st; render(); });

  async function load() { const r = await fetch('/api/bar/orders', { headers: { 'X-Bar-Token': token } }); if (r.status === 401) { token = ''; sessionStorage.removeItem('bt.token'); renderLogin(); return false; } orders = await r.json(); render(); return true; }
  let es = null;
  function connect() {
    if (es) es.close(); es = new EventSource('/api/bar/stream?token=' + encodeURIComponent(token));
    es.onopen = () => { live = true; render(); };
    es.onerror = () => { live = false; render(); };
    es.onmessage = ev => { const m = JSON.parse(ev.data); if (m.type === 'order') { orders.push(m.order); beep(); render(); } else if (m.type === 'status') { const o = orders.find(x => x.id === m.id); if (o) { o.status = m.status; render(); } } };
  }
  async function start() { if (await load()) { connect(); setInterval(load, 60000); } }
  if (token) start(); else renderLogin();
})();
