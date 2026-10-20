/* Data store. Everything lives in one object, saved to the browser.
   To sync between devices later, replace load() and save() with Supabase calls;
   nothing else touches storage. */
(function () {
  const KEY = '27study.v1';
  const PALETTE = ['#0e6b5c', '#2f5fd0', '#8a4fd6', '#c4492f', '#b7791f', '#c23b73', '#3d7a2a', '#5b6b73'];

  function defaults() {
    return {
      v: 2,
      setupDone: false,
      settings: {
        weeknightMin: 60,    // Mon to Fri goal, minutes
        weekendMin: 240,     // Sat + Sun goal, minutes in total
        gemsPerMin: 1,
        goalBonus: 50,       // gems for meeting a goal
        streakEvery: 7,      // streak bonus every N goals met in a row (0 = off)
        streakBonus: 100,
        maxSessionMin: 240,  // a session counts at most this long (stops a forgotten timer earning gems)
        theme: 'auto'        // auto | light | dark
      },
      subjects: [],          // { id, name, color, blocks }
      levels: [],            // importance, lowest first: { id, name }
      todos: [],             // { id, title, subjectId, levelId, due, done, at, blocks }
      sessions: [],          // { id, start, end, secs, subjectId, todoId }
      ledger: [],            // every gem gained or spent: { id, at, type, gems, note, unit? }
      purchases: [],         // { id, itemId, name, kind, price, at, used }
      shop: [
        { id: 'freeze', name: 'Streak freeze', price: 150, kind: 'freeze' }
      ],
      active: null           // { start, subjectId, todoId, pausedAt, pausedMs } while the timer runs
    };
  }
  // A block is one line of a page: { id, type: 'text' | 'h' | 'bullet' | 'todo', text, done }

  function merge(d) {
    const base = defaults();
    const s = Object.assign(base, d, { settings: Object.assign(base.settings, d.settings || {}) });
    s.subjects.forEach((x, i) => { if (!x.color) x.color = PALETTE[i % PALETTE.length]; if (!Array.isArray(x.blocks)) x.blocks = []; });
    s.todos.forEach(t => { if (!Array.isArray(t.blocks)) t.blocks = []; if (t.due == null) t.due = ''; });
    if (s.active) { s.active.pausedAt = s.active.pausedAt || 0; s.active.pausedMs = s.active.pausedMs || 0; }
    return s;
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? merge(JSON.parse(raw)) : defaults();
    } catch (e) {
      return defaults();
    }
  }

  let state = load();

  window.Store = {
    PALETTE,
    get: () => state,
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
    },
    replace(next) { state = merge(next); this.save(); },
    reset() { state = defaults(); this.save(); },
    uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  };
})();
