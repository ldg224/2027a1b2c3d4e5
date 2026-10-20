/* Goals, streaks and gems. Pure functions over the state object.
   A "unit" is one weeknight (Mon to Fri) or one whole weekend (Sat + Sun). */
(function () {
  const pad = n => String(n).padStart(2, '0');
  const ymd = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
  const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  function unitOf(date, st) {
    const d = startOfDay(date), dow = d.getDay();
    if (dow === 0 || dow === 6) {
      const sat = dow === 0 ? addDays(d, -1) : d;
      return { key: 'W' + ymd(sat), kind: 'weekend', start: sat, end: addDays(sat, 2), goalSec: st.weekendMin * 60 };
    }
    return { key: ymd(d), kind: 'day', start: d, end: addDays(d, 1), goalSec: st.weeknightMin * 60 };
  }

  function unitSecs(state, u) {
    let t = 0;
    for (const s of state.sessions) if (s.start >= u.start.getTime() && s.start < u.end.getTime()) t += s.secs;
    return t;
  }

  /* Walk every unit since the first session. A met unit adds to the streak.
     A missed unit uses a freeze bought before it ended, or resets the streak. */
  function timeline(state, now) {
    const st = state.settings, out = [];
    const freezes = state.purchases.filter(p => p.kind === 'freeze').map(p => p.at).sort((a, b) => a - b);
    if (!state.sessions.length) return { units: out, streak: 0, freezesLeft: freezes.length };
    const first = startOfDay(Math.min(...state.sessions.map(s => s.start)));
    const today = startOfDay(now), seen = new Set();
    let streak = 0, used = 0;
    for (let d = new Date(first); d <= today; d = addDays(d, 1)) {
      const u = unitOf(d, st);
      if (seen.has(u.key)) continue;
      seen.add(u.key);
      const secs = unitSecs(state, u);
      let status;
      if (secs >= u.goalSec) { streak++; status = 'met'; }
      else if (u.end.getTime() > now) status = 'pending';
      else if (freezes.filter(t => t < u.end.getTime()).length - used > 0) { used++; status = 'frozen'; }
      else { streak = 0; status = 'missed'; }
      out.push(Object.assign({}, u, { secs, status, streak }));
    }
    return { units: out, streak, freezesLeft: freezes.length - used };
  }

  const balance = state => state.ledger.reduce((a, l) => a + l.gems, 0);

  function startSession(state, subjectId, todoId, now) {
    if (state.active) return;
    state.active = { start: now, subjectId: subjectId || '', todoId: todoId || '' };
  }

  /* Ends the timer, records the session and pays out gems. */
  function endSession(state, now) {
    const a = state.active; if (!a) return null;
    const st = state.settings, uid = window.Store.uid;
    const secs = Math.max(0, Math.round((now - a.start) / 1000));
    state.active = null;
    state.sessions.push({ id: uid(), start: a.start, end: now, secs, subjectId: a.subjectId, todoId: a.todoId });
    const result = { secs, gems: 0 };
    const study = Math.floor(secs / 60 * st.gemsPerMin);
    if (study > 0) state.ledger.push({ id: uid(), at: now, type: 'study', gems: study, note: Math.floor(secs / 60) + ' min studied' });
    result.gems += study;
    const u = unitOf(new Date(a.start), st);
    if (unitSecs(state, u) >= u.goalSec && !state.ledger.some(l => l.type === 'goal' && l.unit === u.key)) {
      state.ledger.push({ id: uid(), at: now, type: 'goal', gems: st.goalBonus, note: 'Goal met', unit: u.key });
      result.gems += st.goalBonus;
      const t = timeline(state, now);
      if (st.streakEvery > 0 && t.streak > 0 && t.streak % st.streakEvery === 0) {
        state.ledger.push({ id: uid(), at: now, type: 'streak', gems: st.streakBonus, note: t.streak + ' in a row', unit: u.key });
        result.gems += st.streakBonus;
      }
    }
    return result;
  }

  function buy(state, itemId, now) {
    const item = state.shop.find(i => i.id === itemId);
    if (!item || balance(state) < item.price) return false;
    const uid = window.Store.uid;
    state.ledger.push({ id: uid(), at: now, type: 'purchase', gems: -item.price, note: item.name });
    state.purchases.push({ id: uid(), itemId: item.id, name: item.name, kind: item.kind, price: item.price, at: now, used: false });
    return true;
  }

  window.Logic = { ymd, startOfDay, addDays, unitOf, unitSecs, timeline, balance, startSession, endSession, buy };
})();
