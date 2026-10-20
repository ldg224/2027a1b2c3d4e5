/* The focus screen shown while the timer runs, plus the start and finished dialogs. */
(function () {
  const { esc, icon, dur, clock, time } = UI;
  const U = UI.s, L = Logic, S = () => Store.get();

  function focusHtml() {
    const d = S(), a = d.active, now = Date.now(), st = d.settings;
    const u = L.unitOf(new Date(a.start), st);
    const cur = d.todos.find(t => t.id === a.todoId);
    const sub = d.subjects.find(s => s.id === a.subjectId);
    const open = d.todos.filter(t => !t.done);
    const rest = open.filter(t => t.id !== a.todoId).sort((x, y) => (y.subjectId === a.subjectId) - (x.subjectId === a.subjectId));
    const where = u.kind === 'weekend' ? 'this weekend' : 'tonight';

    const doneSecs = L.unitSecs(d, u) + Math.min(L.elapsed(a, now), st.maxSessionMin * 60);
    const offset = (UI.ringC * (1 - Math.min(1, doneSecs / u.goalSec))).toFixed(1);   // start where the ring should be, so redraws do not re-sweep

    const tile = (key, label, val) => '<div class="f-tile"><span>' + label + '</span><b data-live="' + key + '">' + val + '</b></div>';

    return '<div class="focus" id="focus" style="--c:' + (sub ? sub.color : 'var(--accent)') + '" role="dialog" aria-label="Study session">' +
      '<header class="f-top"><span class="f-brand">27Study</span>' +
      '<div class="f-local"><b data-live="local"></b><span data-live="localdate"></span></div>' +
      '<button class="btn quiet" data-act="minimize">' + icon('min', 16) + 'Minimise</button></header>' +
      '<div class="f-body"><section class="f-main">' +
      '<div class="f-ring"><svg viewBox="0 0 200 200" aria-hidden="true"><circle class="track" cx="100" cy="100" r="88" fill="none" stroke-width="7"/>' +
      '<circle class="bar" data-live="ring" cx="100" cy="100" r="88" fill="none" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + UI.ringC.toFixed(1) + '" stroke-dashoffset="' + offset + '"/></svg>' +
      '<div class="f-ring-mid"><span class="f-state" data-live="state"></span><b class="f-clock" data-live="clock">00:00:00</b>' +
      '<span class="f-what">' + (cur ? esc(cur.title) : 'Open study') + (sub ? ' · ' + esc(sub.name) : '') + '</span></div></div>' +
      '<div class="f-tiles">' + tile('today', 'Studied ' + where, '') + tile('remain', 'Left to goal', '') + tile('eta', 'Goal reached at', '') + tile('gems', 'Gems this session', '') + '</div>' +
      '<div class="f-controls"><button class="btn f-btn" data-act="' + (a.pausedAt ? 'resume' : 'pause') + '">' + icon(a.pausedAt ? 'play' : 'pause', 16) + (a.pausedAt ? 'Resume' : 'Pause') + '</button>' +
      '<button class="btn primary f-btn" data-act="done">' + icon('check', 16) + 'Done</button></div>' +
      '<button class="btn quiet small" data-act="discard">Discard session</button></section>' +

      '<aside class="f-side"><div class="f-pick"><div><label for="f-todo">Working on</label><select id="f-todo" data-bind="active-todo"><option value="">Open study</option>' +
      open.map(t => '<option value="' + t.id + '"' + (t.id === a.todoId ? ' selected' : '') + '>' + esc(t.title) + '</option>').join('') + '</select></div>' +
      '<div><label for="f-sub">Subject</label><select id="f-sub" data-bind="active-subject"><option value="">None</option>' +
      d.subjects.map(s => '<option value="' + s.id + '"' + (s.id === a.subjectId ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select></div></div>' +
      (cur ? '<div class="f-card"><div class="f-card-h"><b>' + esc(cur.title) + '</b><label class="f-finish"><input class="check" type="checkbox" data-bind="finish-task"' + (U.finishTask ? ' checked' : '') + '> Finish when done</label></div>' + Pages.blocks('task', cur.id, cur.blocks) + '</div>'
        : sub ? '<div class="f-card"><div class="f-card-h"><b>' + esc(sub.name) + ' notes</b></div>' + Pages.blocks('subject', sub.id, sub.blocks) + '</div>'
          : '<div class="f-card"><p class="f-muted">Pick a task above to see its notes and checklist here.</p></div>') +
      '<div class="f-card"><div class="f-card-h"><b>To do</b><span class="f-muted">' + open.length + ' open</span></div>' +
      (rest.length ? '<ul class="f-list">' + rest.slice(0, 12).map(t => {
        const s = d.subjects.find(x => x.id === t.subjectId);
        return '<li><input class="check" type="checkbox" data-act="toggle" data-id="' + t.id + '" aria-label="Done: ' + esc(t.title) + '">' +
          '<button class="f-pick-btn" data-act="set-current" data-id="' + t.id + '" title="Work on this">' + (s ? '<i style="background:' + s.color + '"></i>' : '') + esc(t.title) + '</button></li>';
      }).join('') + '</ul>' : '<p class="f-muted">Nothing else on your list.</p>') + '</div></aside></div></div>';
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

  function startModal() {
    const d = S(), open = d.todos.filter(t => !t.done);
    return '<div class="modal-back" data-act="close-start"><div class="modal" role="dialog" aria-modal="true" aria-label="Start a session">' +
      '<h2>Start a session</h2><p class="sub" style="margin:4px 0 16px">Pick what you are working on. You can change it while you study.</p>' +
      '<div class="field"><label for="m-todo">Working on</label><select id="m-todo" data-bind="draft-todo"><option value="">Open study</option>' +
      open.map(t => '<option value="' + t.id + '"' + (t.id === U.draft.todoId ? ' selected' : '') + '>' + esc(t.title) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label for="m-sub">Subject</label><select id="m-sub" data-bind="draft-subject"><option value="">None</option>' +
      d.subjects.map(s => '<option value="' + s.id + '"' + (s.id === U.draft.subjectId ? ' selected' : '') + '>' + esc(s.name) + '</option>').join('') + '</select></div>' +
      '<div class="row end"><button class="btn quiet" data-act="close-start">Cancel</button><button class="btn primary" data-act="begin">' + icon('play', 14) + 'Start</button></div></div></div>';
  }

  function summaryModal() {
    const r = U.summary, d = S(), t = d.todos.find(x => x.id === r.todoId);
    return '<div class="modal-back" data-act="close-summary"><div class="modal center" role="dialog" aria-modal="true" aria-label="Session complete">' +
      '<span class="done-ic">' + icon('check', 28) + '</span><h2>Session complete</h2>' +
      '<p class="sub">' + dur(r.secs) + ' logged' + (t ? ' on ' + esc(t.title) : '') + '.</p>' +
      '<div class="sum-row"><div><b>' + Pages.gemN(r.gems) + '</b><span class="sub">earned</span></div>' +
      '<div><b>' + (r.goalMet ? 'Goal met' : 'Keep going') + '</b><span class="sub">' + (r.goalMet ? 'streak extended' : 'goal in progress') + '</span></div></div>' +
      (r.capped ? '<p class="hint">This session hit the ' + dur(S().settings.maxSessionMin * 60) + ' limit, so the rest was not counted.</p>' : '') +
      '<div class="row" style="justify-content:center;margin-top:18px"><button class="btn primary" data-act="close-summary">Back to 27Study</button></div></div></div>';
  }

  window.Focus = { focusHtml, tick, pill, startModal, summaryModal };
})();
