/*
 * Trick settings screen. Opened by 5 taps on the calculator display. Everything here edits the
 * same config the engine runs from, and every change is saved straight away.
 */
(function (root) {
  "use strict";

  var STYLE = [
    "#fcs{position:fixed;inset:0;z-index:50;background:#100E0D;color:#EEE3DF;overflow-y:auto;-webkit-overflow-scrolling:touch;",
    "font:400 15px/1.4 'Google Sans','Product Sans',Roboto,system-ui,sans-serif;-webkit-user-select:text;user-select:text;}",
    "#fcs *{box-sizing:border-box;}",
    "#fcs button{flex:none;width:auto;height:auto;border-radius:999px;transition:none;display:inline-block;}",
    "#fcs button:active{border-radius:999px;}",
    "#fcs .bar{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;padding:calc(10px + env(safe-area-inset-top)) 16px 10px;background:#100E0D;border-bottom:1px solid #2A2522;}",
    "#fcs .bar h1{font-size:19px;font-weight:500;margin:0;}",
    "#fcs .wrap{padding:12px 16px calc(40px + env(safe-area-inset-bottom));max-width:620px;margin:0 auto;}",
    "#fcs .card{background:#1B1816;border-radius:18px;padding:14px 14px 12px;margin:0 0 14px;}",
    "#fcs h2{font-size:12px;letter-spacing:.09em;text-transform:uppercase;color:#B2A9A6;margin:0 0 10px;font-weight:600;}",
    "#fcs .hint{font-size:13px;color:#B2A9A6;margin:6px 0 0;}",
    "#fcs .warn{font-size:13px;color:#FFB59B;margin:6px 0 0;}",
    "#fcs .ok{color:#9AD7A4;}",
    "#fcs label.f{display:block;font-size:13px;color:#B2A9A6;margin:10px 0 4px;}",
    "#fcs input[type=text],#fcs input[type=number],#fcs select,#fcs textarea{width:100%;padding:11px 12px;border-radius:12px;border:1px solid #3A322F;background:#2A2522;color:#EEE3DF;font:inherit;}",
    "#fcs textarea{min-height:120px;font:12px/1.35 ui-monospace,Menlo,monospace;}",
    "#fcs select{appearance:auto;}",
    "#fcs .btn{display:inline-block;border:0;border-radius:999px;padding:10px 16px;margin:6px 8px 0 0;font:inherit;font-size:14px;font-weight:500;background:#413A37;color:#EEE3DF;cursor:pointer;}",
    "#fcs .btn.main{background:#FFEBD5;color:#4A3720;} #fcs .btn.danger{background:#5A2A22;color:#FFD9CF;}",
    "#fcs .btn:active{filter:brightness(1.25);} #fcs .btn[disabled]{opacity:.4;}",
    "#fcs .two{display:flex;gap:10px;} #fcs .two>div{flex:1;min-width:0;}",
    "#fcs .row{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:6px 0;}",
    "#fcs .pat{display:flex;align-items:center;gap:8px;margin:6px 0;padding:8px;border-radius:14px;background:#241F1D;}",
    "#fcs .pat.active{outline:2px solid #FFEBD5;}",
    "#fcs .pat input[type=radio]{width:20px;height:20px;accent-color:#FFEBD5;flex:none;}",
    "#fcs .pat input[type=text]{flex:1;min-width:0;padding:8px 10px;}",
    "#fcs .pat .btn{margin:0;padding:8px 12px;font-size:13px;}",
    "#fcs .field{background:#241F1D;border-radius:14px;padding:10px;margin:8px 0;}",
    "#fcs .field b{font-weight:600;}",
    "#fcs .chips{display:flex;flex-wrap:wrap;gap:6px;margin:8px 0 2px;}",
    "#fcs .chip{border:0;border-radius:999px;padding:6px 10px;background:#2A2522;color:#EEE3DF;font:inherit;font-size:12.5px;cursor:pointer;}",
    "#fcs .chip small{color:#B2A9A6;margin-left:4px;}",
    "#fcs .preview{background:#0B0A09;border-radius:14px;padding:10px 12px;margin-top:10px;border:1px solid #2A2522;}",
    "#fcs .preview .t{font-weight:600;} #fcs .preview .s{color:#B2A9A6;font-size:13px;}",
    "#fcs .eq{font-family:ui-monospace,Menlo,monospace;font-size:15px;letter-spacing:.02em;margin-top:8px;}",
    "#fcs dl{margin:6px 0 0;display:grid;grid-template-columns:auto 1fr;gap:2px 12px;font-size:13px;} #fcs dt{color:#B2A9A6;} #fcs dd{margin:0;word-break:break-word;}",
    "#fcs .switch{position:relative;width:48px;height:28px;flex:none;} #fcs .switch input{opacity:0;width:100%;height:100%;position:absolute;margin:0;z-index:1;}",
    "#fcs .switch i{position:absolute;inset:0;border-radius:999px;background:#413A37;transition:.15s;} #fcs .switch i:after{content:'';position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#B2A9A6;transition:.15s;}",
    "#fcs .switch input:checked+i{background:#FFEBD5;} #fcs .switch input:checked+i:after{left:23px;background:#6D5433;}"
  ].join("");

  var OPS = [["+", "+"], ["−", "−"], ["×", "×"], ["÷", "÷"], ["any", "any operator"]];
  var FIELD_NOTES = { day: "day of the month", month: "month number" };

  function el(tag, props, kids) {
    var e = document.createElement(tag);
    if (props) Object.keys(props).forEach(function (k) {
      if (k === "text") e.textContent = props[k];
      else if (k === "html") e.innerHTML = props[k];
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), props[k]);
      else if (props[k] !== false && props[k] != null) e.setAttribute(k, props[k] === true ? "" : props[k]);
    });
    (kids || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return e;
  }
  function clampInt(v, lo, hi, dflt) {
    var n = parseInt(v, 10); if (isNaN(n)) return dflt; return Math.max(lo, Math.min(hi, n));
  }

  function open(api) {
    var FE = api.engine, BANKS = FE.BANKS;
    var cfg = api.calc.getConfig();
    var lastTemplateInput = null;
    var overlay = el("div", { id: "fcs" });
    var style = el("style", { text: STYLE });
    document.head.appendChild(style);
    document.body.appendChild(overlay);

    function pat() {
      for (var i = 0; i < cfg.patterns.length; i++) if (cfg.patterns[i].id === cfg.activePattern) return cfg.patterns[i];
      return cfg.patterns[0];
    }
    function commit() { api.calc.setConfig(cfg); }
    function rerender() { var y = overlay.scrollTop; build(); overlay.scrollTop = y; }
    function close() { overlay.remove(); style.remove(); api.onClose && api.onClose(); }
    function uid() { return "p" + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36); }
    function banksIn(p) {
      var seen = [], out = [];
      p.captures.forEach(function (c) { if (seen.indexOf(c.bank) < 0 && BANKS[c.bank]) { seen.push(c.bank); out.push(c.bank); } });
      return out;
    }
    function capFor(p, bankId, fieldId) {
      for (var i = 0; i < p.captures.length; i++) if (p.captures[i].bank === bankId && p.captures[i].field === fieldId) return p.captures[i];
      return null;
    }
    function sampleFields(bankId) {
      var b = BANKS[bankId], f = {};
      Object.keys(b.sample).forEach(function (k) { f[k] = b.sample[k]; });
      var d = b.derive(b.sample); Object.keys(d).forEach(function (k) { f[k] = d[k]; });
      return f;
    }

    // ---------- sections ----------
    function forceCard() {
      var inp = el("input", { type: "text", inputmode: "decimal", placeholder: "none set", value: cfg.forceNumber === null ? "" : String(cfg.forceNumber) });
      var msg = el("div", { class: "hint" });
      inp.addEventListener("change", function () {
        var t = inp.value.trim();
        if (t === "") { cfg.forceNumber = null; api.calc.setForceNumber(null); msg.textContent = "Force cleared."; return; }
        var n = FE.parseDoubleStrict(t);
        if (n === null || !isFinite(n)) { msg.className = "warn"; msg.textContent = "That isn’t a number."; return; }
        cfg.forceNumber = n; api.calc.setForceNumber(n); msg.className = "hint ok"; msg.textContent = "Saved. The force will land on " + FE.formatResult(n) + ".";
      });
      return el("div", { class: "card" }, [
        el("h2", { text: "Force number" }),
        el("label", { class: "f", text: "The number every forced answer lands on" }), inp, msg,
        el("div", { class: "hint", text: "Long-press the display (you feel a buzz), tap it 3 times, then press =. The last number is solved so the answer equals this." }),
        el("button", { class: "btn", text: "Clear force", onclick: function () { inp.value = ""; cfg.forceNumber = null; api.calc.setForceNumber(null); msg.className = "hint"; msg.textContent = "Force cleared."; } }),
        el("button", { class: "btn", text: "Enter it on the keypad instead", onclick: function () { commit(); api.calc.startKeypadForce(); close(); } })
      ]);
    }

    function patternsCard() {
      var card = el("div", { class: "card" }, [el("h2", { text: "Tricks (patterns)" }),
        el("div", { class: "hint", text: "Each pattern is a complete trick setup: which steps are recorded, and what is sent. Tap the circle to make one active." })]);
      cfg.patterns.forEach(function (p) {
        var radio = el("input", { type: "radio", name: "fcs-active", checked: p.id === cfg.activePattern, onchange: function () { cfg.activePattern = p.id; commit(); rerender(); } });
        var name = el("input", { type: "text", value: p.name, onchange: function (e) { p.name = e.target.value.trim() || "Untitled"; commit(); } });
        var copy = el("button", { class: "btn", text: "Copy", onclick: function () {
          var c = JSON.parse(JSON.stringify(p)); c.id = uid(); c.name = p.name + " copy"; cfg.patterns.push(c); cfg.activePattern = c.id; commit(); rerender(); } });
        var del = el("button", { class: "btn danger", text: "Delete", disabled: cfg.patterns.length < 2, onclick: function () {
          if (!confirm("Delete “" + p.name + "”?")) return;
          cfg.patterns = cfg.patterns.filter(function (x) { return x !== p; });
          if (cfg.activePattern === p.id) cfg.activePattern = cfg.patterns[0].id;
          commit(); rerender(); } });
        card.appendChild(el("div", { class: "pat" + (p.id === cfg.activePattern ? " active" : "") }, [radio, name, copy, del]));
      });
      card.appendChild(el("button", { class: "btn main", text: "+ New pattern (original birthday setup)", onclick: function () {
        var n = JSON.parse(JSON.stringify(FE.defaultConfig().patterns[0])); n.id = uid(); n.name = "Pattern " + (cfg.patterns.length + 1);
        cfg.patterns.push(n); cfg.activePattern = n.id; commit(); rerender(); } }));
      return card;
    }

    function stepsCard() {
      var p = pat();
      var card = el("div", { class: "card" }, [el("h2", { text: "Recording steps · " + p.name }),
        el("div", { class: "hint", text: "As the spectator works the sum, every “operator + number” is logged. Operation 1 is the first one finished (the 7 in 5 + 7 + …). Choose which operation records each piece of information." })]);
      var used = banksIn(p);
      used.forEach(function (bankId) {
        var b = BANKS[bankId];
        var box = el("div", { class: "field" }, [el("div", { class: "row" }, [el("b", { text: b.name + " bank" }),
          el("button", { class: "btn danger", style: "margin:0;padding:6px 12px;font-size:13px", text: "Remove", onclick: function () {
            p.captures = p.captures.filter(function (c) { return c.bank !== bankId; });
            if (p.notify && p.notify.bank === bankId) p.notify.bank = null;
            commit(); rerender(); } })])]);
        b.fields.forEach(function (f) {
          var cap = capFor(p, bankId, f.id);
          var stepIn = el("input", { type: "number", min: "1", max: "10", step: "1", value: String(cap.step + 1),
            onchange: function (e) { cap.step = clampInt(e.target.value, 1, 10, cap.step + 1) - 1; e.target.value = String(cap.step + 1); commit(); rerender(); } });
          var opSel = el("select", { onchange: function (e) { cap.op = e.target.value; commit(); rerender(); } },
            OPS.map(function (o) { return el("option", { value: o[0], text: o[1], selected: cap.op === o[0] }); }));
          box.appendChild(el("label", { class: "f", text: f.label + " (" + (FIELD_NOTES[f.id] || f.id) + ")" }));
          box.appendChild(el("div", { class: "two" }, [
            el("div", {}, [el("div", { class: "hint", style: "margin:0 0 3px", text: "Operation #" }), stepIn]),
            el("div", {}, [el("div", { class: "hint", style: "margin:0 0 3px", text: "Operator before it" }), opSel])]));
        });
        card.appendChild(box);
      });
      var addable = Object.keys(BANKS).filter(function (id) { return used.indexOf(id) < 0; });
      if (addable.length) {
        var sel = el("select", {}, addable.map(function (id) { return el("option", { value: id, text: BANKS[id].name }); }));
        card.appendChild(el("div", { class: "two", style: "margin-top:8px" }, [sel,
          el("div", {}, [el("button", { class: "btn", style: "margin:0", text: "+ Add bank", onclick: function () {
            var bank = BANKS[sel.value]; var next = p.captures.length ? Math.min(9, Math.max.apply(null, p.captures.map(function (c) { return c.step; })) + 1) : 1;
            bank.fields.forEach(function (f, i) { p.captures.push({ bank: bank.id, field: f.id, step: Math.min(9, next + i), op: "+" }); });
            commit(); rerender(); } })])]));
      }
      card.appendChild(equationPreview(p, used));
      return card;
    }

    function equationPreview(p, used) {
      var steps = {}, dupes = false, fieldsOnStep = {};
      p.captures.forEach(function (c) { if (BANKS[c.bank]) { if (steps[c.step] != null) dupes = true; steps[c.step] = c; (fieldsOnStep[c.step] = fieldsOnStep[c.step] || []).push(c); } });
      var maxStep = -1; Object.keys(steps).forEach(function (k) { maxStep = Math.max(maxStep, Number(k)); });
      var wrap = el("div", { class: "preview" });
      if (maxStep < 0) { wrap.appendChild(el("div", { class: "s", text: "Nothing is recorded by this pattern — it only forces." })); return wrap; }
      var tokens = ["5"], sample = {};
      used.forEach(function (id) { sample[id] = sampleFields(id); });
      for (var i = 0; i <= maxStep; i++) {
        var c = steps[i];
        if (c) { tokens.push(c.op === "any" ? "+" : c.op); tokens.push(String(sample[c.bank][c.field])); }
        else { tokens.push("+"); tokens.push("7"); }
      }
      wrap.appendChild(el("div", { class: "s", text: "Example that gets recorded:" }));
      wrap.appendChild(el("div", { class: "eq", text: tokens.join(" ") + " =" }));
      used.forEach(function (id) {
        var n = p.notify && p.notify.bank === id ? p.notify : null;
        if (n) wrap.appendChild(el("div", { class: "s", style: "margin-top:6px", text: "Sends: " + FE.fillTemplate(n.title, sample[id]) + " — " + FE.fillTemplate(n.text, sample[id]) }));
      });
      if (dupes) wrap.appendChild(el("div", { class: "warn", text: "Two items use the same operation number — only one can win, so move one of them." }));
      return wrap;
    }

    function notifyCard() {
      var p = pat(), n = p.notify = p.notify || { enabled: false, bank: null, delaySec: 15, sendOnLeave: true, title: "", text: "" };
      var used = banksIn(p);
      var card = el("div", { class: "card" }, [el("h2", { text: "Notification" })]);
      function toggle(checked, onchange) { return el("label", { class: "switch" }, [el("input", { type: "checkbox", checked: checked, onchange: onchange }), el("i")]); }
      card.appendChild(el("div", { class: "row" }, [el("div", {}, [el("b", { text: "Send a silent notification" }),
        el("div", { class: "hint", style: "margin:0", text: "Tells you what was recorded, on this phone (and a paired watch)." })]),
        toggle(n.enabled, function (e) { n.enabled = e.target.checked; commit(); rerender(); })]));
      if (!n.enabled) return card;
      if (!used.length) { card.appendChild(el("div", { class: "warn", text: "Add a bank to this pattern first — there is nothing to send." })); return card; }
      if (used.indexOf(n.bank) < 0) { n.bank = used[0]; commit(); }
      card.appendChild(el("label", { class: "f", text: "Send information from" }));
      card.appendChild(el("select", { onchange: function (e) { n.bank = e.target.value; commit(); rerender(); } },
        used.map(function (id) { return el("option", { value: id, text: BANKS[id].name + " bank", selected: id === n.bank }); })));
      card.appendChild(el("div", { class: "two" }, [
        el("div", {}, [el("label", { class: "f", text: "Delay (seconds)" }), el("input", { type: "number", min: "1", max: "3600", step: "1", value: String(n.delaySec),
          onchange: function (e) { n.delaySec = clampInt(e.target.value, 1, 3600, n.delaySec); e.target.value = String(n.delaySec); commit(); } })])]));
      card.appendChild(el("div", { class: "row", style: "margin-top:6px" }, [el("div", {}, [el("b", { text: "Send right away if I leave" }),
        el("div", { class: "hint", style: "margin:0", text: "If the screen locks or the app is left before the delay ends, send it immediately instead of losing it." })]),
        toggle(n.sendOnLeave !== false, function (e) { n.sendOnLeave = e.target.checked; commit(); })]));
      var sample = sampleFields(n.bank);
      var titleIn = el("input", { type: "text", value: n.title });
      var textIn = el("input", { type: "text", value: n.text });
      var prevT = el("div", { class: "t" }), prevS = el("div", { class: "s" });
      function paintPreview() { prevT.textContent = FE.fillTemplate(titleIn.value, sample) || "(empty title)"; prevS.textContent = FE.fillTemplate(textIn.value, sample); }
      [titleIn, textIn].forEach(function (inp, i) {
        inp.addEventListener("focus", function () { lastTemplateInput = inp; });
        inp.addEventListener("input", function () { paintPreview(); });
        inp.addEventListener("change", function () { n.title = titleIn.value; n.text = textIn.value; commit(); });
      });
      lastTemplateInput = lastTemplateInput && document.body.contains(lastTemplateInput) ? lastTemplateInput : titleIn;
      card.appendChild(el("label", { class: "f", text: "Notification title" })); card.appendChild(titleIn);
      card.appendChild(el("label", { class: "f", text: "Notification text" })); card.appendChild(textIn);
      card.appendChild(el("div", { class: "hint", text: "Tap a piece of information to add it at the cursor:" }));
      var chips = el("div", { class: "chips" });
      Object.keys(sample).forEach(function (k) {
        chips.appendChild(el("button", { class: "chip", type: "button", onclick: function () {
          var t = (lastTemplateInput && document.body.contains(lastTemplateInput)) ? lastTemplateInput : titleIn;
          var s = t.selectionStart == null ? t.value.length : t.selectionStart, e2 = t.selectionEnd == null ? s : t.selectionEnd;
          t.value = t.value.slice(0, s) + "{" + k + "}" + t.value.slice(e2); t.focus();
          t.setSelectionRange(s + k.length + 2, s + k.length + 2);
          n.title = titleIn.value; n.text = textIn.value; commit(); paintPreview(); } },
          [k, el("small", { text: String(sample[k]) })]));
      });
      card.appendChild(chips);
      card.appendChild(el("div", { class: "preview" }, [el("div", { class: "s", text: "Preview (sample birthday)" }), prevT, prevS]));
      paintPreview();
      var perm = api.permission(), status = el("div", { class: "hint" });
      if (perm === "granted") { status.className = "hint ok"; status.textContent = "Notifications are allowed."; }
      else if (perm === "denied") { status.className = "warn"; status.textContent = "Notifications are blocked for this site. Allow them in Chrome › Settings › Site settings › Notifications."; }
      else if (perm === "unsupported") { status.className = "warn"; status.textContent = "This browser can’t show notifications."; }
      else status.textContent = "Notifications haven’t been allowed yet.";
      card.appendChild(status);
      if (perm === "default") card.appendChild(el("button", { class: "btn main", text: "Allow notifications", onclick: function () { api.requestPermission(rerender); } }));
      card.appendChild(el("button", { class: "btn", text: "Send a test now", onclick: function () {
        api.testNotification().then(function (ok) { status.className = ok ? "hint ok" : "warn"; status.textContent = ok ? "Test sent — check your notifications." : "Couldn’t send — notifications aren’t allowed yet."; }); } }));
      return card;
    }

    function dataCard() {
      var card = el("div", { class: "card" }, [el("h2", { text: "Shared data (what other apps can read)" })]);
      var bus = api.readBus();
      var latest = {};
      bus.entries.forEach(function (e) { latest[e.bank] = e; });
      var keys = Object.keys(latest);
      if (!keys.length) card.appendChild(el("div", { class: "hint", text: "Nothing recorded yet. After a birthday is entered, it appears here and Notary can use it." }));
      keys.forEach(function (bank) {
        var e = latest[bank], mins = Math.max(0, Math.round((Date.now() - e.ts) / 60000));
        var dl = el("dl");
        Object.keys(e.fields).forEach(function (k) { dl.appendChild(el("dt", { text: k })); dl.appendChild(el("dd", { text: String(e.fields[k]) })); });
        card.appendChild(el("div", { class: "field" }, [el("b", { text: (BANKS[bank] ? BANKS[bank].name : bank) + " · " + (mins < 1 ? "just now" : mins + " min ago") }), dl]));
      });
      card.appendChild(el("button", { class: "btn", text: "Refresh", onclick: rerender }));
      card.appendChild(el("button", { class: "btn danger", text: "Clear shared data", onclick: function () { if (confirm("Clear everything this app has shared?")) { api.clearBus(); rerender(); } } }));
      return card;
    }

    function backupCard() {
      var ta = el("textarea", { spellcheck: "false", placeholder: "Settings JSON" });
      var msg = el("div", { class: "hint" });
      var card = el("div", { class: "card" }, [el("h2", { text: "Backup & reset" }),
        el("div", { class: "hint", text: "Export your patterns as text to keep or move to another phone; paste text here and Apply to restore." }), ta, msg]);
      card.appendChild(el("button", { class: "btn", text: "Export", onclick: function () {
        ta.value = JSON.stringify(cfg, null, 1);
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(ta.value).then(function () { msg.textContent = "Copied to the clipboard."; }, function () { msg.textContent = "Select and copy the text above."; });
        else msg.textContent = "Select and copy the text above."; } }));
      card.appendChild(el("button", { class: "btn main", text: "Apply pasted settings", onclick: function () {
        var c; try { c = JSON.parse(ta.value); } catch (e) { msg.className = "warn"; msg.textContent = "That isn’t valid settings text."; return; }
        if (!api.calc.setConfig(c)) { msg.className = "warn"; msg.textContent = "That doesn’t look like ForceCalc settings."; return; }
        cfg = api.calc.getConfig(); rerender(); } }));
      card.appendChild(el("button", { class: "btn danger", text: "Reset everything to the original", onclick: function () {
        if (!confirm("Reset all patterns and the force number?")) return;
        api.calc.setConfig(FE.defaultConfig()); cfg = api.calc.getConfig(); rerender(); } }));
      return card;
    }

    function build() {
      overlay.innerHTML = "";
      overlay.appendChild(el("div", { class: "bar" }, [el("h1", { text: "Trick settings" }),
        el("button", { class: "btn main", style: "margin:0", text: "Done", onclick: close })]));
      overlay.appendChild(el("div", { class: "wrap" }, [forceCard(), patternsCard(), stepsCard(), notifyCard(), dataCard(), backupCard(),
        el("div", { class: "hint", style: "text-align:center;margin-top:6px", text: "Changes save as you make them." })]));
    }
    build();
  }

  root.FCSettings = { open: open };
})(typeof self !== "undefined" ? self : this);
