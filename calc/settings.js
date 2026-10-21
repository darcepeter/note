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
    "#fcs .navbtn{display:flex;align-items:center;gap:8px;background:#004499;color:#fff;border:0;border-radius:999px;padding:9px 16px;font:inherit;font-size:15px;font-weight:600;letter-spacing:.04em;cursor:pointer;}",
    "#fcs .navbtn i{font-style:normal;transition:transform .15s;} #fcs .navbtn.open i{transform:rotate(180deg);}",
    "#fcs .navmenu{display:none;position:absolute;left:12px;top:100%;margin-top:6px;min-width:260px;background:#1F1B19;border-radius:18px;padding:8px;box-shadow:0 8px 28px #000c;border:1px solid #3A322F;}",
    "#fcs .navmenu.open{display:block;} #fcs .navmenu div{padding:12px 14px;border-radius:12px;cursor:pointer;font-size:15px;} #fcs .navmenu div:active{background:#2F2926;}",
    "#fcs .navmenu small{display:block;color:#B2A9A6;font-size:12px;margin-top:1px;}",
    "#fcs .slot{display:grid;grid-template-columns:30px 76px 1fr 34px;gap:8px;align-items:center;margin:6px 0;}",
    "#fcs .slot .n{color:#B2A9A6;font-size:13px;text-align:center;} #fcs .slot select{padding:9px 8px;}",
    "#fcs .slot .x{width:34px;height:34px;padding:0;background:#2A2522;color:#EEE3DF;border:0;font-size:18px;}",
    "#fcs .slot.force select,#fcs .slot.force .rolebox{border-color:#7A5A2F;}",
    "#fcs .rolebox{padding:9px 10px;border-radius:12px;border:1px dashed #7A5A2F;color:#FFEBD5;font-size:14px;}",
    "#fcs .eqbig{background:#0B0A09;border:1px solid #2A2522;border-radius:14px;padding:12px;margin:2px 0 8px;line-height:2.1;font-size:15px;}",
    "#fcs .tk{display:inline-block;padding:2px 9px;border-radius:999px;background:#2A2522;margin:0 2px;font-weight:600;} #fcs .tk.rec{background:#17375E;color:#CFE3FF;} #fcs .tk.force{background:#FFEBD5;color:#4A3720;}",
    "#fcs .op{display:inline-block;margin:0 4px;color:#B2A9A6;font-weight:600;}",
    "#fcs .bk{background:#241F1D;border-radius:14px;padding:10px;margin:8px 0;} #fcs .bk .top{display:flex;align-items:center;gap:8px;} #fcs .bk .top b{flex:1;min-width:0;}",
    "#fcs .tag{font-size:11.5px;background:#2A2522;border-radius:999px;padding:3px 9px;color:#FFEBD5;} #fcs .bk .btn{margin:0;padding:7px 12px;font-size:13px;}",
    "#fcs .frow{display:grid;grid-template-columns:1fr 62px 62px 52px 34px;gap:6px;margin:5px 0;align-items:center;} #fcs .frow input{padding:8px 8px;}",
    "#fcs .fhead{display:grid;grid-template-columns:1fr 62px 62px 52px 34px;gap:6px;font-size:11px;color:#B2A9A6;}",
    "#fcs .lrow{display:flex;gap:6px;margin:4px 0;align-items:center;} #fcs .lrow input{padding:8px;flex:1;min-width:0;} #fcs .lrow .k{flex:0 0 84px;}",
    "#fcs .tbl{max-height:320px;overflow-y:auto;margin-top:6px;border-radius:12px;background:#1B1816;padding:6px;}",
    "#fcs .switch{position:relative;width:48px;height:28px;flex:none;} #fcs .switch input{opacity:0;width:100%;height:100%;position:absolute;margin:0;z-index:1;}",
    "#fcs .switch i{position:absolute;inset:0;border-radius:999px;background:#413A37;transition:.15s;} #fcs .switch i:after{content:'';position:absolute;left:3px;top:3px;width:22px;height:22px;border-radius:50%;background:#B2A9A6;transition:.15s;}",
    "#fcs .switch input:checked+i{background:#FFEBD5;} #fcs .switch input:checked+i:after{left:23px;background:#6D5433;}"
  ].join("");

  var OPS = [["+", "+"], ["−", "−"], ["×", "×"], ["÷", "÷"]];

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
    var FE = api.engine, BANKS = {};
    var cfg = api.calc.getConfig();
    if (!Array.isArray(cfg.banks)) cfg.banks = [];
    BANKS = FE.resolveBanks(cfg);
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
    function sampleFields(bankId) {
      var b = BANKS[bankId], f = {};
      Object.keys(b.sample).forEach(function (k) { f[k] = b.sample[k]; });
      var d = b.derive(b.sample) || {}; Object.keys(d).forEach(function (k) { f[k] = d[k]; });
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

    // ---- banks & lookup tables ----
    var editingBank = null, tableOpen = false, openBuiltin = null;
    function slug(s, taken) {
      var base = String(s || "field").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "field", id = base, n = 2;
      while (taken.indexOf(id) >= 0) id = base + "_" + (n++);
      return id;
    }
    function bankUses(id) { return cfg.patterns.filter(function (p) { return p.captures.some(function (c) { return c.bank === id; }); }); }
    var TAGS = ["number", "pin code", "zip code", "house number", "phone number", "age", "year", "lucky number", "card", "area code", "birthday"];
    function newBank(kind) {
      var id = "b" + Date.now().toString(36), b;
      if (kind === "pin") b = { id: id, name: "PIN code", tag: "pin code", fields: [{ id: "pin", label: "PIN", min: 0, max: 9999, pad: 4 }] };
      else if (kind === "stack") b = { id: id, name: "My stack", tag: "card", kind: "stack", fields: [{ id: "position", label: "Position", min: 1, max: 52, pad: 0 }],
        lookup: { keyField: "position", columns: [{ id: "card", label: "Card" }], rows: [], onMissing: "skip" } };
      else if (kind === "house") b = { id: id, name: "House number", tag: "house number", fields: [{ id: "number", label: "Number", min: 1, max: null, pad: 0 }] };
      else if (kind === "table") b = { id: id, name: "Lookup table", tag: "number", fields: [{ id: "number", label: "Number", min: 1, max: null, pad: 0 }],
        lookup: { keyField: "number", columns: [{ id: "word", label: "Word" }], rows: [], onMissing: "blank" } };
      else b = { id: id, name: "New bank", tag: "number", fields: [{ id: "number", label: "Number", min: null, max: null, pad: 0 }] };
      cfg.banks.push(b); editingBank = id; tableOpen = !!b.lookup; commit(); rerender();
    }
    function numOrNull(v) { v = String(v).trim(); if (v === "") return null; var n = Number(v); return isNaN(n) ? null : n; }
    function banksCard() {
      var card = el("div", { class: "card" }, [el("h2", { text: "Banks & lookup tables" }),
        el("div", { class: "hint", style: "margin:0 0 6px", text: "A bank is a kind of information the calculator can record from the sum (a birthday, a PIN, a zip code…). Give it a tag so other apps know what it is, and optionally a lookup table that turns each recorded number into extra text (a word, a city, a name). Anything you make here shows up in the equation builder, and Notary finds it on its own." })]);
      // built-in
      Object.keys(BANKS).forEach(function (id) {
        var b = BANKS[id]; if (!b.builtin) return;
        var open = openBuiltin === id, box = el("div", { class: "bk" });
        var missing = b.dataset && !(root.FCData && typeof root.FCData[b.dataset] === "string");
        box.appendChild(el("div", { class: "top" }, [el("b", { text: b.name }), el("span", { class: "tag", text: b.tag }), el("span", { class: "hint", style: "margin:0", text: "built in" }),
          el("button", { class: "btn", text: open ? "Close" : "Details", onclick: function () { openBuiltin = open ? null : id; rerender(); } })]));
        if (missing) box.appendChild(el("div", { class: "warn", text: "The data file for this bank didn’t load, so it can’t record yet. Reload the calculator while online." }));
        if (open) {
          if (b.about) box.appendChild(el("div", { class: "hint", text: b.about }));
          box.appendChild(el("div", { class: "hint", style: "margin-top:8px", text: "Numbers it takes: " + b.fields.map(function (f) { return f.label + (f.min != null && f.max != null ? " (" + f.min + "–" + f.max + ")" : ""); }).join(", ") }));
          box.appendChild(el("div", { class: "hint", style: "margin-top:6px", text: "Information it gives back (" + b.derivedDefs.length + "):" }));
          box.appendChild(el("div", { class: "chips" }, b.derivedDefs.map(function (x) { return el("span", { class: "chip", text: x[1] }); })));
        }
        card.appendChild(box);
      });
      cfg.banks.forEach(function (d) {
        var open = editingBank === d.id;
        var box = el("div", { class: "bk" });
        box.appendChild(el("div", { class: "top" }, [el("b", { text: d.name }), el("span", { class: "tag", text: d.tag || "number" }),
          el("button", { class: "btn", text: open ? "Close" : "Edit", onclick: function () { editingBank = open ? null : d.id; rerender(); } })]));
        if (open) box.appendChild(bankEditor(d));
        card.appendChild(box);
      });
      card.appendChild(el("div", { class: "hint", style: "margin-top:10px", text: "New bank:" }));
      [["stack", "My own stack"], ["pin", "PIN code"], ["house", "House number"], ["table", "Lookup table"], ["blank", "Blank"]].forEach(function (x) {
        card.appendChild(el("button", { class: "btn", text: "+ " + x[1], onclick: function () { newBank(x[0]); } }));
      });
      return card;
    }
    function bankEditor(d) {
      var wrap = el("div", { style: "margin-top:8px" });
      wrap.appendChild(el("label", { class: "f", text: "Name" }));
      wrap.appendChild(el("input", { type: "text", value: d.name, onchange: function (e) { d.name = e.target.value.trim() || "Untitled bank"; commit(); rerender(); } }));
      wrap.appendChild(el("label", { class: "f", text: "Tag (what kind of information this is — Notary can tell them apart)" }));
      var dl = el("datalist", { id: "fcs-tags" }, TAGS.map(function (x) { return el("option", { value: x }); }));
      wrap.appendChild(el("input", { type: "text", list: "fcs-tags", value: d.tag || "", placeholder: "pin code, zip code, …", onchange: function (e) { d.tag = e.target.value.trim(); commit(); } }));
      wrap.appendChild(dl);
      // fields
      wrap.appendChild(el("label", { class: "f", text: "Fields recorded (each one takes a number from the sum)" }));
      wrap.appendChild(el("div", { class: "fhead" }, [el("span", { text: "Name" }), el("span", { text: "Min" }), el("span", { text: "Max" }), el("span", { text: "Digits" }), el("span")]));
      d.fields.forEach(function (f, i) {
        wrap.appendChild(el("div", { class: "frow" }, [
          el("input", { type: "text", value: f.label, onchange: function (e) { f.label = e.target.value.trim() || f.id; commit(); rerender(); } }),
          el("input", { type: "number", inputmode: "numeric", value: f.min == null ? "" : String(f.min), placeholder: "—", onchange: function (e) { f.min = numOrNull(e.target.value); commit(); } }),
          el("input", { type: "number", inputmode: "numeric", value: f.max == null ? "" : String(f.max), placeholder: "—", onchange: function (e) { f.max = numOrNull(e.target.value); commit(); } }),
          el("input", { type: "number", inputmode: "numeric", min: "0", max: "12", value: f.pad ? String(f.pad) : "", placeholder: "—", onchange: function (e) { f.pad = Math.max(0, Math.min(12, parseInt(e.target.value, 10) || 0)); commit(); rerender(); } }),
          el("button", { class: "x", style: "width:34px;height:34px;padding:0;background:#2A2522;color:#EEE3DF;border:0;font-size:18px", text: "×", disabled: d.fields.length < 2, onclick: function () {
            if (bankUses(d.id).length && !confirm("This bank is used in an equation. Removing a field stops that recording until you set it up again. Remove it?")) return;
            d.fields.splice(i, 1); if (d.lookup && d.lookup.keyField === f.id) d.lookup.keyField = d.fields[0].id;
            cfg.patterns.forEach(function (p) { p.captures = p.captures.filter(function (c) { return !(c.bank === d.id && c.field === f.id); }); (p.slots || []).forEach(function (sl) { if (sl.role === d.id + "." + f.id) sl.role = "free"; }); });
            commit(); rerender(); } })]));
      });
      wrap.appendChild(el("div", { class: "hint", text: "“Digits” pads with zeros (a PIN of 427 becomes 0427). Leave Min/Max empty for no limit." }));
      wrap.appendChild(el("button", { class: "btn", style: "margin-top:6px", text: "+ Add a field", disabled: d.fields.length >= 6, onclick: function () {
        var ids = d.fields.map(function (x) { return x.id; }); d.fields.push({ id: slug("value", ids), label: "Value " + (d.fields.length + 1), min: null, max: null, pad: 0 }); commit(); rerender(); } }));
      // lookup table
      var lk = d.lookup;
      wrap.appendChild(el("div", { class: "row", style: "margin-top:12px" }, [el("div", {}, [el("b", { text: "Lookup table" }),
        el("div", { class: "hint", style: "margin:0", text: "Turns each recorded number into extra text." })]),
        el("label", { class: "switch" }, [el("input", { type: "checkbox", checked: !!lk, onchange: function (e) {
          if (e.target.checked) d.lookup = d.lookup || { keyField: d.fields[0].id, columns: [{ id: "word", label: "Word" }], rows: [], onMissing: "blank" };
          else if (!(d.lookup.rows || []).length || confirm("Turn off the lookup table? Its rows will be deleted.")) { delete d.lookup; }
          else { e.target.checked = true; return; }
          commit(); rerender(); } }), el("i")])]));
      if (lk) wrap.appendChild(lookupEditor(d, lk));
      wrap.appendChild(el("button", { class: "btn danger", style: "margin-top:12px", text: "Delete this bank", onclick: function () {
        var uses = bankUses(d.id);
        if (!confirm("Delete “" + d.name + "”?" + (uses.length ? " It is used in " + uses.length + " pattern(s); those recordings will stop." : ""))) return;
        cfg.banks = cfg.banks.filter(function (x) { return x !== d; });
        cfg.patterns.forEach(function (p) {
          p.captures = p.captures.filter(function (c) { return c.bank !== d.id; });
          (p.slots || []).forEach(function (sl) { if (sl.role.indexOf(d.id + ".") === 0) sl.role = "free"; });
          if (p.notify && p.notify.bank === d.id) p.notify.bank = null;
        });
        editingBank = null; commit(); rerender(); } }));
      return wrap;
    }
    function lookupEditor(d, lk) {
      var w = el("div");
      if (d.fields.length > 1) {
        w.appendChild(el("label", { class: "f", text: "Look up by this field" }));
        w.appendChild(el("select", { onchange: function (e) { lk.keyField = e.target.value; commit(); } },
          d.fields.map(function (f) { return el("option", { value: f.id, text: f.label, selected: lk.keyField === f.id }); })));
      }
      w.appendChild(el("label", { class: "f", text: "Columns (the extra text you get back)" }));
      lk.columns.forEach(function (c, i) {
        w.appendChild(el("div", { class: "lrow" }, [el("input", { type: "text", value: c.label, onchange: function (e) { c.label = e.target.value.trim() || c.id; commit(); rerender(); } }),
          el("button", { class: "x", style: "flex:none;width:34px;height:34px;padding:0;background:#2A2522;color:#EEE3DF;border:0;font-size:18px", text: "×", disabled: lk.columns.length < 2, onclick: function () {
            lk.columns.splice(i, 1); lk.rows.forEach(function (r) { delete r.values[c.id]; }); commit(); rerender(); } })]));
      });
      w.appendChild(el("button", { class: "btn", text: "+ Add a column", disabled: lk.columns.length >= 6, onclick: function () {
        var ids = lk.columns.map(function (x) { return x.id; }); lk.columns.push({ id: slug("column", ids), label: "Column " + (lk.columns.length + 1) }); commit(); rerender(); } }));
      w.appendChild(el("label", { class: "f", text: "If a recorded number isn’t in the table" }));
      w.appendChild(el("select", { onchange: function (e) { lk.onMissing = e.target.value; commit(); } }, [
        el("option", { value: "blank", text: "Record it anyway (extra text left empty)", selected: lk.onMissing !== "skip" }),
        el("option", { value: "skip", text: "Don’t record it at all", selected: lk.onMissing === "skip" })]));
      // rows
      var keyLabel = (d.fields.filter(function (f) { return f.id === lk.keyField; })[0] || d.fields[0]).label;
      w.appendChild(el("div", { class: "hint", style: "margin-top:10px", text: lk.rows.length + " row" + (lk.rows.length === 1 ? "" : "s") + " · first column is the " + keyLabel + " that is looked up" }));
      var tbl = el("div", { class: "tbl" });
      var head = el("div", { class: "lrow", style: "color:#B2A9A6;font-size:11px" }, [el("span", { class: "k", text: keyLabel })]);
      lk.columns.forEach(function (c) { head.appendChild(el("span", { style: "flex:1", text: c.label })); });
      head.appendChild(el("span", { style: "flex:none;width:34px" }));
      tbl.appendChild(head);
      lk.rows.forEach(function (r, ri) {
        var row = el("div", { class: "lrow" }, [el("input", { class: "k", type: "text", inputmode: "numeric", value: String(r.key), onchange: function (e) { r.key = e.target.value.trim(); commit(); } })]);
        lk.columns.forEach(function (c) { row.appendChild(el("input", { type: "text", value: (r.values && r.values[c.id]) || "", onchange: function (e) { r.values = r.values || {}; r.values[c.id] = e.target.value; commit(); } })); });
        row.appendChild(el("button", { style: "flex:none;width:34px;height:34px;padding:0;background:#2A2522;color:#EEE3DF;border:0;font-size:16px", text: "×", onclick: function () { lk.rows.splice(ri, 1); commit(); rerender(); } }));
        tbl.appendChild(row);
      });
      w.appendChild(tbl);
      w.appendChild(el("button", { class: "btn", text: "+ Add a row", onclick: function () { lk.rows.push({ key: "", values: {} }); commit(); rerender(); } }));
      // paste a whole stack in order
      if (d.kind === "stack") {
        var sta = el("textarea", { placeholder: "Paste your whole stack in order, top card first. Any separators work:\n4C 2H 7D 3C 4H 6D AS … (or Four of Clubs, one per line)", style: "min-height:90px;margin-top:8px" });
        var smsg = el("div", { class: "hint" });
        w.appendChild(el("b", { text: "Paste a whole stack", style: "display:block;margin-top:12px" }));
        w.appendChild(sta);
        w.appendChild(el("button", { class: "btn main", text: "Replace stack with this", onclick: function () {
          var parts = sta.value.split(/\r?\n|,|;|\s+(?=[2-9AJQK1])/).map(function (x) { return x.trim(); }).filter(Boolean);
          if (parts.length === 1) parts = parts[0].split(/\s+/);
          var cards = [], badAt = -1;
          parts.forEach(function (x, i) { var c = FE.parseCard(x); if (!c && badAt < 0) badAt = i; cards.push(c); });
          if (badAt >= 0) { smsg.className = "warn"; smsg.textContent = "Couldn’t read “" + parts[badAt] + "” (item " + (badAt + 1) + "). Use codes like 4C, 10H, AS or names like Four of Clubs."; return; }
          var names = {}; cards.forEach(function (c) { names[c.code] = (names[c.code] || 0) + 1; });
          var dup = Object.keys(names).filter(function (k) { return names[k] > 1; });
          if (!cards.length) { smsg.className = "warn"; smsg.textContent = "Nothing to import."; return; }
          lk.rows = cards.map(function (c, i) { return { key: String(i + 1), values: { card: c.name } }; });
          d.fields[0].min = 1; d.fields[0].max = cards.length;
          commit(); smsg.className = "hint ok"; smsg.textContent = cards.length + " cards set." + (cards.length !== 52 ? " (That isn’t 52.)" : "") + (dup.length ? " Repeated: " + dup.join(", ") + "." : ""); sta.value = ""; rerender(); } }));
        w.appendChild(smsg);
      }
      // bulk paste
      var ta = el("textarea", { placeholder: "Paste rows — one per line, columns separated by a comma or tab:\n37403, Chattanooga\n90210, Beverly Hills", style: "min-height:90px;margin-top:8px" });
      var msg = el("div", { class: "hint" });
      w.appendChild(ta);
      w.appendChild(el("button", { class: "btn", text: "Add pasted rows", onclick: function () {
        var added = 0, replaced = 0;
        ta.value.split(/\r?\n/).forEach(function (line) {
          if (!line.trim()) return;
          var cells = line.split(/\t|,/).map(function (s) { return s.trim(); });
          var key = cells.shift(); if (key === "") return;
          var values = {}; lk.columns.forEach(function (c, i) { values[c.id] = cells[i] || ""; });
          var existing = lk.rows.filter(function (r) { return String(r.key) === key; })[0];
          if (existing) { existing.values = values; replaced++; } else { lk.rows.push({ key: key, values: values }); added++; }
        });
        commit(); msg.className = "hint ok"; msg.textContent = added + " added" + (replaced ? ", " + replaced + " updated" : "") + "."; ta.value = ""; rerender(); } }));
      w.appendChild(msg);
      return w;
    }

    // ---- the equation builder: the whole sum, number by number ----
    var ANY = "free";
    function roleList() {
      var out = [[ANY, "Any number (spectator’s choice)"]];
      Object.keys(BANKS).forEach(function (id) { BANKS[id].fields.forEach(function (f) { out.push([id + "." + f.id, BANKS[id].name + " · " + f.label]); }); });
      return out;
    }
    function posOf(c) { return typeof c.pos === "number" ? c.pos : c.step + 1; }
    function slotsOf(p) {
      if (Array.isArray(p.slots) && p.slots.length >= 2) return p.slots;
      var n = 2;
      p.captures.forEach(function (c) { n = Math.max(n, posOf(c) + 1); });
      n = Math.min(8, n);
      var slots = [];
      for (var i = 0; i < n; i++) slots.push({ role: ANY, op: "+" });
      p.captures.forEach(function (c) { var i2 = posOf(c); if (i2 < slots.length) slots[i2] = { role: c.bank + "." + c.field, op: c.op === "any" ? "+" : c.op }; });
      p.slots = slots; if (!p.forceOp) p.forceOp = "+";
      return slots;
    }
    function syncCaptures(p) {
      p.captures = [];
      p.slots.forEach(function (sl, i) {
        if (sl.role === ANY) return;
        var parts = sl.role.split(".");
        if (!BANKS[parts[0]]) return;
        p.captures.push({ bank: parts[0], field: parts[1], pos: i, step: Math.max(0, i - 1), op: i === 0 ? "any" : sl.op });
      });
      if (p.notify && p.notify.bank && banksIn(p).indexOf(p.notify.bank) < 0) p.notify.bank = banksIn(p)[0] || null;
      commit();
    }
    function evalPlain(str) { try { return Function("return (" + str + ")")(); } catch (e) { return NaN; } }

    function equationCard() {
      var p = pat(), slots = slotsOf(p), roles = roleList();
      var card = el("div", { class: "card" }, [el("h2", { text: "Equation & recording · " + p.name }),
        el("div", { class: "hint", style: "margin:0 0 8px", text: "This is the whole sum, in the order it is typed. Blue numbers are recorded; the gold one is the number you force. Everything shows at once — change any row." })]);

      // the big picture
      var forceTxt = cfg.forceNumber === null ? "force number" : FE.formatResult(cfg.forceNumber);
      var big = el("div", { class: "eqbig" });
      slots.forEach(function (sl, i) {
        if (i > 0) big.appendChild(el("span", { class: "op", text: sl.op }));
        var rec = sl.role !== ANY, label = "any";
        if (rec) { var rr = roles.filter(function (r) { return r[0] === sl.role; })[0]; label = rr ? rr[1].split(" · ")[1] : "?"; }
        big.appendChild(el("span", { class: "tk" + (rec ? " rec" : ""), text: label }));
      });
      big.appendChild(el("span", { class: "op", text: p.forceOp || "+" }));
      big.appendChild(el("span", { class: "tk force", text: "force" }));
      big.appendChild(el("span", { class: "op", text: "=" }));
      big.appendChild(el("span", { class: "tk force", text: forceTxt }));
      card.appendChild(big);

      // number example, with real values
      var sample = {}, free = [7, 3, 5, 9, 4, 6, 2, 8], fi = 0, parts = [];
      Object.keys(BANKS).forEach(function (id) { sample[id] = sampleFields(id); });
      slots.forEach(function (sl, i) {
        var v;
        if (sl.role === ANY) v = free[fi++ % free.length];
        else { var q = sl.role.split("."); v = sample[q[0]] ? sample[q[0]][q[1]] : 0; }
        if (i > 0) parts.push(sl.op);
        parts.push(String(v));
      });
      var fop = p.forceOp || "+", rest = evalPlain(parts.join(" ").replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-"));
      var ex = parts.join(" ") + " " + fop + " ";
      if (cfg.forceNumber !== null && (fop === "+" || fop === "−") && isFinite(rest)) {
        var solved = fop === "+" ? cfg.forceNumber - rest : rest - cfg.forceNumber;
        ex += FE.formatResult(solved) + " = " + FE.formatResult(cfg.forceNumber);
      } else ex += "(forced) = " + forceTxt;
      card.appendChild(el("div", { class: "hint", style: "margin:0 0 10px", text: "Example: " + ex }));

      // one-tap layouts
      function layout(list) { p.slots = list; syncCaptures(p); rerender(); }
      card.appendChild(el("div", { class: "hint", style: "margin:0 0 2px", text: "Quick layouts:" }));
      card.appendChild(el("button", { class: "btn", text: "Day × Month first", onclick: function () {
        layout([{ role: "birthday.day", op: "+" }, { role: "birthday.month", op: "×" }, { role: ANY, op: "+" }]); } }));
      card.appendChild(el("button", { class: "btn", text: "Original (2 numbers, then Day + Month ×)", onclick: function () {
        layout([{ role: ANY, op: "+" }, { role: ANY, op: "+" }, { role: "birthday.day", op: "+" }, { role: "birthday.month", op: "×" }]); } }));

      // the rows
      slots.forEach(function (sl, i) {
        var opSel = el("select", { disabled: i === 0, onchange: function (e) { sl.op = e.target.value; syncCaptures(p); rerender(); } },
          OPS.map(function (o) { return el("option", { value: o[0], text: o[1], selected: sl.op === o[0] }); }));
        if (i === 0) opSel.appendChild(el("option", { text: "—", selected: true }));
        var roleSel = el("select", { onchange: function (e) { sl.role = e.target.value; syncCaptures(p); rerender(); } },
          roles.map(function (r) { return el("option", { value: r[0], text: r[1], selected: sl.role === r[0] }); }));
        var rm = el("button", { class: "x", text: "×", disabled: slots.length <= 2, "aria-label": "Remove this number", onclick: function () {
          slots.splice(i, 1); syncCaptures(p); rerender(); } });
        card.appendChild(el("div", { class: "slot" }, [el("div", { class: "n", text: String(i + 1) }), opSel, roleSel, rm]));
      });
      var fopSel = el("select", { onchange: function (e) { p.forceOp = e.target.value; commit(); rerender(); } },
        OPS.map(function (o) { return el("option", { value: o[0], text: o[1], selected: fop === o[0] }); }));
      card.appendChild(el("div", { class: "slot force" }, [el("div", { class: "n", text: "★" }), fopSel,
        el("div", { class: "rolebox", text: "Forced number (solved for you)" }), el("div")]));
      card.appendChild(el("button", { class: "btn", text: "+ Add a number", disabled: slots.length >= 8, onclick: function () {
        slots.push({ role: ANY, op: "+" }); syncCaptures(p); rerender(); } }));

      // checks
      var used = {}, dupes = false, missing = [];
      slots.forEach(function (sl) { if (sl.role !== ANY) { if (used[sl.role]) dupes = true; used[sl.role] = true; } });
      Object.keys(BANKS).forEach(function (id) {
        var some = BANKS[id].fields.some(function (f) { return used[id + "." + f.id]; });
        var all = BANKS[id].fields.every(function (f) { return used[id + "." + f.id]; });
        if (some && !all) missing.push(BANKS[id].name);
      });
      if (dupes) card.appendChild(el("div", { class: "warn", text: "Two rows record the same thing — only one can win. Change one of them." }));
      missing.forEach(function (n) { card.appendChild(el("div", { class: "warn", text: n + " needs all of its fields recorded, or nothing is saved." })); });
      card.appendChild(el("div", { class: "hint", text: "The operator column is what has to be pressed before that number for it to count. The “forced number” operator is only for this preview — whatever is pressed, the last number is solved so the total lands on the force number." }));
      // what happened the last time "=" was pressed: the quickest way to see why something was or wasn't recorded
      var le = api.readLastEval ? api.readLastEval() : null;
      var dbg = el("div", { class: "preview" }, [el("div", { class: "s", text: "Last equation worked out" })]);
      if (!le) dbg.appendChild(el("div", { class: "s", text: "Nothing yet — press = on the calculator, then come back here." }));
      else {
        dbg.appendChild(el("div", { class: "eq", text: le.expr + " = " + le.result }));
        dbg.appendChild(el("div", { class: "s", style: "margin-top:6px", text: "Numbers as typed (operator before each): " + (le.numbers || []).map(function (x, i) { return (i + 1) + ") " + x.trim(); }).join("   ") }));
        (le.notes || []).forEach(function (n) { dbg.appendChild(el("div", { class: /^Recorded/.test(n) ? "ok" : "warn", style: "font-size:13px;margin-top:4px", text: n })); });
      }
      card.appendChild(dbg);
      var used2 = banksIn(p);
      used2.forEach(function (id) {
        var n = p.notify && p.notify.bank === id ? p.notify : null;
        if (n) card.appendChild(el("div", { class: "hint", text: "Sends: " + FE.fillTemplate(n.title, sample[id]) + " — " + FE.fillTemplate(n.text, sample[id]) }));
      });
      return card;
    }

    function notifyCard() {
      var p = pat(), n = p.notify = p.notify || { enabled: false, bank: null, delaySec: 15, sendOnLeave: true, title: "", text: "" };
      var used = banksIn(p);
      var card = el("div", { class: "card" }, [el("h2", { text: "Notification" })]);
      function toggle(checked, onchange) { return el("label", { class: "switch" }, [el("input", { type: "checkbox", checked: checked, onchange: onchange }), el("i")]); }
      card.appendChild(el("div", { class: "row" }, [el("div", {}, [el("b", { text: "Send a notification" }),
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
      var log = api.readNotifLog ? api.readNotifLog() : [];
      if (log.length) {
        var dl = el("dl");
        log.slice(-4).reverse().forEach(function (x) {
          dl.appendChild(el("dt", { text: new Date(x.ts).toLocaleTimeString() }));
          dl.appendChild(el("dd", { class: x.ok ? "ok" : "warn", text: (x.ok ? "sent via " : "FAILED: ") + x.how }));
        });
        card.appendChild(el("div", { class: "hint", style: "margin-top:10px", text: "Recent sends:" })); card.appendChild(dl);
      }
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

    var SECTIONS = [["force", "Force number", "the number every forced answer lands on"], ["tricks", "Tricks (patterns)", "pick or copy a setup"],
      ["banks", "Banks & lookup tables", "what can be recorded, and extra info per value"], ["equation", "Equation & recording", "what is typed, and when things are recorded"], ["notify", "Notification", "what gets sent, and when"],
      ["data", "Shared data", "what other apps can read"], ["backup", "Backup & reset", ""]];
    function jumpTo(id) {
      var t = overlay.querySelector('[data-sec="' + id + '"]');
      if (t) overlay.scrollTo({ top: Math.max(0, t.offsetTop - 86), behavior: "smooth" });
    }
    function sec(id, node) { node.setAttribute("data-sec", id); return node; }

    function versionLine() {
      var app = api.appVersion, eng = FE.VERSION, set = 11;
      var ok = app === eng && eng === set;
      return el("div", { class: ok ? "hint" : "warn", style: "text-align:center;margin-top:10px",
        text: ok ? "Calculator v" + app : "Files out of sync (page v" + app + ", engine v" + eng + ", settings v" + set + "). Close the app fully and reopen it while online." });
    }
    function build() {
      overlay.innerHTML = "";
      BANKS = FE.resolveBanks(cfg);
      var menu = el("div", { class: "navmenu" }, SECTIONS.map(function (x) {
        return el("div", { onclick: function () { menu.classList.remove("open"); navBtn.classList.remove("open"); jumpTo(x[0]); } },
          [x[1], x[2] ? el("small", { text: x[2] }) : null]);
      }));
      var navBtn = el("button", { class: "navbtn", onclick: function (e) { e.stopPropagation(); menu.classList.toggle("open"); navBtn.classList.toggle("open"); } },
        ["TRICK SETTINGS", el("i", { text: "▾" })]);
      overlay.addEventListener("click", function () { menu.classList.remove("open"); navBtn.classList.remove("open"); });
      overlay.appendChild(el("div", { class: "bar" }, [navBtn, menu,
        el("button", { class: "btn main", style: "margin:0", text: "Done", onclick: close })]));
      overlay.appendChild(el("div", { class: "wrap" }, [sec("force", forceCard()), sec("tricks", patternsCard()), sec("banks", banksCard()), sec("equation", equationCard()),
        sec("notify", notifyCard()), sec("data", dataCard()), sec("backup", backupCard()),
        el("div", { class: "hint", style: "text-align:center;margin-top:6px", text: "Changes save as you make them." }),
        versionLine()]));
    }
    build();
  }

  root.FCSettings = { VERSION: 11, open: open };
})(typeof self !== "undefined" ? self : this);
