CALCULATOR (ForceCalc web port) - stage 1

INSTALL
1. Put this whole "calc" folder at the root of your GitHub repo (next to index.html), commit, wait ~1 minute.
2. In Chrome on the phone open  https://darcepeter.github.io/note/calc/  and use menu > "Install app".
   It appears as "Calculator" with a green = icon, separate from Notary.
3. Open it from its icon. Set notifications up once (see below).

USE (unchanged from the Android app)
- 5 quick taps on the display: SET FORCE NUMBER. Type the number, press =.
- 5 more taps while in that screen: SETTINGS. Press AC to leave either screen.
- Long-press the display (force number set): feel the buzz, then 3 taps on the display. It solves the number
  the pending operation needs so the answer lands on the force. Press = to finish.
- Birthday pattern (default, same as before): second logged step is "+ DAY", third is "x MONTH".
  Example: 3 + 2 + 21 x 10 + [force] =  ->  October 21.

SETTINGS (press = to save and move on, % to skip, AC to exit)
 1 NOTIF DELAY (SEC)      2 DAY OP INDEX     3 DAY OP TYPE      4 MONTH OP INDEX   5 MONTH OP TYPE
 New in the web version:
 6 SEND IF I LEAVE (1/0)  - 1: if the screen locks or you leave the app before the delay ends, the reveal is sent
                            right away instead of being lost (same idea as Notary's Peek option).
 7 NOTIFICATIONS (=)      - shows ALLOWED / ASK / BLOCKED. Press = while it says ASK to get the Android prompt.
 8 TEST NOTIF (=)         - sends a test notification now.
 The last setting's = saves everything. (AC or % on the way out keeps changes only until the app closes, like the original.)

SHARED DATA
Every recognised birthday is also saved for other apps on this site (key fc_bus_v1), with fields: day, month, date,
monthName, sign, signName, signSymbol, signIndex (Aries=1 ... Pisces=12), element, quality, celebrity.
Notary will read this in stage 3.

CHECKED
- Logic compared against the original Java on ~15,000 random keypad/gesture sessions and all 366 dates (with and
  without force injection): identical displays, history lines, notifications and delays.
- NOT checked on a real phone: install, gestures feel, vibration, notification arrival (phone and watch).
