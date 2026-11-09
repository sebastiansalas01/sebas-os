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


## November 10 update
Meal checklist and duplicate lunch/dinner schedule panels removed. The day is browsable within one vertical command card; meals use packaged AI-generated food backgrounds. Whole beef steak with a rare preference is included in rotation and can be chosen manually. Food images are illustrative serving ideas.
Sleep is scheduled at 23:30 Kyiv. An in-page dialog is displayed while the page is visible. A custom chime requires explicit audio activation in the current browser session; browser audio may be suppressed, suspended, or blocked. This is not an installed iOS alarm and does not bypass Silent or Focus, run reliably with the page closed, or create a persistent Lock Screen Live Activity.
Native requirement: an iOS application with AlarmKit authorization for scheduled alarms and ActivityKit/WidgetKit for Live Activities. System notification ordering, activity visibility, dismissal, device power, and permissions remain under iOS/user control; no promise of always first or permanently visible.
Official reference: https://developer.apple.com/documentation/alarmkit/scheduling-an-alarm-with-alarmkit
Validation: 83 tests and JS syntax checks pass. No actual iOS microphone, lock-screen alarm, or Focus bypass has been verified.
