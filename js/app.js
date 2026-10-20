/* 27Study interface. One render() draws the whole page from the store. */
(function () {
  const $app = document.getElementById('app');
  const S = () => Store.get();
  const L = Logic;
  const ROUTES = [['today', 'Today'], ['tasks', 'Tasks'], ['shop', 'Shop'], ['history', 'History'], ['settings', 'Settings']];

  const ICON = {
    gem: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2.5 21 12l-9 9.5L3 12z"/></svg>',
    streak: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 17l5-6 4 3 7-9"/><path d="M15 5h5v5"/></svg>'
  };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');
  const clock = sec => { sec = Math.max(0, Math.floor(sec)); return pad(Math.floor(sec / 3600)) + ':' + pad(Math.floor(sec % 3600 / 60)) + ':' + pad(sec % 60); };
  const dur = sec => { const m = Math.round(sec / 60), h = Math.floor(m / 60); return h ? h + 'h ' + pad(m % 60) + 'm' : m + 'm'; };
  const gemN = n => '<span class="gem-n">' + ICON.gem + Number(n).toLocaleString('en-AU') + '</span>';
  const dayLabel = t => new Date(t).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  const nameOf = (list, id) => { const x = list.find(i => i.id === id); return x ? x.name : ''; };

  let route = (location.hash || '#today').slice(1);
  if (!ROUTES.some(r => r[0] === route)) route = 'today';
  const ui = { draft: { subjectId: '', todoId: '' }, finishTask: false, flash: null, taskSubject: '', showDone: false, editShop: false };

  /* ---------- chrome ---------- */
  function header(tl) {
    return '<header class="top"><div class="top-in"><span class="brand">27Study</span>' +
      '<nav class="nav" aria-label="Main">' + ROUTES.map(r =>
        '<a href="#' + r[0] + '"' + (r[0] === route ? ' aria-current="page"' : '') + '>' + r[1] + '</a>').join('') + '</nav>' +
      '<div class="stats"><span class="stat streak" title="Goals met in a row">' + ICON.streak + tl.streak + '</span>' +
      '<span class="stat gems" title="Gems">' + ICON.gem + L.balance(S()).toLocaleString('en-AU') + '</span></div></div></header>';
  }

  /* ---------- setup ---------- */
  function viewSetup() {
    return '<div class="setup"><h1>Set up 27Study</h1>' +
      '<p class="sub">Four answers and you are ready. You can change all of it later in Settings.</p>' +
      '<form data-form="setup" class="panel">' +
      '<div class="field"><label for="su-sub">Your subjects, one per line</label>' +
      '<textarea id="su-sub" name="subjects" placeholder="Maths Methods&#10;English&#10;Chemistry"></textarea></div>' +
      '<div class="field"><label for="su-lvl">Importance levels, lowest first, one per line</label>' +
      '<textarea id="su-lvl" name="levels">Low\nMedium\nHigh</textarea>' +
      '<p class="hint">Used to rank your tasks. Call them anything you like.</p></div>' +
      '<div class="fields"><div class="field"><label for="su-wn">Minutes each weeknight</label><input id="su-wn" name="wn" type="number" min="1" value="60"></div>' +
      '<div class="field"><label for="su-we">Minutes across the weekend</label><input id="su-we" name="we" type="number" min="1" value="240"></div></div>' +
      '<div class="row end"><button class="btn primary" type="submit">Start studying</button></div></form></div>';
  }

  /* ---------- today ---------- */
  function viewToday(tl) {
    const st = S().settings, a = S().active, now = Date.now();
    const u = L.unitOf(new Date(now), st), done = L.unitSecs(S(), u), left = Math.max(0, u.goalSec - done);
    const frac = Math.min(1, done / u.goalSec), C = 2 * Math.PI * 140;
    const met = done >= u.goalSec;
    const title = u.kind === 'weekend' ? 'This weekend' : 'Tonight';
    const open = S().todos.filter(t => !t.done);
    const todo = a ? S().todos.find(t => t.id === a.todoId) : null;

    let mid, controls;
    if (a) {
      mid = '<div class="clock" id="clock">' + clock((now - a.start) / 1000) + '</div>' +
        '<div class="clock-sub">' + (met ? 'Goal already met' : clock(left) + ' left of ' + dur(u.goalSec)) + '</div>';
      controls = '<p class="working">' + (todo ? esc(todo.title) : 'Open study') +
        (a.subjectId ? ' · ' + esc(nameOf(S().subjects, a.subjectId)) : '') + '</p>' +
        (todo ? '<p class="working"><label style="display:inline-flex;gap:8px;align-items:center;margin:0;font-size:0.9rem"><input class="check" type="checkbox" data-bind="finishTask"' + (ui.finishTask ? ' checked' : '') + '> Mark this task done</label></p>' : '') +
        '<div class="timer-actions"><button class="btn primary" data-act="done">Done</button>' +
        '<button class="btn quiet" data-act="discard">Discard</button></div>';
    } else {
      mid = met
        ? '<div class="clock met-line" style="font-size:2rem">Goal met</div><div class="clock-sub">' + dur(done) + ' studied</div>'
        : '<div class="clock">' + clock(left) + '</div><div class="clock-sub">left ' + (u.kind === 'weekend' ? 'this weekend' : 'tonight') + '</div>';
      controls = '<div class="session-pick"><div class="fields">' +
        '<div><label for="pick-todo">Working on</label><select id="pick-todo" data-bind="todoId"><option value="">Anything</option>' +
        open.map(t => '<option value="' + t.id + '"' + (ui.draft.todoId === t.id ? ' selected' : '') + '>' + esc(t.title) + '</option>').join('') + '</select></div>' +
        '<div><label for="pick-sub">Subject</label><select id="pick-sub" data-bind="subjectId"><option value="">None</option>' +
        S().subjects.map(s => '<option value="' + s.id + '"' + (ui.draft.subjectId === s.id ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select></div>' +
        '</div></div><div class="timer-actions"><button class="btn primary" data-act="start">Start</button></div>';
    }

    const sess = S().sessions.filter(s => s.start >= u.start.getTime() && s.start < u.end.getTime()).slice().reverse();
    const sum = ui.flash ? '<p class="summary">Logged ' + dur(ui.flash.secs) + (ui.flash.gems ? ' and earned ' + gemN(ui.flash.gems) : '') + '.</p>' : '';

    return '<div class="page-head"><h1>' + title + '</h1><span class="sub">Goal ' + dur(u.goalSec) + '</span></div>' +
      '<section class="panel"><div class="timer-wrap"><div class="ring"><svg viewBox="0 0 300 300" aria-hidden="true">' +
      '<circle class="track" cx="150" cy="150" r="140" fill="none" stroke-width="8"/>' +
      '<circle class="bar" cx="150" cy="150" r="140" fill="none" stroke-width="8" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - frac)).toFixed(1) + '"/></svg>' +
      '<div class="ring-mid"><div>' + mid + '</div></div></div></div>' + controls + sum + '</section>' +
      (sess.length ? '<section class="panel"><h2>Sessions ' + (u.kind === 'weekend' ? 'this weekend' : 'today') + '</h2><ul class="list">' + sess.map(s =>
        '<li><span class="t">' + dur(s.secs) + ' <span class="sub">' + new Date(s.start).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }) + '</span></span>' +
        '<span class="meta">' + (s.subjectId ? '<span class="chip">' + esc(nameOf(S().subjects, s.subjectId)) + '</span>' : '') +
        (s.todoId && S().todos.find(t => t.id === s.todoId) ? '<span class="chip lvl">' + esc(S().todos.find(t => t.id === s.todoId).title) + '</span>' : '') + '</span></li>').join('') + '</ul></section>' : '') +
      (tl.freezesLeft ? '<p class="sub" style="margin-top:14px;text-align:center">' + tl.freezesLeft + ' streak freeze' + (tl.freezesLeft > 1 ? 's' : '') + ' ready</p>' : '');
  }

  /* ---------- tasks ---------- */
  function viewTasks() {
    const d = S(), lvlIdx = id => d.levels.findIndex(l => l.id === id);
    const studied = id => d.sessions.filter(s => s.todoId === id).reduce((a, s) => a + s.secs, 0);
    let list = d.todos.filter(t => !ui.taskSubject || t.subjectId === ui.taskSubject);
    const open = list.filter(t => !t.done).sort((a, b) => lvlIdx(b.levelId) - lvlIdx(a.levelId) || b.at - a.at);
    const closed = list.filter(t => t.done).sort((a, b) => b.at - a.at);
    const row = t => '<li class="' + (t.done ? 'done' : '') + '"><input class="check" type="checkbox" data-act="toggle" data-id="' + t.id + '"' + (t.done ? ' checked' : '') + ' aria-label="Done: ' + esc(t.title) + '">' +
      '<span class="t">' + esc(t.title) + '</span><span class="meta">' +
      (t.subjectId ? '<span class="chip">' + esc(nameOf(d.subjects, t.subjectId)) + '</span>' : '') +
      (t.levelId ? '<span class="chip lvl' + (lvlIdx(t.levelId) === d.levels.length - 1 && d.levels.length > 1 ? ' top1' : '') + '">' + esc(nameOf(d.levels, t.levelId)) + '</span>' : '') +
      (studied(t.id) ? '<span class="sub">' + dur(studied(t.id)) + '</span>' : '') + '</span>' +
      '<button class="btn quiet small" data-act="del-todo" data-id="' + t.id + '" aria-label="Delete ' + esc(t.title) + '">Delete</button></li>';
    const opt = (arr, none) => '<option value="">' + none + '</option>' + arr.map(x => '<option value="' + x.id + '">' + esc(x.name) + '</option>').join('');

    return '<div class="page-head"><h1>Tasks</h1><span class="sub">' + open.length + ' to do</span></div>' +
      '<form class="panel" data-form="todo"><div class="add-row"><input type="text" name="title" placeholder="Add a task" aria-label="Task" required maxlength="140">' +
      '<select name="subjectId" aria-label="Subject">' + opt(d.subjects, 'No subject') + '</select>' +
      '<select name="levelId" aria-label="Importance">' + opt(d.levels, 'No importance') + '</select>' +
      '<button class="btn primary" type="submit">Add</button></div></form>' +
      '<section class="panel">' +
      (d.subjects.length ? '<div class="filters"><button data-act="filter" data-id="" aria-pressed="' + (!ui.taskSubject) + '">All</button>' +
        d.subjects.map(s => '<button data-act="filter" data-id="' + s.id + '" aria-pressed="' + (ui.taskSubject === s.id) + '">' + esc(s.name) + '</button>').join('') + '</div>' : '') +
      (open.length ? '<ul class="list">' + open.map(row).join('') + '</ul>' : '<p class="empty">Nothing to do here. Add a task above.</p>') +
      (closed.length ? '<div class="row" style="margin-top:12px"><button class="btn quiet small" data-act="toggle-done-list">' + (ui.showDone ? 'Hide' : 'Show') + ' ' + closed.length + ' finished</button></div>' +
        (ui.showDone ? '<ul class="list">' + closed.map(row).join('') + '</ul>' : '') : '') + '</section>';
  }

  /* ---------- shop ---------- */
  function viewShop(tl) {
    const d = S(), bal = L.balance(d);
    const owned = d.purchases.filter(p => p.kind === 'reward' && !p.used).slice().reverse();
    const item = i => '<div class="item"><div><div class="name">' + esc(i.name) + '</div>' +
      (i.kind === 'freeze' ? '<p class="sub">Covers one missed day or weekend. You have ' + tl.freezesLeft + '.</p>' : '') + '</div>' +
      '<div class="price">' + gemN(i.price) + '<button class="btn primary small" data-act="buy" data-id="' + i.id + '"' + (bal < i.price ? ' disabled' : '') + '>Buy</button></div></div>';

    const edit = '<section class="panel"><h2>Edit shop</h2><ul class="list">' + d.shop.map(i =>
      '<li><input type="text" class="grow" data-shop="name" data-id="' + i.id + '" value="' + esc(i.name) + '" aria-label="Item name"' + (i.kind === 'freeze' ? ' disabled' : '') + '>' +
      '<input type="number" min="0" style="width:96px" data-shop="price" data-id="' + i.id + '" value="' + i.price + '" aria-label="Price in gems">' +
      (i.kind === 'freeze' ? '<span class="sub" style="width:64px"></span>' : '<button class="btn quiet small danger" data-act="del-item" data-id="' + i.id + '">Remove</button>') + '</li>').join('') + '</ul>' +
      '<form data-form="item" class="row" style="margin-top:14px"><input type="text" name="name" class="grow" placeholder="New reward, e.g. An episode of a show" aria-label="New item name" required maxlength="80">' +
      '<input type="number" name="price" min="0" style="width:96px" placeholder="Price" aria-label="New item price" required>' +
      '<button class="btn primary" type="submit">Add</button></form></section>';

    return '<div class="page-head"><h1>Shop</h1><span class="row">' + gemN(bal) +
      '<button class="btn small" data-act="toggle-edit">' + (ui.editShop ? 'Close editor' : 'Edit shop') + '</button></span></div>' +
      (ui.editShop ? edit : '') +
      '<section class="section"><div class="shop-grid">' + d.shop.map(item).join('') + '</div>' +
      (d.shop.length === 1 ? '<p class="sub" style="margin-top:14px">Add your own rewards with Edit shop.</p>' : '') + '</section>' +
      (owned.length ? '<section class="panel"><h2>Yours to use</h2><ul class="list">' + owned.map(p =>
        '<li><span class="t">' + esc(p.name) + ' <span class="sub">bought ' + dayLabel(p.at) + '</span></span><button class="btn small" data-act="use" data-id="' + p.id + '">Mark used</button></li>').join('') + '</ul></section>' : '');
  }

  /* ---------- history ---------- */
  function viewHistory(tl) {
    const d = S(), now = Date.now(), today = L.startOfDay(now);
    const byKey = {}; tl.units.forEach(u => { byKey[u.key] = u; });
    const dow = (today.getDay() + 6) % 7, monday = L.addDays(today, -dow - 7 * 7);
    let cells = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(x => '<span class="dow">' + x + '</span>').join('');
    for (let i = 0; i < 56; i++) {
      const day = L.addDays(monday, i);
      if (day > today) { cells += '<span class="cell none"></span>'; continue; }
      const u = byKey[L.unitOf(day, d.settings).key];
      cells += '<span class="cell ' + (u ? u.status : '') + '" title="' + dayLabel(day) + (u ? ' · ' + dur(u.secs) : '') + '"></span>';
    }
    const best = tl.units.reduce((m, u) => Math.max(m, u.streak), 0);
    const total = d.sessions.reduce((a, s) => a + s.secs, 0);
    const weekStart = L.addDays(today, -dow).getTime();
    const week = d.sessions.filter(s => s.start >= weekStart).reduce((a, s) => a + s.secs, 0);
    const by = d.subjects.map(s => ({ n: s.name, v: d.sessions.filter(x => x.subjectId === s.id).reduce((a, x) => a + x.secs, 0) })).filter(x => x.v).sort((a, b) => b.v - a.v);
    const none = d.sessions.filter(x => !x.subjectId || !d.subjects.some(s => s.id === x.subjectId)).reduce((a, x) => a + x.secs, 0);
    if (none) by.push({ n: 'No subject', v: none });
    const max = Math.max(1, ...by.map(x => x.v));
    const recent = d.sessions.slice(-8).reverse();
    const gems = d.ledger.slice(-8).reverse();

    return '<div class="page-head"><h1>History</h1></div>' +
      '<section class="panel"><div class="fields" style="text-align:left">' +
      [['This week', dur(week)], ['All time', dur(total)], ['Longest streak', best], ['Sessions', d.sessions.length]].map(x =>
        '<div><div class="sub">' + x[0] + '</div><div style="font-size:1.5rem;font-weight:600">' + x[1] + '</div></div>').join('') + '</div></section>' +
      '<section class="panel"><h2>Last 8 weeks</h2><div class="heat">' + cells + '</div>' +
      '<div class="legend"><span><i style="background:var(--accent)"></i>Goal met</span><span><i style="box-shadow:inset 0 0 0 2px var(--accent);background:var(--accent-soft)"></i>Freeze used</span><span><i style="background:var(--warn);opacity:.55"></i>Missed</span><span><i style="box-shadow:inset 0 0 0 1px var(--muted)"></i>In progress</span></div>' +
      '<p class="hint">Saturday and Sunday are one goal, so they share a colour.</p></section>' +
      '<section class="panel"><h2>By subject</h2>' + (by.length ? '<div class="bars">' + by.map(x =>
        '<div class="bar-row"><span>' + esc(x.n) + '</span><div class="b"><span style="width:' + (x.v / max * 100).toFixed(1) + '%"></span></div><span class="v">' + dur(x.v) + '</span></div>').join('') + '</div>' : '<p class="empty">Study a session to see your time by subject.</p>') + '</section>' +
      '<section class="panel"><h2>Recent sessions</h2>' + (recent.length ? '<ul class="list">' + recent.map(s =>
        '<li><span class="t">' + dayLabel(s.start) + '</span><span class="meta">' + (s.subjectId ? '<span class="chip">' + esc(nameOf(d.subjects, s.subjectId)) + '</span>' : '') + '</span><span>' + dur(s.secs) + '</span></li>').join('') + '</ul>' : '<p class="empty">No sessions yet.</p>') + '</section>' +
      '<section class="panel"><h2>Gem activity</h2>' + (gems.length ? '<ul class="list">' + gems.map(g =>
        '<li><span class="t">' + esc(g.note) + ' <span class="sub">' + dayLabel(g.at) + '</span></span><span class="gem-n">' + (g.gems > 0 ? '+' : '') + g.gems + '</span></li>').join('') + '</ul>' : '<p class="empty">Nothing earned yet.</p>') + '</section>';
  }

  /* ---------- settings ---------- */
  function viewSettings() {
    const d = S(), st = d.settings;
    const num = (k, label, hint) => '<div class="field"><label for="s-' + k + '">' + label + '</label><input id="s-' + k + '" type="number" min="0" data-set="' + k + '" value="' + st[k] + '">' + (hint ? '<p class="hint">' + hint + '</p>' : '') + '</div>';
    const editor = (key, title, arr, ord) => '<section class="panel"><h2>' + title + '</h2><ul class="list">' + arr.map((x, i) =>
      '<li><input type="text" class="grow" data-list="' + key + '" data-id="' + x.id + '" value="' + esc(x.name) + '" aria-label="' + title + ' name">' +
      (ord && i > 0 ? '<button class="btn quiet small" data-act="up" data-key="' + key + '" data-id="' + x.id + '" aria-label="Move up">Up</button>' : '') +
      '<button class="btn quiet small danger" data-act="del-list" data-key="' + key + '" data-id="' + x.id + '">Remove</button></li>').join('') + '</ul>' +
      '<form data-form="list" data-key="' + key + '" class="row" style="margin-top:12px"><input type="text" name="name" class="grow" placeholder="Add one" aria-label="Add to ' + title + '" required maxlength="40"><button class="btn primary" type="submit">Add</button></form>' +
      (ord ? '<p class="hint">Lowest first. The last one ranks highest.</p>' : '') + '</section>';

    return '<div class="page-head"><h1>Settings</h1></div>' +
      '<section class="panel"><h2>Goals</h2><div class="fields">' +
      num('weeknightMin', 'Minutes each weeknight', 'Monday to Friday.') +
      num('weekendMin', 'Minutes across the weekend', 'Split between Saturday and Sunday however you like.') + '</div></section>' +
      '<section class="panel"><h2>Gems</h2><div class="fields">' +
      num('gemsPerMin', 'Gems per minute studied') + num('goalBonus', 'Bonus for meeting a goal') +
      num('streakEvery', 'Streak bonus every N goals', '0 turns it off.') + num('streakBonus', 'Streak bonus gems') + '</div>' +
      '<p class="hint">Gems can only be earned by studying. There is no way to add them here.</p></section>' +
      editor('subjects', 'Subjects', d.subjects, false) + editor('levels', 'Importance levels', d.levels, true) +
      '<section class="panel"><h2>Your data</h2><p class="sub" style="margin-bottom:12px">Saved in this browser. Use export and import to move it to another device until sign-in is added.</p>' +
      '<div class="row"><button class="btn" data-act="export">Export</button>' +
      '<label class="btn" style="margin:0;cursor:pointer">Import<input type="file" accept="application/json" data-act="import" hidden></label>' +
      '<button class="btn danger" data-act="erase">Erase everything</button></div></section>';
  }

  /* ---------- render ---------- */
  function render() {
    if (!S().setupDone) { $app.innerHTML = viewSetup(); return; }
    const tl = L.timeline(S(), Date.now());
    const v = { today: viewToday, tasks: viewTasks, shop: viewShop, history: viewHistory, settings: viewSettings }[route];
    $app.innerHTML = header(tl) + '<main>' + v(tl) + '</main>';
  }
  const commit = () => { Store.save(); render(); };

  setInterval(() => {
    const a = S().active, el = document.getElementById('clock');
    if (a && el && route === 'today') el.textContent = clock((Date.now() - a.start) / 1000);
  }, 500);
  window.addEventListener('hashchange', () => {
    const r = location.hash.slice(1);
    if (ROUTES.some(x => x[0] === r)) { route = r; ui.flash = null; render(); window.scrollTo(0, 0); }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });

  /* ---------- events ---------- */
  const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
  const mk = name => ({ id: Store.uid(), name });
  const listFor = k => S()[k];

  $app.addEventListener('submit', e => {
    const f = e.target.closest('form[data-form]'); if (!f) return;
    e.preventDefault();
    const fd = new FormData(f), d = S(), kind = f.dataset.form;
    if (kind === 'setup') {
      d.subjects = lines(fd.get('subjects')).map(mk);
      d.levels = lines(fd.get('levels')).map(mk);
      d.settings.weeknightMin = Math.max(1, Number(fd.get('wn')) || 60);
      d.settings.weekendMin = Math.max(1, Number(fd.get('we')) || 240);
      d.setupDone = true;
    } else if (kind === 'todo') {
      d.todos.push({ id: Store.uid(), title: String(fd.get('title')).trim(), subjectId: fd.get('subjectId'), levelId: fd.get('levelId'), done: false, at: Date.now() });
    } else if (kind === 'item') {
      d.shop.push({ id: Store.uid(), name: String(fd.get('name')).trim(), price: Math.max(0, Math.round(Number(fd.get('price')) || 0)), kind: 'reward' });
    } else if (kind === 'list') {
      listFor(f.dataset.key).push(mk(String(fd.get('name')).trim()));
    }
    commit();
  });

  $app.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b || b.tagName === 'INPUT' && b.type === 'file') return;
    const d = S(), act = b.dataset.act, id = b.dataset.id;
    if (act === 'start') {
      L.startSession(d, ui.draft.subjectId, ui.draft.todoId, Date.now()); ui.flash = null; ui.finishTask = false;
    } else if (act === 'done') {
      const todoId = d.active && d.active.todoId;
      ui.flash = L.endSession(d, Date.now());
      if (ui.finishTask && todoId) { const t = d.todos.find(x => x.id === todoId); if (t) t.done = true; }
      ui.finishTask = false; ui.draft.todoId = '';
    } else if (act === 'discard') {
      if (!confirm('Discard this session? The time will not count.')) return;
      d.active = null;
    } else if (act === 'toggle') {
      const t = d.todos.find(x => x.id === id); if (t) t.done = b.checked;
    } else if (act === 'del-todo') {
      d.todos = d.todos.filter(x => x.id !== id);
    } else if (act === 'filter') {
      ui.taskSubject = id;
    } else if (act === 'toggle-done-list') {
      ui.showDone = !ui.showDone;
    } else if (act === 'buy') {
      L.buy(d, id, Date.now());
    } else if (act === 'use') {
      const p = d.purchases.find(x => x.id === id); if (p) p.used = true;
    } else if (act === 'toggle-edit') {
      ui.editShop = !ui.editShop;
    } else if (act === 'del-item') {
      d.shop = d.shop.filter(x => x.id !== id);
    } else if (act === 'del-list') {
      const k = b.dataset.key; d[k] = d[k].filter(x => x.id !== id);
    } else if (act === 'up') {
      const arr = d[b.dataset.key], i = arr.findIndex(x => x.id === id);
      if (i > 0) { const t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; }
    } else if (act === 'export') {
      const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }));
      const a = document.createElement('a'); a.href = url; a.download = '27study-' + L.ymd(new Date()) + '.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000); return;
    } else if (act === 'erase') {
      if (!confirm('Erase all your study data, gems and settings on this device? This cannot be undone.')) return;
      Store.reset(); route = 'today'; location.hash = '#today';
    }
    commit();
  });

  $app.addEventListener('change', e => {
    const t = e.target, d = S();
    if (t.dataset.act === 'import') {
      const file = t.files[0]; if (!file) return;
      file.text().then(txt => {
        try {
          const data = JSON.parse(txt);
          if (!data || !Array.isArray(data.sessions) || !Array.isArray(data.ledger)) throw new Error('bad');
          if (!confirm('Replace everything on this device with the imported file?')) return;
          Store.replace(data); render();
        } catch (err) { alert('That file is not a 27Study export.'); }
      });
      return;
    }
    if (t.dataset.bind) {
      if (t.dataset.bind === 'finishTask') { ui.finishTask = t.checked; return; }
      ui.draft[t.dataset.bind] = t.value;
      if (t.dataset.bind === 'todoId') {
        const todo = d.todos.find(x => x.id === t.value);
        if (todo && todo.subjectId) ui.draft.subjectId = todo.subjectId;
        render();
      }
      return;
    }
    if (t.dataset.act === 'toggle') return; // handled by click
    if (t.dataset.set) {
      const n = Number(t.value), min = ['weeknightMin', 'weekendMin'].includes(t.dataset.set) ? 1 : 0;
      d.settings[t.dataset.set] = Math.max(min, Number.isFinite(n) ? n : 0);
    } else if (t.dataset.list) {
      const x = d[t.dataset.list].find(i => i.id === t.dataset.id), v = t.value.trim();
      if (x && v) x.name = v;
    } else if (t.dataset.shop) {
      const x = d.shop.find(i => i.id === t.dataset.id); if (!x) return;
      if (t.dataset.shop === 'price') x.price = Math.max(0, Math.round(Number(t.value) || 0));
      else if (t.value.trim()) x.name = t.value.trim();
    } else return;
    commit();
  });

  render();
})();
