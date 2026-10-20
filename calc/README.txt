CALCULATOR  (lives at /note/calc/ — install it to the home screen from Chrome)

Files
  index.html     the app (calculator, history, menu, scientific keys, storage, notifications)
  engine.js      the maths + hidden force/recording logic
  settings.js    the trick settings screen (5 quick taps on the display)
  data.js        birthday/celebrity data
  sw.js          offline cache + notification taps   (bump CACHE_NAME whenever any file changes)
  manifest.json, icon-*.png

It is a normal calculator: brackets, precedence, %, backspace, history, and the scientific keys
(tap the arrow above the keypad).

Hidden parts
  - 5 quick taps on the display      -> trick settings (force number, patterns, equation builder,
                                         notification, shared data, backup)
  - long-press the display (buzz)    -> armed; tap 3 times; the last number you type is solved so the
                                         whole sum equals the force number; press =
  - AC                               -> always gets you out of the armed / forced states
  - Recording: every number typed is logged with the operator before it (brackets ignored); the
    Equation builder says which of them are recorded (e.g. Day x Month first). Recorded info goes to
    the shared "bus" (localStorage fc_bus_v1) for Notary, and optionally to a notification.
  - Settings > Equation shows the last sum worked out and why it was / wasn't recorded.

Storage keys: fc_calc_v1 (settings), fc_bus_v1 (shared), fc_hist_v1 (history), fc_last_eval, fc_notif_log
