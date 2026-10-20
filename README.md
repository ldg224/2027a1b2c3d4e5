# 27Study

A quiet study planner for VCE 2027. Study with a live timer, keep a streak, earn gems and spend them in a shop you set up yourself.

- Goals: 60 minutes each weeknight, 240 minutes across the weekend (Saturday and Sunday count as one goal). Both are editable.
- Gems come only from studying: per minute, plus bonuses for meeting a goal and for streak milestones. There is no way to add gems by hand.
- A streak freeze (bought in the shop) covers one missed day or weekend.
- Tasks with subject and importance tags; pick one when you start a session.
- Data is saved in the browser. Export and import in Settings move it between devices until sign-in sync is added.

## Files
- `index.html`: the page.
- `css/style.css`: styles.
- `js/store.js`: data and saving (the one place to swap for Supabase sync).
- `js/logic.js`: goals, streaks and gems.
- `js/app.js`: the interface.

No build step: open `index.html` or serve the folder.
