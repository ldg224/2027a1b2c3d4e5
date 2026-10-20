/* Shared interface helpers: icons, formatting and the small bits of screen state. */
(function () {
  const ICONS = {
    home: '<path d="M3.5 11 12 3.5 20.5 11"/><path d="M5.5 9.5V20h13V9.5"/><path d="M10 20v-5h4v5"/>',
    tasks: '<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="m8 12.2 3 3 5-6"/>',
    book: '<path d="M4.5 5.5A1.5 1.5 0 0 1 6 4h13v13H6.5A2 2 0 0 0 4.5 19z"/><path d="M4.5 19A2 2 0 0 0 6.5 21H19v-4"/>',
    bag: '<path d="M5 8h14l-1.2 12H6.2z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
    chart: '<path d="M5 20V11"/><path d="M12 20V4"/><path d="M19 20v-7"/>',
    sliders: '<path d="M4 7h9"/><path d="M17 7h3"/><path d="M4 17h3"/><path d="M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
    play: '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
    pause: '<rect x="6.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="13.5" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    min: '<path d="M14 10h6M14 10V4M10 14H4M10 14v6"/><path d="m20 4-6 6M4 20l6-6"/>',
    trash: '<path d="M4.5 7h15"/><path d="M9.5 7V4.5h5V7"/><path d="m6.5 7 1 13h9l1-13"/>',
    flame: '<path d="M12 3c.6 3.6 5 5.2 5 10.2A5 5 0 0 1 7 13.5c0-2 1-3.2 2.2-4.2.1 1.6.8 2.6 1.8 2.9C11.4 9.4 10.6 6 12 3z"/>',
    gem: '<path d="M6.5 4h11l4 5.5L12 21 2.5 9.5z"/><path d="M2.5 9.5h19M9.5 4 8 9.5 12 21l4-11.5L14.5 4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    calendar: '<rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
    flag: '<path d="M5 21V4"/><path d="M5 4h11l-2 4 2 4H5"/>',
    tag: '<path d="M3.5 12.5V4.5h8l9 9-8 8z"/><circle cx="8" cy="9" r="1.2"/>',
    doc: '<path d="M6 3h8.5L19 7.5V21H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
    chevron: '<path d="m9 6 6 6-6 6"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
    ice: '<path d="M12 3v18M4.2 7.5l15.6 9M19.8 7.5l-15.6 9"/>'
  };

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const pad = n => String(n).padStart(2, '0');

  window.UI = {
    esc, pad,
    icon: (name, size) => '<svg class="ic" width="' + (size || 18) + '" height="' + (size || 18) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>',
    clock: sec => { sec = Math.max(0, Math.floor(sec)); return pad(Math.floor(sec / 3600)) + ':' + pad(Math.floor(sec % 3600 / 60)) + ':' + pad(sec % 60); },
    dur: sec => { const m = Math.round(sec / 60), h = Math.floor(m / 60); return h ? h + 'h ' + pad(m % 60) + 'm' : m + 'm'; },
    time: t => new Date(t).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' }).replace(' ', ' '),
    day: t => new Date(t).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }),
    dueLabel: s => new Date(s + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' }),
    // screen state that is not saved
    s: {
      draft: { subjectId: '', todoId: '' },
      minimized: false, summary: null, startOpen: false,
      taskTab: 'open', taskGroup: 'importance',
      editShop: false, addSubject: false,
      focusBlock: '', focusSel: ''
    }
  };
})();
