/* The focus screen shown while the timer runs, plus the start and finished dialogs. */
(function () {
  const { esc, icon, dur, clock, time } = UI;
  const U = UI.s, L = Logic, S = () => Store.get();

  function focusHtml() {
    const d = S(), a = d.active, now = Date.now(), st = d.settings;
    const u = L.unitOf(new Date(a.start), st);
    const cur = d.todos.find(t => t.id === a.todoId);
    const sub = d.subjects.find(s => s.id === a.subjectId);
    const where = u.kind === 'weekend' ? 'this weekend' : 'tonight';
    // what to work on next: same subject first, then by how pressing it is
    const next = Pages.rank(d.todos.filter(t => !t.done && t.id !== a.todoId))
      .sort((x, y) => (y.subjectId === a.subjectId && !!a.subjectId) - (x.subjectId === a.subjectId && !!a.subjectId));

    const doneSecs = L.unitSecs(d, u) + Math.min(L.elapsed(a, now), st.maxSessionMin * 60);
    const offset = (UI.ringC * (1 - Math.min(1, doneSecs / u.goalSec))).toFixed(1);   // start where the ring should be, so redraws do not re-sweep
    const tile = (key, label) => '<div class="f-tile"><span>' + label + '</span><b data-live="' + key + '"></b></div>';
    const tab = (key, label) => '<button role="tab" data-act="focus-tab" data-id="' + key + '" aria-pressed="' + (U.focusTab === key) + '">' + label + '</button>';

    const now_ = '<div class="f-now"><span class="f-now-l">Now</span><b class="f-now-t">' + (cur ? esc(cur.title) : 'Open study') + '</b>' +
      '<span class="f-now-m">' + (sub ? '<span class="f-dot" style="background:' + sub.color + '"></span>' + esc(sub.name) : 'No subject') + '</span>' +
      (cur
        ? '<div class="f-now-a"><button class="btn small' + (cur.done ? '' : ' primary') + '" data-act="complete-current">' + icon('check', 14) + (cur.done ? 'Completed. Undo' : 'Complete task') + '</button>' +
          '<button class="btn quiet small" data-act="switch-task" data-id="">Stop tracking this task</button></div>'
        : '<p class="f-muted">Time is counted without a task. Pick one below to track it.</p>') + '</div>';

    const nextTab = '<ul class="f-tasks">' + next.slice(0, 14).map(t => {
      const s = d.subjects.find(x => x.id === t.subjectId);
      return '<li><button class="f-task" data-act="switch-task" data-id="' + t.id + '" aria-label="Switch to ' + esc(t.title) + '">' +
        '<span class="f-task-t">' + esc(t.title) + '</span><span class="f-task-m">' + (s ? '<span class="f-dot" style="background:' + s.color + '"></span>' + esc(s.name) : 'No subject') + '</span>' +
        '<span class="f-go">' + icon('play', 12) + '</span></button></li>';
    }).join('') + '</ul>' + (next.length ? '' : '<p class="f-muted" style="padding:6px 2px">Nothing else to do. Add a task below.</p>') +
      '<form class="f-add" data-form="focus-add"><input type="text" name="title" placeholder="Add a task' + (sub ? ' for ' + esc(sub.name) : '') + '" aria-label="New task" required maxlength="140"><button class="btn small" type="submit">Add</button></form>';

    const notesTab = cur ? Pages.blocks('task', cur.id, cur.blocks)
      : sub ? Pages.blocks('subject', sub.id, sub.blocks)
        : '<p class="f-muted">Pick a task or subject to see its notes here.</p>';

    return '<div class="focus" id="focus" style="--c:' + (sub ? sub.color : 'var(--accent)') + '" role="dialog" aria-label="Study session">' +
      '<header class="f-top"><span class="f-brand">27Study</span>' +
      '<div class="f-local"><b data-live="local"></b><span data-live="localdate"></span></div>' +
      '<button class="btn quiet" data-act="minimize">' + icon('min', 16) + 'Minimise</button></header>' +
      '<div class="f-body"><section class="f-main">' +
      '<div class="f-ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="track" cx="100" cy="100" r="88" fill="none" stroke-width="7"/>' +
      '<circle class="bar" data-live="ring" cx="100" cy="100" r="88" fill="none" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + UI.ringC.toFixed(1) + '" stroke-dashoffset="' + offset + '"/></svg>' +
      '<div class="f-ring-mid"><span class="f-state" data-live="state"></span><b class="f-clock" data-live="clock">00:00:00</b>' +
      '<span class="f-what">' + (cur ? esc(cur.title) : 'Open study') + '</span></div></div>' +
      '<div class="f-tiles">' + tile('today', 'Studied ' + where) + tile('remain', 'Left to goal') + tile('eta', 'Goal reached at') + tile('gems', 'Gems this session') + '</div>' +
      '<div class="f-controls"><button class="btn f-btn" data-act="' + (a.pausedAt ? 'resume' : 'pause') + '">' + icon(a.pausedAt ? 'play' : 'pause', 16) + (a.pausedAt ? 'Resume' : 'Pause') + '</button>' +
      '<button class="btn primary f-btn" data-act="done">' + icon('check', 16) + 'End session</button></div>' +
      '<button class="btn quiet small" data-act="discard">Discard session</button></section>' +
      '<aside class="f-side">' + now_ +
      '<div class="f-tabs" role="tablist">' + tab('next', 'Up next <span class="f-count">' + next.length + '</span>') + tab('notes', 'Notes') + '</div>' +
      '<div class="f-panel">' + (U.focusTab === 'notes' ? notesTab : nextTab) + '</div></aside></div></div>';
  }

  /* Updates the live numbers on the focus screen and the minimised pill. Runs twice a second. */
  function tick() {
    const d = S(), a = d.active, now = Date.now();
    const lt = new Date(now);
    document.querySelectorAll('[data-live="local"]').forEach(e => { e.textContent = lt.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', second: '2-digit' }); });
    document.querySelectorAll('[data-live="localdate"]').forEach(e => { e.textContent = lt.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }); });
    if (!a) { document.title = '27Study'; return; }
    const st = d.settings, u = L.unitOf(new Date(a.start), st);
    const el = L.elapsed(a, now), cap = st.maxSessionMin * 60, counted = Math.min(el, cap);
    const done = L.unitSecs(d, u) + counted, remain = Math.max(0, u.goalSec - done);
    const set = (k, v) => document.querySelectorAll('[data-live="' + k + '"]').forEach(e => { if (e.textContent !== v) e.textContent = v; });
    set('clock', clock(el)); set('pill', clock(el));
    set('today', dur(done));
    set('remain', remain ? clock(remain) : 'Goal met');
    set('eta', remain === 0 ? 'Reached' : a.pausedAt ? 'Paused' : time(now + remain * 1000));
    set('gems', String(Math.floor(counted / 60 * st.gemsPerMin)));
    set('state', a.pausedAt ? 'Paused' : el >= cap ? 'Session limit reached' : 'Studying');
    document.querySelectorAll('[data-live="ring"]').forEach(e => e.setAttribute('stroke-dashoffset', (UI.ringC * (1 - Math.min(1, done / u.goalSec))).toFixed(1)));
    const f = document.getElementById('focus');
    if (f) { f.classList.toggle('met', remain === 0); f.classList.toggle('paused', !!a.pausedAt); }
    document.title = (a.pausedAt ? 'Paused ' : '') + clock(el) + ' · 27Study';
  }

  function pill() {
    const a = S().active, t = S().todos.find(x => x.id === a.todoId);
    return '<button class="pill" data-act="restore" aria-label="Return to your session"><span class="pill-dot"></span><b data-live="pill">00:00:00</b>' +
      '<span class="pill-t">' + esc(t ? t.title : 'Open study') + '</span>' + icon('chevron', 14) + '</button>';
  }

  /* Start a session: one list. Tap a task and the timer starts. */
  function startModal() {
    const d = S(), q = U.pickQ.trim().toLowerCase();
    const list = Pages.rank(d.todos.filter(t => !t.done)).filter(t =>
      (!U.pickSubject || t.subjectId === U.pickSubject) && (!q || t.title.toLowerCase().includes(q)));
    const chip = (id, label, color) => '<button class="pk-chip" data-act="pick-filter" data-id="' + id + '" aria-pressed="' + (U.pickSubject === id) + '">' +
      (color ? '<span class="f-dot" style="background:' + color + '"></span>' : '') + esc(label) + '</button>';

    return '<div class="modal-back" data-act="close-start"><div class="modal wide" role="dialog" aria-modal="true" aria-label="Start a session">' +
      '<div class="modal-h"><div><h2>What are you studying?</h2><p class="sub">Tap a task to start the timer.</p></div>' +
      '<button class="icon-btn" data-act="close-start" aria-label="Close">' + icon('x', 18) + '</button></div>' +
      '<input id="m-q" type="text" data-filter="pick" placeholder="Search your tasks" aria-label="Search tasks" value="' + esc(U.pickQ) + '" autocomplete="off">' +
      (d.subjects.length ? '<div class="pk-chips">' + chip('', 'All') + d.subjects.map(s => chip(s.id, s.name, s.color)).join('') + '</div>' : '') +
      '<ul class="pk-list">' + (list.length ? list.map(t =>
        '<li><button class="pk-row" data-act="pick-task" data-id="' + t.id + '"><span class="pk-t">' + esc(t.title) + '</span><span class="meta">' +
        Pages.tagSubject(t.subjectId) + Pages.tagLevel(t.levelId) + '</span><span class="pk-go">' + icon('play', 13) + '</span></button></li>').join('')
        : '<li class="empty">' + (d.todos.some(t => !t.done) ? 'No tasks match.' : 'You have no tasks yet.') + ' Start without one below, or add a task on the Tasks page.</li>') + '</ul>' +
      '<div class="pk-foot"><span class="sub">No task:</span>' +
      d.subjects.map(s => '<button class="btn small" data-act="pick-subject" data-id="' + s.id + '"><span class="f-dot" style="background:' + s.color + '"></span>' + esc(s.name) + '</button>').join('') +
      '<button class="btn small" data-act="pick-open">Just study</button></div></div></div>';
  }

  function summaryModal() {
    const r = U.summary, d = S(), t = d.todos.find(x => x.id === r.todoId);
    return '<div class="modal-back" data-act="close-summary"><div class="modal center" role="dialog" aria-modal="true" aria-label="Session complete">' +
      '<span class="done-ic">' + icon('check', 28) + '</span><h2>Session complete</h2>' +
      '<p class="sub">' + dur(r.secs) + ' logged' + (r.tasks > 1 ? ' across ' + r.tasks + ' tasks' : t ? ' on ' + esc(t.title) : '') + '.</p>' +
      '<div class="sum-row"><div><b>' + Pages.gemN(r.gems) + '</b><span class="sub">earned</span></div>' +
      '<div><b>' + (r.goalMet ? 'Goal met' : 'Keep going') + '</b><span class="sub">' + (r.goalMet ? 'streak extended' : 'goal in progress') + '</span></div></div>' +
      (r.capped ? '<p class="hint">This session hit the ' + dur(S().settings.maxSessionMin * 60) + ' limit, so the rest was not counted.</p>' : '') +
      '<div class="row" style="justify-content:center;margin-top:18px"><button class="btn primary" data-act="close-summary">Back to 27Study</button></div></div></div>';
  }

  window.Focus = { focusHtml, tick, pill, startModal, summaryModal };
})();
