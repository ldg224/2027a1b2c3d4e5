/* 27Study app: shell, routing and events. render() draws the whole page from the store. */
(function () {
  const $app = document.getElementById('app');
  const S = () => Store.get();
  const L = Logic, U = UI.s, icon = UI.icon, esc = UI.esc;
  const NAV = [['home', 'Home', 'home'], ['tasks', 'Tasks', 'tasks'], ['subjects', 'Subjects', 'book'], ['shop', 'Shop', 'bag'], ['history', 'History', 'chart'], ['settings', 'Settings', 'sliders']];
  const NAMES = ['home', 'tasks', 'task', 'subjects', 'subject', 'shop', 'history', 'settings'];

  function parse() {
    const p = (location.hash || '#home').slice(1).split('/');
    return NAMES.includes(p[0]) ? { name: p[0], id: p[1] || '' } : { name: 'home', id: '' };
  }
  let route = parse(), lastKey = '';

  /* ---------- shell ---------- */
  function statsHtml(tl) {
    return '<span class="stat streak" title="Goals met in a row">' + icon('flame', 18) + tl.streak + '</span>' +
      '<span class="stat gems" title="Gems">' + icon('gem', 18) + L.balance(S()).toLocaleString('en-AU') + '</span>';
  }

  function shell(tl, page) {
    const d = S(), cur = route.name === 'task' ? 'tasks' : route.name === 'subject' ? 'subjects' : route.name;
    const link = n => '<a href="#' + n[0] + '"' + (n[0] === cur ? ' aria-current="page"' : '') + '>' + icon(n[2], 18) + '<span>' + n[1] + '</span></a>';
    const subs = d.subjects.map(s => '<a class="side-sub" href="#subject/' + s.id + '"' + (route.name === 'subject' && route.id === s.id ? ' aria-current="page"' : '') + '><i style="background:' + s.color + '"></i><span>' + esc(s.name) + '</span></a>').join('');
    return '<div class="shell"><aside class="side"><a class="brand" href="#home"><span class="logo">' + icon('gem', 16) + '</span>27Study</a>' +
      '<nav class="side-nav" aria-label="Main">' + NAV.filter(n => n[0] !== 'settings').map(link).join('') + '</nav>' +
      '<div class="side-h"><span>Subjects</span><button class="icon-btn" data-act="toggle-add-subject" aria-label="Add subject">' + icon('plus', 15) + '</button></div>' +
      (U.addSubject ? '<form data-form="subject-add" class="side-add"><input id="subject-add-input" type="text" name="name" placeholder="Subject name" aria-label="Subject name" required maxlength="40"></form>' : '') +
      '<div class="side-subs">' + (subs || '<p class="side-empty">No subjects yet</p>') + '</div>' +
      '<div class="side-foot"><div class="side-stats">' + statsHtml(tl) + '</div>' + link(NAV[5]) + '</div></aside>' +
      '<div class="m-top"><a class="brand" href="#home"><span class="logo">' + icon('gem', 16) + '</span>27Study</a><div class="side-stats">' + statsHtml(tl) + '</div>' +
      '<a class="icon-btn" href="#settings" aria-label="Settings">' + icon('sliders', 18) + '</a></div>' +
      '<main class="main"><div class="main-in">' + page + '</div></main>' +
      '<nav class="m-nav" aria-label="Main">' + NAV.filter(n => n[0] !== 'settings').map(link).join('') + '</nav></div>';
  }

  /* ---------- render ---------- */
  function applyTheme() {
    const t = S().settings.theme;
    if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else document.documentElement.removeAttribute('data-theme');
  }
  const grow = ta => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px'; };

  function render() {
    applyTheme();
    const y = window.scrollY, side = $app.querySelector('.f-side'), sideY = side ? side.scrollTop : 0;
    const key = route.name + '/' + route.id;
    if (!S().setupDone) { $app.innerHTML = Pages.setup(); return; }

    const tl = L.timeline(S(), Date.now()), a = S().active;
    const page = Pages[route.name](route.name === 'task' || route.name === 'subject' ? route.id : tl);
    const focus = !!(a && !U.minimized);
    $app.innerHTML = (focus ? '' : shell(tl, page)) + (a && U.minimized ? Focus.pill() : '') + (focus ? Focus.focusHtml() : '') +
      (U.startOpen ? Focus.startModal() : '') + (U.summary ? Focus.summaryModal() : '');
    document.body.classList.toggle('lock', !!(focus || U.startOpen || U.summary));

    $app.querySelectorAll('textarea[data-blk]').forEach(grow);
    if (key === lastKey) window.scrollTo(0, y); else window.scrollTo(0, 0);
    lastKey = key;
    const ns = $app.querySelector('.f-side'); if (ns) ns.scrollTop = sideY;
    const pick = U.focusBlock ? $app.querySelector('[data-blk="' + U.focusBlock + '"]') : U.focusSel ? $app.querySelector(U.focusSel) : null;
    if (pick) { pick.focus(); if (pick.setSelectionRange && pick.value) pick.setSelectionRange(pick.value.length, pick.value.length); }
    U.focusBlock = ''; U.focusSel = '';
    Focus.tick();
  }
  const commit = () => { Store.save(); render(); };

  setInterval(Focus.tick, 500);
  window.addEventListener('hashchange', () => { route = parse(); render(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) Focus.tick(); });

  /* ---------- helpers ---------- */
  const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
  const nextColor = () => Store.PALETTE[S().subjects.length % Store.PALETTE.length];
  const newSubject = name => ({ id: Store.uid(), name, color: nextColor(), blocks: [] });
  const blocksOf = (ent, id) => { const o = (ent === 'task' ? S().todos : S().subjects).find(x => x.id === id); return o ? o.blocks : null; };
  const todoOf = id => S().todos.find(t => t.id === id);

  /* ---------- forms ---------- */
  $app.addEventListener('submit', e => {
    const f = e.target.closest('form[data-form]'); if (!f) return;
    e.preventDefault();
    const fd = new FormData(f), d = S(), kind = f.dataset.form, val = k => String(fd.get(k) || '').trim();
    if (kind === 'setup') {
      d.subjects = lines(fd.get('subjects')).map((n, i) => ({ id: Store.uid(), name: n, color: Store.PALETTE[i % Store.PALETTE.length], blocks: [] }));
      d.levels = lines(fd.get('levels')).map(n => ({ id: Store.uid(), name: n }));
      d.settings.weeknightMin = Math.max(1, Number(fd.get('wn')) || 60);
      d.settings.weekendMin = Math.max(1, Number(fd.get('we')) || 240);
      d.setupDone = true;
    } else if (kind === 'todo') {
      d.todos.push({ id: Store.uid(), title: val('title'), subjectId: val('subjectId'), levelId: val('levelId'), due: val('due'), done: false, at: Date.now(), blocks: [] });
    } else if (kind === 'focus-add') {
      d.todos.push({ id: Store.uid(), title: val('title'), subjectId: d.active ? d.active.subjectId : '', levelId: '', due: '', done: false, at: Date.now(), blocks: [] });
      U.focusTab = 'next';
    } else if (kind === 'subject-task') {
      d.todos.push({ id: Store.uid(), title: val('title'), subjectId: f.dataset.id, levelId: val('levelId'), due: '', done: false, at: Date.now(), blocks: [] });
    } else if (kind === 'subject-add' || kind === 'subject-page-add') {
      const s = newSubject(val('name')); d.subjects.push(s); U.addSubject = false;
      if (kind === 'subject-add') location.hash = '#subject/' + s.id;
    } else if (kind === 'item') {
      d.shop.push({ id: Store.uid(), name: val('name'), price: Math.max(0, Math.round(Number(fd.get('price')) || 0)), kind: 'reward' });
    } else if (kind === 'list') {
      const key = f.dataset.key, name = val('name');
      d[key].push(key === 'subjects' ? newSubject(name) : { id: Store.uid(), name });
    }
    commit();
  });

  /* ---------- clicks ---------- */
  /* Start the timer on a task or subject, or move a running timer onto it. */
  function startOn(todoId, subjectId) {
    const d = S(), now = Date.now();
    if (d.active) L.switchTo(d, todoId, subjectId, now);
    else L.startSession(d, subjectId, todoId, now);
    U.minimized = false; U.startOpen = false;
  }

  $app.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    if (b.tagName === 'INPUT' && b.type === 'file') return;
    if (b.classList.contains('modal-back') && e.target !== b) return;
    const d = S(), act = b.dataset.act, id = b.dataset.id, now = Date.now();
    switch (act) {
      case 'open-start': U.startOpen = true; U.pickQ = ''; U.pickSubject = ''; U.focusSel = '#m-q'; break;
      case 'close-start': U.startOpen = false; break;
      case 'pick-task': { const t = todoOf(id); if (!t) return; startOn(id, t.subjectId); break; }
      case 'pick-subject': startOn('', id); break;
      case 'pick-open': startOn('', ''); break;
      case 'pick-filter': U.pickSubject = id; U.focusSel = '#m-q'; break;
      case 'switch-task': {
        const t = todoOf(id), keep = d.active && !t ? d.active.subjectId : '';
        if (d.active) L.switchTo(d, id, t ? t.subjectId : keep, now); break;
      }
      case 'complete-current': { const t = d.active && todoOf(d.active.todoId); if (t) t.done = !t.done; break; }
      case 'focus-tab': U.focusTab = id; break;
      case 'study-task': { const t = todoOf(id); if (!t) return; startOn(id, t.subjectId); break; }
      case 'study-subject': startOn('', id); break;
      case 'pause': L.pause(d, now); break;
      case 'resume': L.resume(d, now); break;
      case 'minimize': U.minimized = true; break;
      case 'restore': U.minimized = false; break;
      case 'done': {
        const r = L.endSession(d, now); if (!r) break;
        U.summary = r; U.minimized = false; document.title = '27Study'; break;
      }
      case 'close-summary': U.summary = null; break;
      case 'discard':
        if (!confirm('Discard this session? The time will not count.')) return;
        d.active = null; document.title = '27Study'; break;
      case 'toggle': { const t = todoOf(id); if (t) t.done = b.checked; break; }
      case 'del-todo':
        if (!confirm('Delete this task?')) return;
        d.todos = d.todos.filter(x => x.id !== id); if (d.active && d.active.todoId === id) d.active.todoId = '';
        if (route.name === 'task') location.hash = '#tasks'; break;
      case 'del-subject':
        if (!confirm('Delete this subject? Its tasks stay, without a subject.')) return;
        d.subjects = d.subjects.filter(x => x.id !== id); d.todos.forEach(t => { if (t.subjectId === id) t.subjectId = ''; });
        if (d.active && d.active.subjectId === id) d.active.subjectId = '';
        if (route.name === 'subject') location.hash = '#subjects'; break;
      case 'color': { const s = d.subjects.find(x => x.id === id); if (s) s.color = b.dataset.color; break; }
      case 'task-tab': U.taskTab = id; break;
      case 'task-group': U.taskGroup = id; break;
      case 'toggle-add-subject': U.addSubject = !U.addSubject; U.focusSel = '#subject-add-input'; break;
      case 'add-block': {
        const box = b.closest('.blocks'), arr = blocksOf(box.dataset.ent, box.dataset.eid); if (!arr) return;
        const nb = { id: Store.uid(), type: b.dataset.type, text: '', done: false }; arr.push(nb); U.focusBlock = nb.id; break;
      }
      case 'buy': L.buy(d, id, now); break;
      case 'use': { const p = d.purchases.find(x => x.id === id); if (p) p.used = true; break; }
      case 'toggle-edit': U.editShop = !U.editShop; break;
      case 'del-item': d.shop = d.shop.filter(x => x.id !== id); break;
      case 'del-list': { const k = b.dataset.key; d[k] = d[k].filter(x => x.id !== id); break; }
      case 'up': {
        const arr = d[b.dataset.key], i = arr.findIndex(x => x.id === id);
        if (i > 0) { const t = arr[i - 1]; arr[i - 1] = arr[i]; arr[i] = t; } break;
      }
      case 'export': {
        const url = URL.createObjectURL(new Blob([JSON.stringify(d, null, 2)], { type: 'application/json' }));
        const a = document.createElement('a'); a.href = url; a.download = '27study-' + L.ymd(new Date()) + '.json'; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1000); return;
      }
      case 'erase':
        if (!confirm('Erase all your study data, gems and settings on this device? This cannot be undone.')) return;
        Store.reset(); location.hash = '#home'; route = parse(); break;
      default: return;
    }
    commit();
  });

  /* ---------- page text: block editing ---------- */
  $app.addEventListener('input', e => {
    if (e.target.dataset && e.target.dataset.filter === 'pick') { U.pickQ = e.target.value; U.focusSel = '#m-q'; render(); return; }
    const ta = e.target; if (!ta.dataset || !ta.dataset.blk) return;
    const box = ta.closest('.blocks'), arr = blocksOf(box.dataset.ent, box.dataset.eid), b = arr && arr.find(x => x.id === ta.dataset.blk);
    if (!b) return;
    const m = b.type === 'text' && ta.value.match(/^(#|-|\*|\[\])\s/);
    if (m) {   // markdown shortcut: "# " heading, "- " list, "[] " to-do
      b.type = m[1] === '#' ? 'h' : m[1] === '[]' ? 'todo' : 'bullet';
      b.text = ta.value.slice(m[0].length); U.focusBlock = b.id; commit(); return;
    }
    b.text = ta.value; grow(ta); Store.save();
  });

  document.addEventListener('keydown', e => {
    const ta = e.target;
    if (ta.dataset && ta.dataset.blk) {
      const box = ta.closest('.blocks'), arr = blocksOf(box.dataset.ent, box.dataset.eid);
      const i = arr ? arr.findIndex(x => x.id === ta.dataset.blk) : -1, b = arr && arr[i];
      if (!b) return;
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        if (!b.text && b.type !== 'text') { b.type = 'text'; U.focusBlock = b.id; }
        else {
          const nb = { id: Store.uid(), type: b.type === 'todo' || b.type === 'bullet' ? b.type : 'text', text: '', done: false };
          arr.splice(i + 1, 0, nb); U.focusBlock = nb.id;
        }
        commit(); return;
      }
      if (e.key === 'Backspace' && ta.value === '') {
        e.preventDefault();
        if (b.type !== 'text') { b.type = 'text'; U.focusBlock = b.id; }
        else { arr.splice(i, 1); const prev = arr[i - 1] || arr[i]; U.focusBlock = prev ? prev.id : ''; }
        commit(); return;
      }
    }
    if (e.key === 'Escape') {
      if (U.startOpen) { U.startOpen = false; render(); }
      else if (U.summary) { U.summary = null; render(); }
      else if (S().active && !U.minimized) { U.minimized = true; render(); }
      else if (U.addSubject) { U.addSubject = false; render(); }
    }
  });

  /* ---------- field changes ---------- */
  $app.addEventListener('change', e => {
    const t = e.target, d = S(), f = t.dataset.field, id = t.dataset.id;
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
    if (t.dataset.blkCheck) {
      const box = t.closest('.blocks'), arr = blocksOf(box.dataset.ent, box.dataset.eid), b = arr && arr.find(x => x.id === t.dataset.blkCheck);
      if (b) { b.done = t.checked; commit(); } return;
    }
    if (f) {
      const todo = todoOf(id), sub = d.subjects.find(x => x.id === id);
      if (f === 'todo-title' && todo) todo.title = t.value.trim() || 'Untitled';
      else if (f === 'todo-subject' && todo) todo.subjectId = t.value;
      else if (f === 'todo-level' && todo) todo.levelId = t.value;
      else if (f === 'todo-due' && todo) todo.due = t.value;
      else if (f === 'todo-status' && todo) todo.done = t.value === 'done';
      else if (f === 'subject-title' && sub) sub.name = t.value.trim() || sub.name;
      commit(); return;
    }
    if (t.dataset.act === 'toggle') return;   // handled by click
    if (t.dataset.set) {
      const n = Number(t.value), min = ['weeknightMin', 'weekendMin', 'maxSessionMin'].includes(t.dataset.set) ? 1 : 0;
      d.settings[t.dataset.set] = Math.max(min, Number.isFinite(n) ? n : 0);
    } else if (t.dataset.setText) {
      d.settings[t.dataset.setText] = t.value;
    } else if (t.dataset.list) {
      const x = d[t.dataset.list].find(i => i.id === id), v = t.value.trim();
      if (x && v) x.name = v;
    } else if (t.dataset.shop) {
      const x = d.shop.find(i => i.id === id); if (!x) return;
      if (t.dataset.shop === 'price') x.price = Math.max(0, Math.round(Number(t.value) || 0));
      else if (t.value.trim()) x.name = t.value.trim();
    } else return;
    commit();
  });

  render();
})();
