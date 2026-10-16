/*
 * ForceCalc engine — a line-by-line port of MainActivity.java's calculator, force and
 * birthday logic, with the hard-coded "day on step 1, month on step 2" rule generalised into
 * a pattern (list of captures) and banks (named groups of fields) so patterns can be edited
 * later without touching the calculator itself.
 *
 * The engine knows nothing about the page: everything it needs from the outside (time, timers,
 * storage, notifications, vibration, publishing) comes in through `env`.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./data.js"));
  else root.FCEngine = factory(root.FC_CELEBRITIES);
})(typeof self !== "undefined" ? self : this, function (CELEBRITIES) {
  "use strict";

  // ─────────────────────────────────────────────────────────────────────────
  // Number handling that matches Java's Double.parseDouble / Double.toString
  // ─────────────────────────────────────────────────────────────────────────
  var JAVA_DOUBLE = /^[+-]?(NaN|Infinity|((\d+\.?\d*|\.\d+)([eE][+-]?\d+)?)[fFdD]?)$/;

  /** Java's Double.parseDouble: returns null where Java would throw NumberFormatException. */
  function parseDoubleStrict(s) {
    if (s == null) return null;
    var t = String(s).trim();
    if (!JAVA_DOUBLE.test(t)) return null;
    if (/NaN$/.test(t)) return NaN;
    if (/Infinity$/.test(t)) return t.charAt(0) === "-" ? -Infinity : Infinity;
    return parseFloat(t.replace(/[fFdD]$/, ""));
  }
  /** The class's own parseDouble(): empty or unparseable text counts as 0. */
  function parseDouble(s) {
    if (s == null || s === "") return 0;
    var v = parseDoubleStrict(s);
    return v === null ? 0 : v;
  }
  /** Java's Double.toString for a finite, non-integer-path value. */
  function javaDoubleToString(d) {
    if (d === 0) return Object.is(d, -0) ? "-0.0" : "0.0";
    var neg = d < 0, a = Math.abs(d);
    var m = a.toExponential().match(/^(\d)(?:\.(\d+))?e([+-]\d+)$/);
    var digits = m[1] + (m[2] || ""), exp = parseInt(m[3], 10), out;
    if (a >= 1e-3 && a < 1e7) {
      if (exp >= 0) {
        var ip = digits.slice(0, exp + 1);
        while (ip.length < exp + 1) ip += "0";
        out = ip + "." + (digits.slice(exp + 1) || "0");
      } else {
        out = "0." + new Array(-exp).join("0") + digits;
      }
    } else {
      out = digits.charAt(0) + "." + (digits.slice(1) || "0") + "E" + exp;
    }
    return (neg ? "-" : "") + out;
  }
  function formatResult(d) {
    if (isNaN(d) || !isFinite(d)) return "Error";
    if (d === Math.floor(d) && Math.abs(d) < 1e15) return d === 0 ? "0" : String(d);
    var s = javaDoubleToString(d);
    if (s.indexOf(".") >= 0 && s.indexOf("E") < 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return s;
  }
  function formatForHistory(v) {
    var d = parseDoubleStrict(v);
    return d === null ? v : formatResult(d);
  }
  function isOperator(v) { return v === "+" || v === "−" || v === "×" || v === "÷"; }
  function calculate(a, op, b) {
    var da = parseDouble(a), db = parseDouble(b), r;
    switch (op) {
      case "+": r = da + db; break;
      case "−": r = da - db; break;
      case "×": r = da * db; break;
      case "÷": r = db === 0 ? 0 : da / db; break;
      default: r = db;
    }
    return formatResult(r);
  }
  function canon(op) {
    switch (op) {
      case "+": return "+";
      case "-": case "−": return "-";
      case "*": case "×": return "*";
      case "/": case "÷": return "/";
      default: return op;
    }
  }
  function normaliseOp(s) {
    switch (s) {
      case "+": return "+";
      case "-": case "−": return "−";
      case "*": case "×": return "×";
      case "/": case "÷": return "÷";
      default: return s;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Birthday data (BirthdayData.java)
  // ─────────────────────────────────────────────────────────────────────────
  var MONTHS = ["", "January", "February", "March", "April", "May", "June", "July", "August",
    "September", "October", "November", "December"];
  function monthName(m) { return (m < 1 || m > 12) ? String(m) : MONTHS[m]; }
  function getCelebrity(m, d) {
    var n = CELEBRITIES[m + "/" + d];
    return n != null ? n : "Born " + monthName(m) + " " + d;
  }
  function getStarSign(m, d) {
    if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return "♈ Aries";
    if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return "♉ Taurus";
    if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return "♊ Gemini";
    if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return "♋ Cancer";
    if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return "♌ Leo";
    if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return "♍ Virgo";
    if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return "♎ Libra";
    if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return "♏ Scorpio";
    if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return "♐ Sagittarius";
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return "♑ Capricorn";
    if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return "♒ Aquarius";
    return "♓ Pisces";
  }
  var SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio",
    "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  var ELEMENTS = ["Fire", "Earth", "Air", "Water"];
  var QUALITIES = ["Cardinal", "Fixed", "Mutable"];

  // ─────────────────────────────────────────────────────────────────────────
  // Banks: named groups of fields a pattern can record. A bank is complete once every one of its
  // fields has been captured; it then derives extra fields and is published for other apps.
  // ─────────────────────────────────────────────────────────────────────────
  var BANKS = {
    birthday: {
      id: "birthday", name: "Birthday",
      fields: [
        { id: "day", label: "Day", type: "int", min: 1, max: 31 },
        { id: "month", label: "Month", type: "int", min: 1, max: 12 }
      ],
      derive: function (v) {
        var sign = getStarSign(v.month, v.day);
        var name = sign.slice(sign.indexOf(" ") + 1);
        var idx = SIGNS.indexOf(name);
        return {
          date: monthName(v.month) + " " + v.day,
          monthName: monthName(v.month),
          sign: sign,
          signName: name,
          signSymbol: sign.slice(0, sign.indexOf(" ")),
          signIndex: idx + 1,
          element: ELEMENTS[idx % 4],
          quality: QUALITIES[idx % 3],
          celebrity: getCelebrity(v.month, v.day)
        };
      }
    }
  };

  /** The original app's behaviour, expressed as a pattern. */
  function defaultConfig() {
    return {
      v: 1,
      forceNumber: null,
      activePattern: "birthday",
      patterns: [{
        id: "birthday",
        name: "Birthday (original)",
        captures: [
          { bank: "birthday", field: "day", step: 1, op: "+" },
          { bank: "birthday", field: "month", step: 2, op: "×" }
        ],
        notify: {
          enabled: true, bank: "birthday", delaySec: 15, sendOnLeave: true,
          title: "{sign}  ·  {date}", text: "{celebrity}"
        }
      }]
    };
  }

  function fillTemplate(tpl, fields) {
    return String(tpl).replace(/\{(\w+)\}/g, function (m, k) { return fields[k] != null ? fields[k] : ""; });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // The calculator
  // ─────────────────────────────────────────────────────────────────────────
  function createCalc(env, opts) {
    opts = opts || {};
    var extraSettings = opts.extraSettings !== false;

    var MODE = { NORMAL: 0, FORCE_ENTRY: 1, FACEDOWN: 2, INJECTED: 3, SETTINGS: 4 };
    var currentVal = "0", previousVal = "", operator = null;
    var justEvaluated = false, shouldResetDisplay = false;
    var mode = MODE.NORMAL;
    var forceEntryVal = "0", facedownTaps = 0, lastEquation = "";
    var savedOpLog = [], opLog = [];
    var displayTapCount = 0, lastDisplayTapTime = 0;
    var currentSettingIndex = 0, settingInputBuffer = "";
    var pending = []; // notifications waiting out their delay: {fire, handle}

    // what the screen shows
    var hist = "", disp = "0", banner = "none", acLabel = "AC";

    var cfg = env.loadConfig ? env.loadConfig() : null;
    if (!cfg || cfg.v !== 1 || !cfg.patterns || !cfg.patterns.length) cfg = defaultConfig();
    var forceNumber = (typeof cfg.forceNumber === "number") ? cfg.forceNumber : null;

    function pattern() {
      for (var i = 0; i < cfg.patterns.length; i++) if (cfg.patterns[i].id === cfg.activePattern) return cfg.patterns[i];
      return cfg.patterns[0];
    }
    function capOf(field) {
      var caps = pattern().captures;
      for (var i = 0; i < caps.length; i++) if (caps[i].field === field) return caps[i];
      return null;
    }
    function savePrefs() {
      cfg.forceNumber = forceNumber;
      if (env.saveConfig) env.saveConfig(cfg);
    }

    // ── display helpers ──
    function refreshDisplay() {
      var d, h;
      if (justEvaluated) { d = currentVal; h = lastEquation; }
      else if (operator !== null) { d = currentVal; h = formatForHistory(previousVal) + " " + operator; }
      else { d = currentVal; h = lastEquation; }
      hist = h; disp = d;
    }

    // ── input dispatcher ──
    function handleInput(val) {
      switch (mode) {
        case MODE.NORMAL: pressNormal(val); break;
        case MODE.FORCE_ENTRY: pressForceEntry(val); break;
        case MODE.FACEDOWN: handleFacedownTap(); break;
        case MODE.INJECTED: pressInjected(val); break;
        case MODE.SETTINGS: pressSettings(val); break;
      }
    }

    // ── NORMAL ──
    function pressNormal(val) {
      if (val === "AC") {
        currentVal = "0"; previousVal = ""; operator = null; justEvaluated = false;
        shouldResetDisplay = false; opLog = []; lastEquation = "";
        refreshDisplay(); return;
      }
      if (val === "+/-") {
        if (currentVal !== "0") {
          currentVal = currentVal.charAt(0) === "-" ? currentVal.substring(1) : "-" + currentVal;
          refreshDisplay();
        }
        return;
      }
      if (val === "%") {
        currentVal = formatResult(parseDouble(currentVal) / 100.0);
        refreshDisplay(); return;
      }
      if (isOperator(val)) {
        if (operator !== null && !shouldResetDisplay) {
          var typedRhs = currentVal;
          opLog.push(operator + "|" + typedRhs);
          var result = calculate(previousVal, operator, currentVal);
          previousVal = result; currentVal = result;
        } else if (operator === null && previousVal !== "") {
          // chain after evaluation — no log, prev already set
        } else if (operator === null) {
          previousVal = currentVal;
        }
        if (justEvaluated) {
          previousVal = currentVal; justEvaluated = false; opLog = [];
        }
        operator = val; shouldResetDisplay = true; justEvaluated = false;
        refreshDisplay(); return;
      }
      if (val === "=") {
        if (operator !== null) {
          opLog.push(operator + "|" + currentVal);
          var eq = formatForHistory(previousVal) + " " + operator + " " + currentVal + " =";
          var res = calculate(previousVal, operator, currentVal);
          lastEquation = eq; currentVal = res; previousVal = ""; operator = null;
          justEvaluated = true; shouldResetDisplay = false;
          savedOpLog = opLog.slice();
          tryCapture();
          opLog = [];
          refreshDisplay();
        }
        return;
      }
      // digit or dot
      if (justEvaluated) { currentVal = "0"; previousVal = ""; opLog = []; justEvaluated = false; }
      if (shouldResetDisplay) { currentVal = "0"; shouldResetDisplay = false; }
      if (val === ".") {
        if (currentVal.indexOf(".") < 0) currentVal += ".";
      } else {
        currentVal = currentVal === "0" ? val : currentVal + val;
      }
      refreshDisplay();
    }

    // ── FORCE_ENTRY ──
    function enterForceEntryMode() {
      mode = MODE.FORCE_ENTRY; forceEntryVal = "0"; banner = "force";
      hist = ""; disp = "0"; acLabel = "C";
    }
    function pressForceEntry(val) {
      if (val === "AC" || val === "C") { forceEntryVal = "0"; disp = "0"; return; }
      if (val === "=") {
        var v = parseDoubleStrict(forceEntryVal);
        if (v !== null) { forceNumber = v; savePrefs(); }
        exitForceEntryMode(); return;
      }
      if (val === "+/-") {
        forceEntryVal = forceEntryVal.charAt(0) === "-" ? forceEntryVal.substring(1) : "-" + forceEntryVal;
        disp = forceEntryVal; return;
      }
      if (val === "%" || isOperator(val)) return;
      if (val === ".") {
        if (forceEntryVal.indexOf(".") < 0) forceEntryVal += ".";
      } else if (forceEntryVal === "0" || forceEntryVal === "-0") {
        forceEntryVal = forceEntryVal.charAt(0) === "-" ? "-" + val : val;
      } else {
        forceEntryVal += val;
      }
      disp = forceEntryVal;
    }
    function exitForceEntryMode() {
      mode = MODE.NORMAL; banner = "none"; acLabel = "AC"; refreshDisplay();
    }

    // ── SETTINGS ──
    var SETTING_NAMES = ["NOTIF DELAY (SEC)", "DAY OP INDEX", "DAY OP TYPE", "MONTH OP INDEX", "MONTH OP TYPE"];
    if (extraSettings) SETTING_NAMES = SETTING_NAMES.concat(["SEND IF I LEAVE (1/0)", "NOTIFICATIONS (=)", "TEST NOTIF (=)"]);
    var SETTINGS_COUNT = SETTING_NAMES.length;

    function isTextSetting(i) { return i === 2 || i === 4 || i === 6 || i === 7; }
    function enterSettingsMode() {
      mode = MODE.SETTINGS; currentSettingIndex = 0; settingInputBuffer = ""; banner = "settings";
      showCurrentSetting();
    }
    function getCurrentSettingValue(i) {
      var n = pattern().notify || {};
      switch (i) {
        case 0: return String(Math.floor((n.delaySec || 15) * 1000 / 1000));
        case 1: return String((capOf("day") || { step: 1 }).step);
        case 2: return (capOf("day") || { op: "+" }).op;
        case 3: return String((capOf("month") || { step: 2 }).step);
        case 4: return (capOf("month") || { op: "×" }).op;
        case 5: return n.sendOnLeave === false ? "0" : "1";
        case 6: { var p = env.notifyPermission ? env.notifyPermission() : "unsupported";
          return p === "granted" ? "ALLOWED" : p === "denied" ? "BLOCKED" : p === "default" ? "ASK" : "N/A"; }
        case 7: return "TAP =";
        default: return "";
      }
    }
    function showCurrentSetting() {
      var cur = getCurrentSettingValue(currentSettingIndex);
      hist = SETTING_NAMES[currentSettingIndex];
      disp = settingInputBuffer === "" ? cur : settingInputBuffer;
    }
    function pressSettings(val) {
      if (val === "AC") { exitSettingsMode(); return; }
      if (isOperator(val)) {
        if (currentSettingIndex === 2 || currentSettingIndex === 4) {
          settingInputBuffer = normaliseOp(val); showCurrentSetting();
        }
        return;
      }
      if (val === "=") {
        applyCurrentSetting();
        settingInputBuffer = "";
        if (currentSettingIndex < SETTINGS_COUNT - 1) { currentSettingIndex++; showCurrentSetting(); }
        else { savePrefs(); exitSettingsMode(); }
        return;
      }
      if (val === "+/-") {
        if (!isTextSetting(currentSettingIndex)) {
          if (settingInputBuffer.charAt(0) === "-") settingInputBuffer = settingInputBuffer.substring(1);
          else if (settingInputBuffer !== "") settingInputBuffer = "-" + settingInputBuffer;
          showCurrentSetting();
        }
        return;
      }
      if (val === "%") {
        settingInputBuffer = "";
        if (currentSettingIndex < SETTINGS_COUNT - 1) { currentSettingIndex++; showCurrentSetting(); }
        else exitSettingsMode();
        return;
      }
      if (!isTextSetting(currentSettingIndex)) {
        if (val === ".") return;
        settingInputBuffer = (settingInputBuffer === "0" || settingInputBuffer === "") ? val : settingInputBuffer + val;
        showCurrentSetting();
      }
    }
    function javaParseInt(s) {
      return /^[+-]?\d+$/.test(s) ? parseInt(s, 10) : null;
    }
    function applyCurrentSetting() {
      var buf = settingInputBuffer.trim();
      var n = pattern().notify;
      // the two "action" settings act on `=` even with nothing typed
      if (extraSettings && currentSettingIndex === 6) { if (env.requestNotifications) env.requestNotifications(); return; }
      if (extraSettings && currentSettingIndex === 7) { if (env.testNotification) env.testNotification(); return; }
      if (buf === "") return;
      var i, dayCap = capOf("day"), monthCap = capOf("month");
      switch (currentSettingIndex) {
        case 0:
          i = javaParseInt(buf);
          if (i !== null && i >= 1 && i <= 3600) n.delaySec = i;
          break;
        case 1:
          i = javaParseInt(buf);
          if (i !== null && i >= 0 && i <= 9 && dayCap) dayCap.step = i;
          break;
        case 2: if (dayCap) dayCap.op = normaliseOp(buf); break;
        case 3:
          i = javaParseInt(buf);
          if (i !== null && i >= 0 && i <= 9 && monthCap) monthCap.step = i;
          break;
        case 4: if (monthCap) monthCap.op = normaliseOp(buf); break;
        case 5: if (buf === "0") n.sendOnLeave = false; else if (buf === "1") n.sendOnLeave = true; break;
      }
    }
    function exitSettingsMode() {
      mode = MODE.NORMAL; banner = "none"; acLabel = "AC"; refreshDisplay();
    }

    // ── FACEDOWN / injection ──
    function enterFacedownMode() {
      mode = MODE.FACEDOWN; facedownTaps = 0; env.vibrate && env.vibrate(80);
    }
    function handleFacedownTap() {
      env.vibrate && env.vibrate(30);
      facedownTaps++;
      if (facedownTaps >= 3) injectForce();
    }
    function injectForce() {
      if (forceNumber === null) { mode = MODE.NORMAL; return; }
      savedOpLog = opLog.slice();
      var current = parseDouble(currentVal), target = forceNumber, injected;
      if (operator !== null) {
        switch (operator) {
          case "+": injected = target - current; break;
          case "−": injected = current - target; break;
          case "×": injected = current === 0 ? 0 : target / current; break;
          case "÷": injected = target === 0 ? 0 : current / target; break;
          default: injected = target - current;
        }
      } else {
        injected = target; operator = "+"; previousVal = "0";
      }
      currentVal = formatResult(injected);
      mode = MODE.INJECTED;
      refreshDisplay();
    }
    function pressInjected(val) {
      if (val === "=") {
        var result = operator !== null ? calculate(previousVal, operator, currentVal) : currentVal;
        lastEquation = formatForHistory(previousVal) + " " + (operator !== null ? operator : "") + " " + currentVal + " =";
        currentVal = result; previousVal = ""; operator = null;
        justEvaluated = true; shouldResetDisplay = false; mode = MODE.NORMAL;
        opLog = savedOpLog.slice();
        tryCapture();
        opLog = [];
        refreshDisplay();
      }
    }

    // ── Recording: pattern captures -> banks -> record + notification ──
    function tryCapture() {
      var pat = pattern();
      var byBank = {};
      pat.captures.forEach(function (c) { (byBank[c.bank] = byBank[c.bank] || []).push(c); });
      Object.keys(byBank).forEach(function (bankId) {
        var bank = BANKS[bankId];
        if (!bank) return;
        var caps = byBank[bankId], i;
        // every capture needs its step to exist (all-or-nothing, as in the original)
        for (i = 0; i < caps.length; i++) if (opLog.length <= caps[i].step) return;
        var values = {};
        for (i = 0; i < caps.length; i++) {
          var parts = opLog[caps[i].step].split("|", 2);
          // split with limit 2 keeps only the first two pieces; the value never contains "|"
          if (parts.length < 2) return;
          if (canon(parts[0]) !== canon(caps[i].op)) return;
          var num = parseDoubleStrict(parts[1]);
          if (num === null) return;
          values[caps[i].field] = isNaN(num) ? 0 : (Math.round(num) | 0);
        }
        for (i = 0; i < bank.fields.length; i++) {
          var f = bank.fields[i], v = values[f.id];
          if (v === undefined || v < f.min || v > f.max) return;
        }
        var fields = {};
        Object.keys(values).forEach(function (k) { fields[k] = values[k]; });
        var derived = bank.derive(values);
        Object.keys(derived).forEach(function (k) { fields[k] = derived[k]; });
        var record = { bank: bankId, pattern: pat.id, ts: env.now ? env.now() : Date.now(), fields: fields };
        if (env.publish) env.publish(record);
        var n = pat.notify;
        if (n && n.enabled && n.bank === bankId) scheduleNotification(record, n);
      });
    }
    function scheduleNotification(record, n) {
      var payload = { title: fillTemplate(n.title, record.fields), text: fillTemplate(n.text, record.fields) };
      var entry = { sendOnLeave: n.sendOnLeave !== false, payload: payload, handle: null };
      entry.fire = function () {
        var idx = pending.indexOf(entry);
        if (idx < 0) return;
        pending.splice(idx, 1);
        if (entry.handle !== null && env.cancel) env.cancel(entry.handle);
        if (env.notify) env.notify(payload);
      };
      entry.handle = env.schedule ? env.schedule(entry.fire, n.delaySec * 1000) : null;
      pending.push(entry);
    }
    /** Called when the page is hidden/closed: timers freeze then, so send what is waiting now. */
    function flushOnLeave() {
      pending.slice().forEach(function (e) { if (e.sendOnLeave) e.fire(); });
    }

    // ── gestures (the page feeds raw taps in; the logic is the original's) ──
    function displayTap() {
      var now = env.now ? env.now() : Date.now();
      if (now - lastDisplayTapTime > 1500) displayTapCount = 0;
      lastDisplayTapTime = now;
      displayTapCount++;
      if (mode === MODE.FACEDOWN || mode === MODE.INJECTED) {
        handleFacedownTap();
      } else if (displayTapCount >= 5) {
        displayTapCount = 0;
        if (mode === MODE.FORCE_ENTRY) enterSettingsMode();
        else if (mode === MODE.SETTINGS) exitSettingsMode();
        else enterForceEntryMode();
      }
    }
    /** Returns true if the long-press did something (the page then swallows the click). */
    function displayLongPress() {
      if (mode === MODE.NORMAL && forceNumber !== null) { enterFacedownMode(); return true; }
      return false;
    }

    refreshDisplay();

    return {
      handleInput: handleInput,
      displayTap: displayTap,
      displayLongPress: displayLongPress,
      flushOnLeave: flushOnLeave,
      view: function () { return { display: disp, history: hist, banner: banner, ac: acLabel }; },
      state: function () {
        return { mode: mode, currentVal: currentVal, previousVal: previousVal, operator: operator,
          opLog: opLog.slice(), savedOpLog: savedOpLog.slice(), forceNumber: forceNumber,
          pending: pending.length, config: JSON.parse(JSON.stringify(cfg)) };
      }
    };
  }

  return {
    createCalc: createCalc, defaultConfig: defaultConfig, BANKS: BANKS,
    formatResult: formatResult, calculate: calculate, parseDouble: parseDouble,
    getStarSign: getStarSign, getCelebrity: getCelebrity, monthName: monthName,
    fillTemplate: fillTemplate
  };
});
