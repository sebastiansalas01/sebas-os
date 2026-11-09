# Closing and weekly planner
Implemented in this branch:
- Monthly target 16; totals and cash-based 8% commission split by receipt date, days 1–15 / 16–end.
- Full payment, 70% financed cash, split half now and half due in exactly 30 calendar days.
- Client required only for split sales. Collection date determines second-payment commission; no duplicate collection.
- Yellow due day through five days overdue; red after five days. In-app pending-payment notices.
- Calendar card heights reflect duration subject to 44px touch minimum.
- Calendar settings moved to main Settings; goals collapsed and reading duration editable.
- English proposals weekends and one selectable weekday 08:30–09:30; Tuesday mentor 20:00–21:00; Tuesday/Friday suggested Closing hours end 18:30.
- Dinner 30 minutes after last commercial call; quick option removed from calendar, retained in command and meal views.
Validation: JS syntax parsing; 9 Closing assertions and 18 planner assertions evaluated in JavaScript orchestration runtime. Node test file provided, but full repository tests and browser visual/end-to-end checks could not run after workspace execution environment disconnected.
Remaining: Slack OAuth and ChatGPT backend integration, actual push reminders for second payments, conflict-aware alternate English slot suggestions when real events displace proposals, exact meal photography (current dinner image is labeled illustrative), visual QA, secure sync/backup of sales. Local sales data currently stays in the browser.
No Slack connection from ChatGPT is transferred to this application. Do not paste Slack or OpenAI secrets into the public frontend.
