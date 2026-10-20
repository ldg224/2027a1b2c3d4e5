# 27Study

A study planner for VCE 2027. Study with a focus timer, keep a streak, earn gems and spend them in a shop you set up yourself.

- **Starting a session:** one list of your tasks. Tap a task and the timer starts; or study a subject, or just study.
- **Focus screen:** full-screen while you study: session clock, local time, time left to your goal and the time you will reach it, gems so far, pause and end. On the right, a Now card for the current task (with Complete), then Up next (tap a task to switch; time is split per task) and Notes. Minimise it to keep browsing.
- **Pages:** every task and every subject has its own page with properties and a block editor (text, headings, lists, to-dos). Type `-`, `[]` or `#` at the start of a line to convert it.
- **Goals:** 60 minutes each weeknight, 240 minutes across the weekend (Saturday and Sunday are one goal). Both are editable.
- **Gems** come only from studying: per minute, plus bonuses for meeting a goal and for streak milestones. There is no way to add gems by hand.
- A streak freeze (bought in the shop) covers one missed day or weekend.
- Data is saved in the browser. Export and import in Settings move it between devices until sign-in sync is added.

## Files
- `index.html`: the page.
- `css/style.css`: styles.
- `js/store.js`: data and saving (the one place to swap for Supabase sync).
- `js/logic.js`: goals, streaks and gems.
- `js/ui.js`: icons, formatting and screen state.
- `js/pages.js`: the pages (home, tasks, task and subject pages, shop, history, settings).
- `js/focus.js`: the focus screen and the start and finished dialogs.
- `js/app.js`: shell, routing and events.

No build step: open `index.html` or serve the folder.
