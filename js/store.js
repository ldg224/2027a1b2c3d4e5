/* Data store. Everything lives in one object, saved to the browser.
   To sync between devices later, replace load() and save() with Supabase calls;
   nothing else touches storage. */
(function () {
  const KEY = '27study.v1';

  function defaults() {
    return {
      v: 1,
      setupDone: false,
      settings: {
        weeknightMin: 60,   // Mon to Fri goal, minutes
        weekendMin: 240,    // Sat + Sun goal, minutes in total
        gemsPerMin: 1,
        goalBonus: 50,      // gems for meeting a goal
        streakEvery: 7,     // streak bonus every N goals met in a row (0 = off)
        streakBonus: 100
      },
      subjects: [],         // { id, name }
      levels: [],           // importance, lowest first: { id, name }
      todos: [],            // { id, title, subjectId, levelId, done, at }
      sessions: [],         // { id, start, end, secs, subjectId, todoId }
      ledger: [],           // every gem gained or spent: { id, at, type, gems, note, unit? }
      purchases: [],        // { id, itemId, name, kind, price, at, used }
      shop: [
        { id: 'freeze', name: 'Streak freeze', price: 150, kind: 'freeze' }
      ],
      active: null          // { start, subjectId, todoId } while the timer runs
    };
  }

  function merge(d) {
    const base = defaults();
    return Object.assign(base, d, { settings: Object.assign(base.settings, d.settings || {}) });
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
    get: () => state,
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
    },
    replace(next) { state = merge(next); this.save(); },
    reset() { state = defaults(); this.save(); },
    uid: () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  };
})();
