/* Page views. Each returns an HTML string drawn from the store. */
(function () {
  const { esc, icon, dur, day, dueLabel } = UI;
  const U = UI.s, L = Logic, S = () => Store.get();
  const R = 88, C = 2 * Math.PI * R;
  UI.ringC = C;

  const subj = id => S().subjects.find(s => s.id === id);
  const lvlIndex = id => S().levels.findIndex(l => l.id === id);
  const gemN = n => '<span class="gem-n">' + icon('gem', 14) + Number(n).toLocaleString('en-AU') + '</span>';

  function tagSubject(id) {
    const s = subj(id);
    return s ? '<span class="tag" style="--c:' + s.color + '"><i></i>' + esc(s.name) + '</span>' : '';
  }
  function tagLevel(id) {
    const d = S(), i = lvlIndex(id); if (i < 0) return '';
    const n = d.levels.length, r = n > 1 ? i / (n - 1) : 0;
    return '<span class="lvl ' + (r >= 0.67 ? 'hi' : r >= 0.34 ? 'mid' : 'lo') + '">' + icon('flag', 12) + esc(d.levels[i].name) + '</span>';
  }
  function dueTag(t) {
    if (!t.due) return '';
    const over = !t.done && t.due < L.ymd(new Date());
    return '<span class="due' + (over ? ' over' : '') + '">' + icon('calendar', 13) + dueLabel(t.due) + '</span>';
  }
  function ring(frac) {
    return '<svg viewBox="0 0 200 200" aria-hidden="true"><circle class="track" cx="100" cy="100" r="' + R + '" fill="none" stroke-width="10"/>' +
      '<circle class="bar" cx="100" cy="100" r="' + R + '" fill="none" stroke-width="10" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) +
      '" stroke-dashoffset="' + (C * (1 - Math.min(1, frac))).toFixed(1) + '"/></svg>';
  }
  const opts = (arr, sel, none) => '<option value="">' + none + '</option>' + arr.map(x =>
    '<option value="' + x.id + '"' + (x.id === sel ? ' selected' : '') + '>' + esc(x.name) + '</option>').join('');

  /* Open tasks, most pressing first: overdue, then importance, then due date. */
  function rank(list) {
    const today = L.ymd(new Date());
    return list.slice().sort((a, b) =>
      (!!b.due && b.due < today) - (!!a.due && a.due < today) ||
      lvlIndex(b.levelId) - lvlIndex(a.levelId) ||
      (a.due || '9999').localeCompare(b.due || '9999') || b.at - a.at);
  }

  function taskRow(t) {
    const secs = L.taskSecs(S(), t.id);
    return '<li class="trow' + (t.done ? ' done' : '') + '"><input class="check" type="checkbox" data-act="toggle" data-id="' + t.id + '"' + (t.done ? ' checked' : '') + ' aria-label="Done: ' + esc(t.title) + '">' +
      '<a class="t" href="#task/' + t.id + '">' + esc(t.title || 'Untitled') + '</a>' +
      '<span class="meta">' + tagSubject(t.subjectId) + tagLevel(t.levelId) + dueTag(t) + (secs ? '<span class="mini">' + icon('clock', 13) + dur(secs) + '</span>' : '') + '</span>' +
      (t.done ? '' : '<button class="icon-btn" data-act="study-task" data-id="' + t.id + '" title="Study this" aria-label="Study ' + esc(t.title) + '">' + icon('play', 14) + '</button>') + '</li>';
  }

  /* ---------- block editor (task and subject pages) ---------- */
  function blockRow(b) {
    const ta = (ph) => '<textarea rows="1" data-blk="' + b.id + '" placeholder="' + ph + '" aria-label="Page text">' + esc(b.text) + '</textarea>';
    if (b.type === 'todo') return '<div class="blk todo' + (b.done ? ' done' : '') + '"><input class="check" type="checkbox" data-blk-check="' + b.id + '"' + (b.done ? ' checked' : '') + ' aria-label="Done">' + ta('To-do') + '</div>';
    if (b.type === 'bullet') return '<div class="blk bullet"><span class="dot"></span>' + ta('List item') + '</div>';
    if (b.type === 'h') return '<div class="blk h">' + ta('Heading') + '</div>';
    return '<div class="blk text">' + ta('Write something. Type - for a list, [] for a to-do, # for a heading.') + '</div>';
  }
  function blocks(ent, id, arr) {
    return '<div class="blocks" data-ent="' + ent + '" data-eid="' + id + '">' + arr.map(blockRow).join('') +
      '<div class="blk-add">' + [['text', 'Text'], ['h', 'Heading'], ['todo', 'To-do'], ['bullet', 'List']].map(x =>
        '<button class="btn quiet small" data-act="add-block" data-type="' + x[0] + '">' + icon('plus', 13) + x[1] + '</button>').join('') + '</div></div>';
  }
  const prop = (ic, label, val) => '<div class="prop"><span class="pl">' + icon(ic, 16) + label + '</span><span class="pv">' + val + '</span></div>';

  function sessionList(list) {
    const d = S();
    return list.length ? '<ul class="list">' + list.map(s => {
      const t = d.todos.find(x => x.id === s.todoId);
      return '<li><span class="t">' + day(s.start) + ' <span class="sub">' + UI.time(s.start) + '</span></span><span class="meta">' + (t ? '<span class="sub">' + esc(t.title) + '</span>' : '') + '</span><b>' + dur(s.secs) + '</b></li>';
    }).join('') + '</ul>' : '<p class="empty">No sessions yet. Press play to start one.</p>';
  }

  /* ---------- setup ---------- */
  function setup() {
    return '<div class="setup"><div class="setup-brand">27Study</div><h1>Set up your study space</h1>' +
      '<p class="sub">A few answers and you are ready. You can change all of it later in Settings.</p>' +
      '<form data-form="setup" class="card">' +
      '<div class="field"><label for="su-sub">Your subjects, one per line</label>' +
      '<textarea id="su-sub" name="subjects" placeholder="Maths Methods&#10;English&#10;Chemistry"></textarea></div>' +
      '<div class="field"><label for="su-lvl">Importance levels, lowest first, one per line</label>' +
      '<textarea id="su-lvl" name="levels">Low\nMedium\nHigh</textarea>' +
      '<p class="hint">Used to rank your tasks. Call them anything you like.</p></div>' +
      '<div class="fields"><div class="field"><label for="su-wn">Minutes each weeknight</label><input id="su-wn" name="wn" type="number" min="1" value="60"></div>' +
      '<div class="field"><label for="su-we">Minutes across the weekend</label><input id="su-we" name="we" type="number" min="1" value="240"></div></div>' +
      '<div class="row end"><button class="btn primary" type="submit">Start studying</button></div></form></div>';
  }

  /* ---------- home ---------- */
  function home(tl) {
    const d = S(), st = d.settings, now = Date.now(), hour = new Date(now).getHours();
    const u = L.unitOf(new Date(now), st), done = L.unitSecs(d, u), left = Math.max(0, u.goalSec - done), met = done >= u.goalSec;
    const where = u.kind === 'weekend' ? 'this weekend' : 'tonight';
    const open = rank(d.todos.filter(t => !t.done)).slice(0, 5);
    const weekStart = L.addDays(L.startOfDay(now), -((new Date(now).getDay() + 6) % 7)).getTime();
    const wk = L.weekUnits(d, now);

    const goal = '<section class="card goal"><div class="ring">' + ring(done / u.goalSec) + '<div class="ring-mid"><b>' + (met ? icon('check', 34) : Math.round(done / u.goalSec * 100) + '%') + '</b></div></div>' +
      '<div class="goal-info"><h2>' + (u.kind === 'weekend' ? 'Weekend goal' : 'Tonight\'s goal') + '</h2>' +
      '<p class="big">' + (met ? 'Goal met' : dur(left) + ' to go') + '</p>' +
      '<p class="sub">' + dur(done) + ' of ' + dur(u.goalSec) + ' studied ' + where + '</p>' +
      '<div class="row" style="margin-top:14px">' + (d.active
        ? '<button class="btn primary" data-act="restore">' + icon('play', 14) + 'Return to session</button>'
        : '<button class="btn primary" data-act="open-start">' + icon('play', 14) + 'Start a session</button>') + '</div></div></section>';

    const streak = '<section class="card stat-card"><div class="stat-top"><span class="stat-ic fire">' + icon('flame', 20) + '</span><h2>Streak</h2></div>' +
      '<p class="num">' + tl.streak + '</p><p class="sub">goal' + (tl.streak === 1 ? '' : 's') + ' met in a row</p>' +
      '<p class="sub foot">' + icon('ice', 14) + tl.freezesLeft + ' freeze' + (tl.freezesLeft === 1 ? '' : 's') + ' ready</p></section>';

    const gems = '<section class="card stat-card"><div class="stat-top"><span class="stat-ic gem">' + icon('gem', 20) + '</span><h2>Gems</h2></div>' +
      '<p class="num">' + L.balance(d).toLocaleString('en-AU') + '</p><p class="sub">to spend in the shop</p>' +
      '<p class="foot"><a class="link" href="#shop">Open shop ' + icon('chevron', 14) + '</a></p></section>';

    const week = '<section class="card"><div class="card-h"><h2>This week</h2><span class="sub">Each bar fills to its goal</span></div><div class="week">' + wk.map(b => {
      const pct = Math.min(1, b.secs / b.goalSec);
      return '<div class="wk' + (b.current ? ' cur' : '') + (b.future ? ' fut' : '') + '"><div class="wk-bar"><span class="' + (b.met ? 'met' : b.ended ? 'miss' : '') + '" style="height:' + Math.round(pct * 100) + '%"></span></div>' +
        '<b>' + (b.secs ? dur(b.secs) : '–') + '</b><small>' + b.label + '</small></div>';
    }).join('') + '</div></section>';

    const next = '<section class="card"><div class="card-h"><h2>Up next</h2><a class="link" href="#tasks">All tasks ' + icon('chevron', 14) + '</a></div>' +
      (open.length ? '<ul class="list">' + open.map(taskRow).join('') + '</ul>' : '<p class="empty">Nothing queued. <a class="link" href="#tasks">Add a task</a> to plan your next session.</p>') + '</section>';

    const subs = '<section class="card"><div class="card-h"><h2>Subjects</h2><a class="link" href="#subjects">Manage ' + icon('chevron', 14) + '</a></div>' +
      (d.subjects.length ? '<ul class="list">' + d.subjects.map(s => {
        const n = d.todos.filter(t => !t.done && t.subjectId === s.id).length;
        return '<li><a class="sub-row" href="#subject/' + s.id + '"><span class="swatch" style="--c:' + s.color + '"></span><span class="t">' + esc(s.name) + '</span>' +
          '<span class="sub">' + dur(L.subjectSecs(d, s.id, weekStart)) + ' this week · ' + n + ' open</span></a></li>';
      }).join('') + '</ul>' : '<p class="empty">No subjects yet. <a class="link" href="#subjects">Add your first</a>.</p>') + '</section>';

    return '<div class="page-head"><div><h1>' + (hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening') + '</h1>' +
      '<p class="sub">' + new Date(now).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) + '</p></div></div>' +
      '<div class="grid-top">' + goal + streak + gems + '</div>' + week + '<div class="cols">' + next + subs + '</div>';
  }

  /* ---------- tasks ---------- */
  function groupTasks(list, mode) {
    const d = S(), today = L.ymd(new Date()), weekEnd = L.ymd(L.addDays(new Date(), 7));
    let groups = [];
    if (mode === 'subject') {
      groups = d.subjects.map(s => ({ title: s.name, color: s.color, items: list.filter(t => t.subjectId === s.id) }));
      groups.push({ title: 'No subject', items: list.filter(t => !subj(t.subjectId)) });
    } else if (mode === 'due') {
      groups = [
        { title: 'Overdue', items: list.filter(t => t.due && t.due < today) },
        { title: 'Today', items: list.filter(t => t.due === today) },
        { title: 'This week', items: list.filter(t => t.due > today && t.due <= weekEnd) },
        { title: 'Later', items: list.filter(t => t.due > weekEnd) },
        { title: 'No date', items: list.filter(t => !t.due) }];
    } else {
      groups = d.levels.slice().reverse().map(l => ({ title: l.name, items: list.filter(t => t.levelId === l.id) }));
      groups.push({ title: 'No importance', items: list.filter(t => lvlIndex(t.levelId) < 0) });
    }
    return groups.filter(g => g.items.length);
  }

  function tasks() {
    const d = S(), done = U.taskTab === 'done';
    const list = rank(d.todos.filter(t => t.done === done));
    const openN = d.todos.filter(t => !t.done).length, doneN = d.todos.length - openN;
    const seg = (key, label, cur, act) => '<button data-act="' + act + '" data-id="' + key + '" aria-pressed="' + (cur === key) + '">' + label + '</button>';
    const groups = groupTasks(list, U.taskGroup);

    return '<div class="page-head"><div><h1>Tasks</h1><p class="sub">' + openN + ' to do · ' + doneN + ' finished</p></div></div>' +
      '<form class="card add-task" data-form="todo"><input type="text" name="title" placeholder="Add a task" aria-label="Task" required maxlength="140">' +
      '<select name="subjectId" aria-label="Subject">' + opts(d.subjects, '', 'No subject') + '</select>' +
      '<select name="levelId" aria-label="Importance">' + opts(d.levels, '', 'No importance') + '</select>' +
      '<input type="date" name="due" aria-label="Due date"><button class="btn primary" type="submit">Add task</button></form>' +
      '<div class="toolbar"><div class="seg">' + seg('open', 'To do', U.taskTab, 'task-tab') + seg('done', 'Finished', U.taskTab, 'task-tab') + '</div>' +
      '<div class="seg"><span class="seg-l">Group by</span>' + seg('importance', 'Importance', U.taskGroup, 'task-group') + seg('subject', 'Subject', U.taskGroup, 'task-group') + seg('due', 'Due date', U.taskGroup, 'task-group') + '</div></div>' +
      (groups.length ? groups.map(g => '<section class="card group"><div class="card-h"><h2>' + (g.color ? '<span class="swatch" style="--c:' + g.color + '"></span>' : '') + esc(g.title) + '</h2><span class="sub">' + g.items.length + '</span></div><ul class="list">' + g.items.map(taskRow).join('') + '</ul></section>').join('')
        : '<section class="card"><p class="empty">' + (done ? 'No finished tasks yet.' : 'Nothing to do. Add a task above.') + '</p></section>');
  }

  /* ---------- a task page ---------- */
  function task(id) {
    const d = S(), t = d.todos.find(x => x.id === id);
    if (!t) return notFound('That task is gone.', '#tasks', 'Back to tasks');
    const s = subj(t.subjectId), secs = L.taskSecs(d, t.id);
    const sess = d.sessions.filter(x => x.todoId === t.id).slice(-6).reverse();
    return '<div class="doc" style="--c:' + (s ? s.color : 'var(--accent)') + '"><div class="cover"></div>' +
      '<div class="crumbs"><a href="#tasks">Tasks</a>' + icon('chevron', 12) + (s ? '<a href="#subject/' + s.id + '">' + esc(s.name) + '</a>' + icon('chevron', 12) : '') + '<span>' + esc(t.title || 'Untitled') + '</span></div>' +
      '<input class="doc-title" data-field="todo-title" data-id="' + t.id + '" value="' + esc(t.title) + '" placeholder="Untitled" aria-label="Task title">' +
      '<div class="props">' +
      prop('book', 'Subject', '<select data-field="todo-subject" data-id="' + t.id + '">' + opts(d.subjects, t.subjectId, 'None') + '</select>') +
      prop('flag', 'Importance', '<select data-field="todo-level" data-id="' + t.id + '">' + opts(d.levels, t.levelId, 'None') + '</select>') +
      prop('calendar', 'Due', '<input type="date" data-field="todo-due" data-id="' + t.id + '" value="' + esc(t.due) + '">') +
      prop('check', 'Status', '<select data-field="todo-status" data-id="' + t.id + '"><option value="open"' + (t.done ? '' : ' selected') + '>To do</option><option value="done"' + (t.done ? ' selected' : '') + '>Finished</option></select>') +
      prop('clock', 'Time studied', '<span>' + (secs ? dur(secs) : 'None yet') + '</span>') + '</div>' +
      '<div class="row" style="margin:18px 0">' + (t.done ? '' : '<button class="btn primary" data-act="study-task" data-id="' + t.id + '">' + icon('play', 14) + 'Study this</button>') +
      '<button class="btn quiet danger" data-act="del-todo" data-id="' + t.id + '">' + icon('trash', 15) + 'Delete</button></div>' +
      '<hr>' + blocks('task', t.id, t.blocks) +
      '<hr><h2 class="doc-h">Sessions</h2>' + sessionList(sess) + '</div>';
  }

  /* ---------- subjects ---------- */
  function subjects() {
    const d = S(), weekStart = L.addDays(L.startOfDay(Date.now()), -((new Date().getDay() + 6) % 7)).getTime();
    return '<div class="page-head"><div><h1>Subjects</h1><p class="sub">Each subject has its own page for notes, tasks and time.</p></div></div>' +
      (d.subjects.length ? '<div class="scards">' + d.subjects.map(s => {
        const n = d.todos.filter(t => !t.done && t.subjectId === s.id).length;
        return '<a class="scard" href="#subject/' + s.id + '" style="--c:' + s.color + '"><span class="scard-bar"></span><b>' + esc(s.name) + '</b>' +
          '<span class="sub">' + dur(L.subjectSecs(d, s.id, weekStart)) + ' this week</span><span class="sub">' + n + ' open task' + (n === 1 ? '' : 's') + '</span></a>';
      }).join('') + '</div>' : '<section class="card"><p class="empty">No subjects yet. Add your first below.</p></section>') +
      '<form class="card row" data-form="subject-page-add" style="margin-top:16px"><input type="text" name="name" class="grow" placeholder="New subject, e.g. Chemistry" aria-label="New subject name" required maxlength="40"><button class="btn primary" type="submit">' + icon('plus', 15) + 'Add subject</button></form>';
  }

  function subject(id) {
    const d = S(), s = subj(id);
    if (!s) return notFound('That subject is gone.', '#subjects', 'Back to subjects');
    const weekStart = L.addDays(L.startOfDay(Date.now()), -((new Date().getDay() + 6) % 7)).getTime();
    const mine = d.todos.filter(t => t.subjectId === s.id), open = rank(mine.filter(t => !t.done)), fin = mine.filter(t => t.done);
    const sess = d.sessions.filter(x => x.subjectId === s.id).slice(-6).reverse();
    return '<div class="doc" style="--c:' + s.color + '"><div class="cover"></div>' +
      '<div class="crumbs"><a href="#subjects">Subjects</a>' + icon('chevron', 12) + '<span>' + esc(s.name) + '</span></div>' +
      '<input class="doc-title" data-field="subject-title" data-id="' + s.id + '" value="' + esc(s.name) + '" aria-label="Subject name">' +
      '<div class="props">' +
      prop('tag', 'Colour', '<span class="swatches">' + Store.PALETTE.map(c => '<button class="sw" style="--c:' + c + '" data-act="color" data-id="' + s.id + '" data-color="' + c + '" aria-pressed="' + (c === s.color) + '" aria-label="Colour ' + c + '"></button>').join('') + '</span>') +
      prop('clock', 'This week', '<span>' + dur(L.subjectSecs(d, s.id, weekStart)) + '</span>') +
      prop('clock', 'All time', '<span>' + dur(L.subjectSecs(d, s.id)) + '</span>') +
      prop('tasks', 'Tasks', '<span>' + open.length + ' open, ' + fin.length + ' finished</span>') + '</div>' +
      '<div class="row" style="margin:18px 0"><button class="btn primary" data-act="study-subject" data-id="' + s.id + '">' + icon('play', 14) + 'Study ' + esc(s.name) + '</button>' +
      '<button class="btn quiet danger" data-act="del-subject" data-id="' + s.id + '">' + icon('trash', 15) + 'Delete</button></div>' +
      '<hr><h2 class="doc-h">Notes</h2>' + blocks('subject', s.id, s.blocks) +
      '<hr><h2 class="doc-h">Tasks</h2>' +
      '<form class="row" data-form="subject-task" data-id="' + s.id + '" style="margin-bottom:8px"><input type="text" name="title" class="grow" placeholder="Add a task to ' + esc(s.name) + '" aria-label="New task" required maxlength="140"><select name="levelId" aria-label="Importance" style="width:auto">' + opts(d.levels, '', 'Importance') + '</select><button class="btn" type="submit">Add</button></form>' +
      (open.length ? '<ul class="list">' + open.map(taskRow).join('') + '</ul>' : '<p class="empty">No open tasks for this subject.</p>') +
      (fin.length ? '<details class="more"><summary>' + fin.length + ' finished</summary><ul class="list">' + fin.map(taskRow).join('') + '</ul></details>' : '') +
      '<hr><h2 class="doc-h">Sessions</h2>' + sessionList(sess) + '</div>';
  }

  function notFound(msg, href, label) {
    return '<section class="card"><p class="empty">' + msg + '<br><a class="link" href="' + href + '">' + label + '</a></p></section>';
  }

  /* ---------- shop ---------- */
  function shop(tl) {
    const d = S(), bal = L.balance(d);
    const owned = d.purchases.filter(p => p.kind === 'reward' && !p.used).slice().reverse();
    const item = i => '<div class="item"><div><span class="item-ic' + (i.kind === 'freeze' ? ' ice' : '') + '">' + icon(i.kind === 'freeze' ? 'ice' : 'gem', 20) + '</span>' +
      '<div class="name">' + esc(i.name) + '</div>' +
      (i.kind === 'freeze' ? '<p class="sub">Covers one missed day or weekend. You have ' + tl.freezesLeft + '.</p>' : '<p class="sub">Your reward</p>') + '</div>' +
      '<div class="price">' + gemN(i.price) + '<button class="btn primary small" data-act="buy" data-id="' + i.id + '"' + (bal < i.price ? ' disabled' : '') + '>Buy</button></div></div>';

    const edit = '<section class="card"><h2 style="margin-bottom:10px">Edit shop</h2><ul class="list">' + d.shop.map(i =>
      '<li><input type="text" class="grow" data-shop="name" data-id="' + i.id + '" value="' + esc(i.name) + '" aria-label="Item name"' + (i.kind === 'freeze' ? ' disabled' : '') + '>' +
      '<input type="number" min="0" style="width:96px" data-shop="price" data-id="' + i.id + '" value="' + i.price + '" aria-label="Price in gems">' +
      (i.kind === 'freeze' ? '<span style="width:76px"></span>' : '<button class="btn quiet small danger" data-act="del-item" data-id="' + i.id + '">Remove</button>') + '</li>').join('') + '</ul>' +
      '<form data-form="item" class="row" style="margin-top:14px"><input type="text" name="name" class="grow" placeholder="New reward, e.g. An episode of a show" aria-label="New item name" required maxlength="80">' +
      '<input type="number" name="price" min="0" style="width:96px" placeholder="Price" aria-label="New item price" required>' +
      '<button class="btn primary" type="submit">Add</button></form></section>';

    return '<div class="page-head"><div><h1>Shop</h1><p class="sub">Spend what you earn.</p></div><div class="row">' + gemN(bal) +
      '<button class="btn small" data-act="toggle-edit">' + (ui().editShop ? 'Close editor' : 'Edit shop') + '</button></div></div>' +
      (U.editShop ? edit : '') +
      '<div class="shop-grid">' + d.shop.map(item).join('') + '</div>' +
      (d.shop.length === 1 ? '<p class="sub" style="margin-top:14px">Add your own rewards with Edit shop.</p>' : '') +
      (owned.length ? '<section class="card" style="margin-top:16px"><h2 style="margin-bottom:6px">Yours to use</h2><ul class="list">' + owned.map(p =>
        '<li><span class="t">' + esc(p.name) + ' <span class="sub">bought ' + day(p.at) + '</span></span><button class="btn small" data-act="use" data-id="' + p.id + '">Mark used</button></li>').join('') + '</ul></section>' : '');
  }
  const ui = () => U;

  /* ---------- history ---------- */
  function history(tl) {
    const d = S(), now = Date.now(), today = L.startOfDay(now);
    const byKey = {}; tl.units.forEach(u => { byKey[u.key] = u; });
    const dow = (today.getDay() + 6) % 7, monday = L.addDays(today, -dow - 7 * 7);
    let cells = ['M', 'T', 'W', 'T', 'F', 'S', 'S'].map(x => '<span class="dow">' + x + '</span>').join('');
    for (let i = 0; i < 56; i++) {
      const dd = L.addDays(monday, i);
      if (dd > today) { cells += '<span class="cell none"></span>'; continue; }
      const u = byKey[L.unitOf(dd, d.settings).key];
      cells += '<span class="cell ' + (u ? u.status : '') + '" title="' + day(dd) + (u ? ' · ' + dur(u.secs) : '') + '"></span>';
    }
    const best = tl.units.reduce((m, u) => Math.max(m, u.streak), 0);
    const total = d.sessions.reduce((a, s) => a + s.secs, 0);
    const week = d.sessions.filter(s => s.start >= L.addDays(today, -dow).getTime()).reduce((a, s) => a + s.secs, 0);
    const by = d.subjects.map(s => ({ n: s.name, c: s.color, v: L.subjectSecs(d, s.id) })).filter(x => x.v).sort((a, b) => b.v - a.v);
    const none = d.sessions.filter(x => !subj(x.subjectId)).reduce((a, x) => a + x.secs, 0);
    if (none) by.push({ n: 'No subject', c: 'var(--muted)', v: none });
    const max = Math.max(1, ...by.map(x => x.v));
    const gems = d.ledger.slice(-8).reverse();

    return '<div class="page-head"><div><h1>History</h1><p class="sub">How your study is going.</p></div></div>' +
      '<div class="kpis">' + [['This week', dur(week)], ['All time', dur(total)], ['Longest streak', best], ['Sessions', d.sessions.length]].map(x =>
        '<div class="card kpi"><span class="sub">' + x[0] + '</span><b>' + x[1] + '</b></div>').join('') + '</div>' +
      '<div class="cols"><section class="card"><h2 style="margin-bottom:12px">Last 8 weeks</h2><div class="heat">' + cells + '</div>' +
      '<div class="legend"><span><i style="background:var(--accent)"></i>Goal met</span><span><i style="box-shadow:inset 0 0 0 2px var(--accent);background:var(--accent-soft)"></i>Freeze used</span><span><i style="background:var(--warn);opacity:.55"></i>Missed</span><span><i style="box-shadow:inset 0 0 0 1px var(--muted)"></i>In progress</span></div>' +
      '<p class="hint">Saturday and Sunday are one goal, so they share a colour.</p></section>' +
      '<section class="card"><h2 style="margin-bottom:12px">By subject</h2>' + (by.length ? '<div class="bars">' + by.map(x =>
        '<div class="bar-row"><span>' + esc(x.n) + '</span><div class="b"><span style="width:' + (x.v / max * 100).toFixed(1) + '%;background:' + x.c + '"></span></div><span class="v">' + dur(x.v) + '</span></div>').join('') + '</div>' : '<p class="empty">Study a session to see your time by subject.</p>') + '</section></div>' +
      '<section class="card"><h2 style="margin-bottom:6px">Gem activity</h2>' + (gems.length ? '<ul class="list">' + gems.map(g =>
        '<li><span class="t">' + esc(g.note) + ' <span class="sub">' + day(g.at) + '</span></span><span class="gem-n">' + (g.gems > 0 ? '+' : '') + g.gems + '</span></li>').join('') + '</ul>' : '<p class="empty">Nothing earned yet.</p>') + '</section>';
  }

  /* ---------- settings ---------- */
  function settings() {
    const d = S(), st = d.settings;
    const num = (k, label, hint) => '<div class="field"><label for="s-' + k + '">' + label + '</label><input id="s-' + k + '" type="number" min="0" data-set="' + k + '" value="' + st[k] + '">' + (hint ? '<p class="hint">' + hint + '</p>' : '') + '</div>';
    const editor = (key, title, arr, ord) => '<section class="card"><h2 style="margin-bottom:8px">' + title + '</h2><ul class="list">' + arr.map((x, i) =>
      '<li><input type="text" class="grow" data-list="' + key + '" data-id="' + x.id + '" value="' + esc(x.name) + '" aria-label="' + title + ' name">' +
      (ord && i > 0 ? '<button class="btn quiet small" data-act="up" data-key="' + key + '" data-id="' + x.id + '">Move up</button>' : '') +
      '<button class="btn quiet small danger" data-act="del-list" data-key="' + key + '" data-id="' + x.id + '">Remove</button></li>').join('') + '</ul>' +
      '<form data-form="list" data-key="' + key + '" class="row" style="margin-top:12px"><input type="text" name="name" class="grow" placeholder="Add one" aria-label="Add to ' + title + '" required maxlength="40"><button class="btn primary" type="submit">Add</button></form>' +
      (ord ? '<p class="hint">Lowest first. The last one ranks highest.</p>' : '') + '</section>';

    return '<div class="page-head"><div><h1>Settings</h1><p class="sub">Every number here is yours to change.</p></div></div>' +
      '<section class="card"><h2 style="margin-bottom:12px">Goals</h2><div class="fields">' +
      num('weeknightMin', 'Minutes each weeknight', 'Monday to Friday.') +
      num('weekendMin', 'Minutes across the weekend', 'Split between Saturday and Sunday however you like.') + '</div></section>' +
      '<section class="card"><h2 style="margin-bottom:12px">Gems</h2><div class="fields">' +
      num('gemsPerMin', 'Gems per minute studied') + num('goalBonus', 'Bonus for meeting a goal') +
      num('streakEvery', 'Streak bonus every N goals', '0 turns it off.') + num('streakBonus', 'Streak bonus gems') +
      num('maxSessionMin', 'Longest session that counts (minutes)', 'Stops a forgotten timer from earning gems.') + '</div>' +
      '<p class="hint">Gems can only be earned by studying. There is no way to add them here.</p></section>' +
      '<div class="cols">' + editor('subjects', 'Subjects', d.subjects, false) + editor('levels', 'Importance levels', d.levels, true) + '</div>' +
      '<section class="card"><h2 style="margin-bottom:12px">Appearance</h2><div class="field" style="max-width:240px"><label for="s-theme">Theme</label><select id="s-theme" data-set-text="theme">' +
      [['auto', 'Match my device'], ['light', 'Light'], ['dark', 'Dark']].map(x => '<option value="' + x[0] + '"' + (st.theme === x[0] ? ' selected' : '') + '>' + x[1] + '</option>').join('') + '</select></div></section>' +
      '<section class="card"><h2 style="margin-bottom:8px">Your data</h2><p class="sub" style="margin-bottom:12px">Saved in this browser. Use export and import to move it to another device until sign-in is added.</p>' +
      '<div class="row"><button class="btn" data-act="export">Export</button>' +
      '<label class="btn" style="margin:0;cursor:pointer">Import<input type="file" accept="application/json" data-act="import" hidden></label>' +
      '<button class="btn danger" data-act="erase">Erase everything</button></div></section>';
  }

  window.Pages = { setup, home, tasks, task, subjects, subject, shop, history, settings, blocks, gemN };
})();
