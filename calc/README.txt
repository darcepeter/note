CALCULATOR (ForceCalc web port) - v2

UPDATE / INSTALL
Replace the "calc" folder in your repo with this one (same place: repo root, next to index.html), commit, wait ~1 minute.
Fully close the installed Calculator app and reopen it twice so the new version loads. First install: Chrome > open
https://darcepeter.github.io/note/calc/ > menu > "Install app".

LOOK
Styled after the Pixel calculator. The top-bar icons and the little arrows above the keypad are decoration.
- "( )" key: works as the +/- sign key (there is no parenthesis maths). It does nothing on an empty 0.
- Backspace key: deletes the last digit of the number being typed. It does nothing after = or right after an operator.
- The equation line now sits above the big number (they no longer overlap).

GESTURES
- 5 quick taps on the display: opens TRICK SETTINGS (everything you can change, below).
- Long-press the display (force number set): buzz, then 3 taps on it, then press =. The last number is solved so the
  answer lands on the force number.

TRICK SETTINGS SCREEN (changes save instantly; Done closes it)
- Force number: type it, or "Enter it on the keypad instead" for the original keypad entry. Clear force.
- Tricks (patterns): several saved setups; tap the circle to make one active; Copy, rename, Delete, + New pattern.
- Recording steps: for each piece of information (day, month) pick which operation records it (Operation 1 = the
  first "operator + number" finished) and which operator must come before it (+ - x / or any). An example sum and the
  resulting notification are shown live. Banks can be removed/added (only the Birthday bank exists so far).
- Notification: on/off, which bank, delay (seconds), "send right away if I leave", editable title and text with tap-to-
  insert fields ({sign}, {date}, {celebrity}, {element}, ...), live preview, allow-notifications button, test button.
- Shared data: what the calculator has saved for other apps (Notary will read this), refresh, clear.
- Backup & reset: export/import all settings as text; reset to the original.

DEFAULT TRICK (same as before): operation 2 = "+ day", operation 3 = "x month".
Example: 3 + 2 + 21 x 10 + [force] =   ->   October 21.

CHECKED
- Logic compared with the original Java on ~15,000 random keypad/gesture sessions and all 366 dates (with and without
  force injection): identical. The new backspace key, "any operator", the settings screen and pattern edits were
  tested in a browser, not against the Java original (the original has none of them).
- NOT checked on a real phone: install, gesture feel, vibration, notification arrival, how the look matches.

v3 — NORMAL MATHS ALL THE TIME
 - The calculator is now a normal expression calculator: ( ) key, 2+3×4 = 14, live preview, % , backspace.
   A minus where a number should start is a sign (−5, 3 × −2).
 - Recording: every number you type after the first is logged with the operator typed right before it
   (brackets ignored). "Operation #1" in settings = the 2nd number typed, #2 = the 3rd, and so on.
 - Force: the last number is replaced by whatever makes the WHOLE expression equal the force number
   (works inside brackets, through ×, ÷, − etc.). Numbers typed before it are still recorded.
 - The old step-by-step engine is kept in archive/engine_stepbystep.js if it is ever wanted back.

v4
 - Display like the Pixel calculator: big line = the equation while typing (the result after =), small line = live answer.
 - History (top left), ⋮ menu (Clear history works) and the expand arrow (sin cos tan ln log √ π ^ ! Deg Inv) all work.
 - Trick settings: the title bar is a drop-down that jumps to any section.
 - Equation builder: the whole sum is shown at once, e.g. Day × Month + any + force = 1985. The FIRST number can now be recorded too.
