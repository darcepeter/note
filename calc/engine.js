/*
 * Calculator engine: a normal expression calculator (brackets, precedence, scientific keys) with
 * the hidden force and recording logic built in. A "pattern" (list of captures) says which typed
 * numbers are recorded into which "bank" (named group of fields); the forced number is solved
 * through the whole expression.
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
    if (s.indexOf("E") >= 0) {
      // a normal calculator writes 0.000928 and 12345678.5, not Java's 9.28E-4 / 1.23456785E7
      var a = Math.abs(d);
      if (a >= 1e-9 && a < 1e21) {
        s = a < 1 ? d.toFixed(Math.min(20, 12 - Math.floor(Math.log10(a)))) : String(d);
        if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
      }
      return s;
    }
    if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return s;
  }
  function formatForHistory(v) {
    var d = parseDoubleStrict(v);
    return d === null ? v : formatResult(d);
  }
  function isOperator(v) { return v === "+" || v === "−" || v === "×" || v === "÷"; }
  function canon(op) {
    switch (op) {
      case "+": return "+";
      case "-": case "−": return "-";
      case "*": case "×": return "*";
      case "/": case "÷": return "/";
      default: return op;
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
      id: "birthday", name: "Birthday", tag: "birthday", builtin: true,
      derivedDefs: [["date", "Date"], ["monthName", "Month name"], ["sign", "Star sign (with symbol)"], ["signName", "Star sign name"],
        ["signSymbol", "Star sign symbol"], ["signIndex", "Star sign order (1–12)", "number"], ["element", "Element"], ["quality", "Quality"], ["celebrity", "Celebrity"]],
      sample: { day: 21, month: 10 },
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


  // ─────────────────────────────────────────────────────────────────────────
  // More built-in banks: Full birthday, Zip code, Area code and card stacks.
  // Big tables (zip codes, area codes) live in data_zip.js / data_areacodes.js and are read on first use.
  // ─────────────────────────────────────────────────────────────────────────
  var STATE_NAMES = {"AL": "Alabama", "AK": "Alaska", "AZ": "Arizona", "AR": "Arkansas", "CA": "California", "CO": "Colorado", "CT": "Connecticut", "DE": "Delaware", "DC": "Washington D.C.", "FL": "Florida", "GA": "Georgia", "HI": "Hawaii", "ID": "Idaho", "IL": "Illinois", "IN": "Indiana", "IA": "Iowa", "KS": "Kansas", "KY": "Kentucky", "LA": "Louisiana", "ME": "Maine", "MD": "Maryland", "MA": "Massachusetts", "MI": "Michigan", "MN": "Minnesota", "MS": "Mississippi", "MO": "Missouri", "MT": "Montana", "NE": "Nebraska", "NV": "Nevada", "NH": "New Hampshire", "NJ": "New Jersey", "NM": "New Mexico", "NY": "New York", "NC": "North Carolina", "ND": "North Dakota", "OH": "Ohio", "OK": "Oklahoma", "OR": "Oregon", "PA": "Pennsylvania", "RI": "Rhode Island", "SC": "South Carolina", "SD": "South Dakota", "TN": "Tennessee", "TX": "Texas", "UT": "Utah", "VT": "Vermont", "VA": "Virginia", "WA": "Washington State", "WV": "West Virginia", "WI": "Wisconsin", "WY": "Wyoming", "PR": "Puerto Rico", "VI": "U.S. Virgin Islands", "GU": "Guam", "AS": "American Samoa", "MP": "Northern Mariana Islands", "AB": "Alberta", "BC": "British Columbia", "MB": "Manitoba", "NB": "New Brunswick", "NL": "Newfoundland and Labrador", "NS": "Nova Scotia", "ON": "Ontario", "PE": "Prince Edward Island", "QC": "Quebec", "SK": "Saskatchewan", "NT": "Northwest Territories", "NU": "Nunavut", "YT": "Yukon"};
  var LNY = "01310219020801290216020401250213020201220210013002180206012602140203012302110201022002080128021602050124021302020123021001300217020601260214020401240211013102190208012702150205012502130202012202100129021702060127021402030124021201310218020801280215020501250213020201210209013002170206012702150203012302110131021802070128021602050125021302020220020901290217020601270215020401230210013102190207012802160205012402120201012202090129021802070126021402030123021001310219020801280216020501250212020101220210012902170206012602130203012302110131021902080128021502040124021202010122021001300217020601260214020201230211020102190208012802150204012402120202012102090129021702050126021402030123021101310219020701270215020501240212020201220209012902170206012602140203012402100130021802070127021502050125021202010121"; // Chinese New Year (MMDD) for 1900–2099
  var tableCache = {};
  function dataTable(name) {
    if (tableCache[name]) return tableCache[name];
    var g = typeof globalThis !== "undefined" ? globalThis : (typeof window !== "undefined" ? window : {});
    var raw = g.FCData && g.FCData[name], map = {};
    if (typeof raw !== "string") return null; // the data file did not load
    raw.split("\n").forEach(function (line) { var p = line.split("|"); if (p[0]) map[p[0]] = p.slice(1); });
    tableCache[name] = map;
    return map;
  }
  function pad2(n) { return n < 10 ? "0" + n : String(n); }
  function ordinal(n) { var s = ["th", "st", "nd", "rd"], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
  function isLeap(y) { return (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0; }
  function daysIn(m, y) { return [31, isLeap(y) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
  var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  var PLANETS = ["Mars", "Venus", "Mercury", "the Moon", "the Sun", "Mercury", "Venus", "Pluto", "Jupiter", "Saturn", "Uranus", "Neptune"];
  var BIRTHSTONES = ["Garnet", "Amethyst", "Aquamarine", "Diamond", "Emerald", "Pearl", "Ruby", "Peridot", "Sapphire", "Opal", "Topaz", "Turquoise"];
  var BIRTHFLOWERS = ["Carnation", "Violet", "Daffodil", "Daisy", "Lily of the Valley", "Rose", "Larkspur", "Gladiolus", "Aster", "Marigold", "Chrysanthemum", "Narcissus"];
  var ANIMALS = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];
  var CN_ELEMENTS = ["Metal", "Metal", "Water", "Water", "Wood", "Wood", "Fire", "Fire", "Earth", "Earth"];
  function chineseYear(y, m, d) { // the lunar year they were born in (before Chinese New Year = previous animal)
    var s = LNY.substr((y - 1900) * 4, 4);
    if (s.length === 4 && (m * 100 + d) < parseInt(s, 10)) return y - 1;
    return y;
  }
  function generation(y) {
    return y <= 1927 ? "Greatest Generation" : y <= 1945 ? "Silent Generation" : y <= 1964 ? "Baby Boomer" : y <= 1980 ? "Generation X" : y <= 1996 ? "Millennial" : y <= 2012 ? "Generation Z" : "Generation Alpha";
  }
  function moonPhase(y, m, d) { // approximate (mean lunation), good to about a day
    var jd = Date.UTC(y, m - 1, d, 12) / 86400000 + 2440587.5, syn = 29.530588853;
    var a = (((jd - 2451550.1) % syn) + syn) % syn;
    return a < 1.85 ? "New Moon" : a < 5.54 ? "Waxing Crescent" : a < 9.23 ? "First Quarter" : a < 12.91 ? "Waxing Gibbous" : a < 16.61 ? "Full Moon" : a < 20.3 ? "Waning Gibbous" : a < 23.99 ? "Last Quarter" : a < 27.68 ? "Waning Crescent" : "New Moon";
  }
  function reduceNum(n) { while (n > 9 && n !== 11 && n !== 22 && n !== 33) { var s = 0; String(n).split("").forEach(function (c) { s += +c; }); n = s; } return n; }
  function season(m, d) {
    var k = m * 100 + d;
    return k >= 1221 || k < 320 ? "Winter" : k < 621 ? "Spring" : k < 922 ? "Summer" : "Fall";
  }
  function birthdayExtras(v, nowMs) {
    var d = v.day, m = v.month, y = v.year;
    if (d > daysIn(m, y)) return null; // not a real date
    var now = new Date(nowMs != null ? nowMs : Date.now());
    var ty = now.getFullYear(), tm = now.getMonth() + 1, td = now.getDate();
    var age = ty - y - ((tm < m || (tm === m && td < d)) ? 1 : 0);
    var todayU = Date.UTC(ty, tm - 1, td), bornU = Date.UTC(y, m - 1, d);
    var nb = (m === 2 && d === 29 && !isLeap(ty)) ? [3, 1] : [m, d];
    var nextU = Date.UTC(ty, nb[0] - 1, nb[1]);
    if (nextU < todayU) { var ny = ty + 1; nb = (m === 2 && d === 29 && !isLeap(ny)) ? [3, 1] : [m, d]; nextU = Date.UTC(ny, nb[0] - 1, nb[1]); }
    var nextDate = new Date(nextU);
    var dayOfYear = Math.round((bornU - Date.UTC(y, 0, 1)) / 86400000) + 1;
    var cy = chineseYear(y, m, d), sign = getStarSign(m, d), signName = sign.slice(sign.indexOf(" ") + 1), idx = SIGNS.indexOf(signName);
    var out = {
      date: monthName(m) + " " + d + ", " + y,
      dateShort: pad2(m) + "/" + pad2(d) + "/" + y,
      dayMonth: monthName(m) + " " + d,
      monthName: monthName(m),
      dayOrdinal: ordinal(d),
      weekday: WEEKDAYS[new Date(bornU).getUTCDay()],
      season: season(m, d),
      decade: Math.floor(y / 10) * 10 + "s",
      leapYear: isLeap(y) ? "yes" : "no",
      dayOfYear: dayOfYear,
      sign: sign, signName: signName, signSymbol: sign.slice(0, sign.indexOf(" ")), signIndex: idx + 1,
      element: ELEMENTS[idx % 4], quality: QUALITIES[idx % 3], rulingPlanet: PLANETS[idx],
      birthstone: BIRTHSTONES[m - 1], birthFlower: BIRTHFLOWERS[m - 1],
      chineseZodiac: ANIMALS[((cy - 4) % 12 + 12) % 12],
      chineseElement: CN_ELEMENTS[((cy % 10) + 10) % 10],
      generation: generation(y),
      moonPhase: moonPhase(y, m, d),
      lifePath: reduceNum(reduceNum(m) + reduceNum(d) + reduceNum(y)),
      age: age, turningAge: age + 1,
      daysAlive: Math.round((todayU - bornU) / 86400000),
      daysToBirthday: Math.round((nextU - todayU) / 86400000),
      nextBirthdayWeekday: WEEKDAYS[nextDate.getUTCDay()],
      yearTurned18: y + 18, yearTurned21: y + 21, yearTurned30: y + 30,
      celebrity: getCelebrity(m, d)
    };
    out.chineseZodiac2 = out.chineseElement + " " + out.chineseZodiac;
    return out;
  }
  var BDAY_DEFS = [["date", "Full date (October 21, 1985)"], ["dateShort", "Date (10/21/1985)"], ["dayMonth", "Day and month (October 21)"], ["monthName", "Month name"], ["dayOrdinal", "Day (21st)"],
    ["weekday", "Day of the week born"], ["season", "Season born"], ["decade", "Decade (1980s)"], ["leapYear", "Leap year? (yes/no)"], ["dayOfYear", "Day of the year (1–366)", "number"],
    ["sign", "Star sign (with symbol)"], ["signName", "Star sign name"], ["signSymbol", "Star sign symbol"], ["signIndex", "Star sign order (1–12)", "number"],
    ["element", "Element (Fire/Earth/Air/Water)"], ["quality", "Quality (Cardinal/Fixed/Mutable)"], ["rulingPlanet", "Ruling planet"],
    ["birthstone", "Birthstone"], ["birthFlower", "Birth flower"], ["chineseZodiac", "Chinese zodiac animal"], ["chineseElement", "Chinese zodiac element"], ["chineseZodiac2", "Chinese zodiac (Fire Horse)"],
    ["generation", "Generation"], ["moonPhase", "Moon phase at birth (approximate)"], ["lifePath", "Life path number", "number"],
    ["age", "Age today", "number"], ["turningAge", "Age at next birthday", "number"], ["daysAlive", "Days alive", "number"], ["daysToBirthday", "Days until next birthday", "number"],
    ["nextBirthdayWeekday", "Weekday of next birthday"], ["yearTurned18", "Year they turned 18", "number"], ["yearTurned21", "Year they turned 21", "number"], ["yearTurned30", "Year they turned 30", "number"],
    ["celebrity", "Celebrity with the same birthday"]];
  BANKS.birthdate = {
    id: "birthdate", name: "Full birthday", tag: "birthday", builtin: true, wide: true,
    about: "Day, month and year. Gives the weekday born, star sign, element, ruling planet, birthstone, birth flower, Chinese zodiac, generation, moon phase, age, life path number, a same-birthday celebrity and more. Chinese zodiac uses the real Chinese New Year date.",
    derivedDefs: BDAY_DEFS, sample: { day: 21, month: 10, year: 1985 },
    invalidNote: "that isn’t a real calendar date.",
    fields: [
      { id: "day", label: "Day", type: "int", min: 1, max: 31 },
      { id: "month", label: "Month", type: "int", min: 1, max: 12 },
      { id: "year", label: "Year", type: "int", min: 1900, max: 2099 }
    ],
    derive: function (v, nowMs) { return birthdayExtras(v, nowMs); }
  };

  // zip code → city and state
  BANKS.zip = {
    id: "zip", name: "Zip code", tag: "zip code", builtin: true, wide: true, dataset: "zip",
    about: "A 5-digit US zip code (about 42,500 of them). Gives the city, state and “City, ST”. A zip that doesn’t exist isn’t recorded.",
    derivedDefs: [["zipText", "Zip (5 digits)"], ["city", "City"], ["state", "State (TN)"], ["stateName", "State name (Tennessee)"], ["place", "City, State (Chattanooga, TN)"]],
    sample: { zip: 37402 }, invalidNote: "that zip code isn’t in the zip table (or the zip data file didn’t load).",
    fields: [{ id: "zip", label: "Zip", type: "int", min: 501, max: 99950, pad: 5 }],
    derive: function (v) {
      var t = dataTable("zip"), z = padText(v.zip, 5), row = t && t[z];
      if (!row) return null;
      return { zipText: z, city: row[0], state: row[1], stateName: STATE_NAMES[row[1]] || row[1], place: row[0] + ", " + row[1] };
    }
  };
  // area code → place
  BANKS.areacode = {
    id: "areacode", name: "Area code", tag: "area code", builtin: true, wide: true, dataset: "areacodes",
    about: "A 3-digit phone area code (US, Canada and the Caribbean). Gives the main city and the state or region.",
    derivedDefs: [["areaText", "Area code"], ["place", "Main place (Chattanooga, TN)"], ["region", "State or region (Tennessee)"]],
    sample: { code: 423 }, invalidNote: "that area code isn’t in the table (or the area code data file didn’t load).",
    fields: [{ id: "code", label: "Area code", type: "int", min: 200, max: 999, pad: 3 }],
    derive: function (v) {
      var t = dataTable("areacodes"), z = padText(v.code, 3), row = t && t[z];
      if (!row) return null;
      return { areaText: z, place: row[0], region: row[1] };
    }
  };

  // card stacks: a position (1–52) gives the card at that position, plus its neighbours
  var RANKS = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Jack", "Queen", "King"];
  var RANK_SHORT = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  var SUITS = { C: ["Clubs", "♣", "Black"], H: ["Hearts", "♥", "Red"], S: ["Spades", "♠", "Black"], D: ["Diamonds", "♦", "Red"] };
  function parseCard(code) { // "4C", "10H", "AS" or a longer name like "Four of Clubs" / "4♣"
    var s = String(code).trim().toUpperCase().replace(/♣/g, "C").replace(/♥/g, "H").replace(/♠/g, "S").replace(/♦/g, "D");
    var m = /^(10|[2-9]|A|J|Q|K|ACE|JACK|QUEEN|KING|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN)\s*(?:OF\s*)?(C|H|S|D|CLUBS|HEARTS|SPADES|DIAMONDS)$/.exec(s);
    if (!m) return null;
    var r = m[1], ri = RANK_SHORT.indexOf(r);
    if (ri < 0) ri = RANKS.map(function (x) { return x.toUpperCase(); }).indexOf(r);
    var su = m[2].charAt(0);
    return ri < 0 ? null : { rank: RANKS[ri], short: RANK_SHORT[ri] + SUITS[su][1], code: RANK_SHORT[ri] + su, suit: SUITS[su][0], symbol: SUITS[su][1], color: SUITS[su][2], name: RANKS[ri] + " of " + SUITS[su][0] };
  }
  function makeStackBank(id, name, about, cards) {
    var list = cards.map(parseCard);
    return {
      id: id, name: name, tag: "card", builtin: true, wide: true, stack: true, about: about,
      derivedDefs: [["card", "Card (Four of Clubs)"], ["short", "Card short (4♣)"], ["code", "Card code (4C)"], ["rank", "Rank (Four)"], ["suit", "Suit (Clubs)"], ["suitSymbol", "Suit symbol (♣)"], ["color", "Colour (Red/Black)"],
        ["prev", "Card before it in the stack"], ["next", "Card after it in the stack"], ["fromBottom", "Card the same distance from the bottom"]],
      sample: { position: 10 }, invalidNote: "that position isn’t in the stack.",
      fields: [{ id: "position", label: "Position", type: "int", min: 1, max: list.length }],
      derive: function (v) {
        var c = list[v.position - 1]; if (!c) return null;
        var p = list[v.position - 2], n = list[v.position], b = list[list.length - v.position];
        return { card: c.name, short: c.short, code: c.code, rank: c.rank, suit: c.suit, suitSymbol: c.symbol, color: c.color, prev: p ? p.name : "", next: n ? n.name : "", fromBottom: b ? b.name : "" };
      }
    };
  }
  var MNEMONICA = "4C 2H 7D 3C 4H 6D AS 5H 9S 2S QH 3D QC 8H 6S 5S 9H KC 2D JH 3S 8S 6H 10C 5D KD 2C 3H 8D 5C KS JD 8C 10S KH JC 7S 10H AD 4S 7H 4D AC 9C JS QD 7C QS 10D 6C AH 9D".split(" ");
  var STEBBINS = (function () { var out = [], suits = ["C", "H", "S", "D"], r = 1; for (var i = 0; i < 52; i++) { out.push(RANK_SHORT[r - 1] + suits[i % 4]); r = (r + 2) % 13 + 1; } return out; })();
  var NEWDECK = (function () { var out = [], i; for (i = 1; i <= 13; i++) out.push(RANK_SHORT[i - 1] + "S"); for (i = 1; i <= 13; i++) out.push(RANK_SHORT[i - 1] + "D"); for (i = 13; i >= 1; i--) out.push(RANK_SHORT[i - 1] + "C"); for (i = 13; i >= 1; i--) out.push(RANK_SHORT[i - 1] + "H"); return out; })();
  BANKS.mnemonica = makeStackBank("mnemonica", "Stack: Mnemonica (Tamariz)", "Juan Tamariz’s Mnemonica stack. A number from 1 to 52 gives the card at that position, plus the cards either side of it. Check it against your own copy before relying on it.", MNEMONICA);
  BANKS.stebbins = makeStackBank("stebbins", "Stack: Si Stebbins", "The Si Stebbins stack (CHaSeD order, each card three higher than the last). A number from 1 to 52 gives the card at that position.", STEBBINS);
  BANKS.newdeck = makeStackBank("newdeck", "Stack: New deck order", "A factory-fresh deck: A–K spades, A–K diamonds, K–A clubs, K–A hearts. A number from 1 to 52 gives the card at that position.", NEWDECK);

  // ── user-made banks ──
  // cfg.banks: [{ id, name, tag, fields:[{id,label,min,max,pad}],
  //               lookup:{ keyField, columns:[{id,label}], rows:[{key, values:{colId:text}}], onMissing:"blank"|"skip" } }]
  // A custom bank records plain numbers (any size) and can add extra text columns through its lookup table.
  function padText(v, pad) {
    var s = String(v);
    while (pad > 0 && s.length < pad) s = "0" + s;
    return s;
  }
  function makeCustomBank(def) {
    var fields = (def.fields || []).map(function (f) {
      return { id: f.id, label: f.label || f.id, type: "num", min: (typeof f.min === "number" ? f.min : null), max: (typeof f.max === "number" ? f.max : null), pad: f.pad > 0 ? f.pad : 0 };
    });
    var lookup = def.lookup && def.lookup.keyField && def.lookup.columns && def.lookup.columns.length ? def.lookup : null;
    var sample = {};
    fields.forEach(function (f) { sample[f.id] = f.min != null ? f.min : 1; });
    if (lookup && lookup.rows && lookup.rows.length) {
      var k = parseFloat(lookup.rows[0].key); if (!isNaN(k)) sample[lookup.keyField] = k;
    }
    var derivedDefs = [];
    fields.forEach(function (f) { derivedDefs.push([f.id + "Text", f.label + " (as text" + (f.pad ? ", " + f.pad + " digits" : "") + ")"]); });
    if (fields.length > 1) derivedDefs.push(["all", "All values together"]);
    if (lookup) { lookup.columns.forEach(function (c) { derivedDefs.push([c.id, c.label || c.id]); }); derivedDefs.push(["lookupFound", "Found in the table? (yes/no)"]); }
    var isStack = def.kind === "stack" && lookup;
    if (isStack) { var c0 = lookup.columns[0]; derivedDefs.push(["prev", "Before it (" + (c0.label || c0.id) + ")"], ["next", "After it (" + (c0.label || c0.id) + ")"], ["fromBottom", "Same distance from the bottom (" + (c0.label || c0.id) + ")"]); }
    return {
      id: def.id, name: def.name || "Untitled bank", tag: def.tag || "number", custom: true,
      fields: fields, sample: sample, derivedDefs: derivedDefs, lookup: lookup,
      derive: function (v) {
        var out = {}, all = [];
        fields.forEach(function (f) { var t = padText(v[f.id], f.pad); out[f.id + "Text"] = t; all.push(t); });
        if (fields.length > 1) out.all = all.join(" ");
        if (lookup) {
          var keyF = fields.filter(function (f) { return f.id === lookup.keyField; })[0];
          var raw = String(v[lookup.keyField]), padded = keyF ? padText(v[lookup.keyField], keyF.pad) : raw;
          var row = null;
          (lookup.rows || []).forEach(function (r) {
            var key = String(r.key).trim().toLowerCase();
            if (!row && (key === raw.toLowerCase() || key === padded.toLowerCase() || (key !== "" && !isNaN(Number(key)) && Number(key) === Number(raw)))) row = r;
          });
          if (!row && lookup.onMissing === "skip") return null;
          lookup.columns.forEach(function (c) { out[c.id] = row && row.values && row.values[c.id] != null ? String(row.values[c.id]) : ""; });
          out.lookupFound = row ? "yes" : "no";
          if (isStack) {
            var c0id = lookup.columns[0].id, n = Number(raw), total = (lookup.rows || []).length;
            var at = function (pos) { var hit = null; (lookup.rows || []).forEach(function (r) { if (!hit && Number(String(r.key).trim()) === pos) hit = r; }); return hit && hit.values && hit.values[c0id] != null ? String(hit.values[c0id]) : ""; };
            out.prev = at(n - 1); out.next = at(n + 1); out.fromBottom = total ? at(total + 1 - n) : "";
          }
        }
        return out;
      }
    };
  }
  /** Built-in banks plus the ones the user made. */
  function resolveBanks(cfg) {
    var all = {};
    Object.keys(BANKS).forEach(function (k) { all[k] = BANKS[k]; });
    ((cfg && cfg.banks) || []).forEach(function (d) { if (d && d.id && !all[d.id]) all[d.id] = makeCustomBank(d); });
    return all;
  }
  /** A self-describing summary other apps can read from the shared data. */
  function bankMeta(bank) {
    var fields = bank.fields.map(function (f) { return { id: f.id, label: f.label, kind: "number" }; });
    (bank.derivedDefs || []).forEach(function (d) { fields.push({ id: d[0], label: d[1], kind: d[2] === "number" ? "number" : "text", derived: true }); });
    return { name: bank.name, tag: bank.tag || "", fields: fields };
  }

  /** The original app's behaviour, expressed as a pattern. */
  function defaultConfig() {
    return {
      v: 1,
      forceNumber: null,
      banks: [],
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

    var MODE = { NORMAL: 0, FORCE_ENTRY: 1, FACEDOWN: 2, INJECTED: 3 };
    var toks = [];              // the expression: {t:"n",v,inj} | {t:"o",v} | {t:"("} | {t:")"}
    var justEvaluated = false, resultVal = "0", injectedNow = false;
    var mode = MODE.NORMAL;
    var forceEntryVal = "0", facedownTaps = 0, lastEquation = "";
    var deg = true, inv = false;
    var carried = [], lastNums = [], chainKey = null;   // numbers typed before an in-between "=", so the whole chain is recorded
    var lastLog = [];           // what the last "=" recorded (for tests / debugging)
    var displayTapCount = 0, lastDisplayTapTime = 0;
    var currentSettingIndex = 0, settingInputBuffer = "";
    var pending = []; // notifications waiting out their delay: {fire, handle}

    // what the screen shows
    var hist = "", disp = "0", banner = "none", acLabel = "AC";

    var cfg = env.loadConfig ? env.loadConfig() : null;
    if (!cfg || cfg.v !== 1 || !cfg.patterns || !cfg.patterns.length) cfg = defaultConfig();
    var forceNumber = (typeof cfg.forceNumber === "number") ? cfg.forceNumber : null;
    var banks = resolveBanks(cfg);

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

    // ── expression helpers ──
    function lastTok() { return toks.length ? toks[toks.length - 1] : null; }
    function isNumTok(t) { return t && t.t === "n"; }
    function openCount() { var n = 0; toks.forEach(function (t) { if (t.t === "(") n++; else if (t.t === ")") n--; }); return n; }
    function showNum(v) { return v.charAt(0) === "-" ? "\u2212" + v.slice(1) : v; }
    function showRes(d) { return showNum(formatResult(d)); }
    var FN_LABEL = { sin: "sin", cos: "cos", tan: "tan", asin: "sin⁻¹", acos: "cos⁻¹", atan: "tan⁻¹",
      ln: "ln", log: "log", sqrt: "√", exp: "e^", tenpow: "10^" };
    function exprText(list, closeAll, compact) {
      var out = "", open = 0;
      list.forEach(function (t) {
        if (t.t === "n") out += showNum(t.v);
        else if (t.t === "o") out += compact ? t.v : " " + t.v + " ";
        else if (t.t === "f") out += FN_LABEL[t.v] || t.v;
        else if (t.t === "!") out += "!";
        else if (t.t === "(") { out += "("; open++; }
        else { out += ")"; open--; }
      });
      if (closeAll) while (open-- > 0) out += ")";
      return out;
    }
    function numValue(t) { if (t.c) return t.v === "\u03C0" ? Math.PI : Math.E; var d = parseDoubleStrict(t.v); return d === null ? 0 : d; }
    function hasDigit(t) { return t && t.t === "n" && (t.c || /\d/.test(t.v)); }

    /** Parse tokens (parens already balanced) into a tree. Returns null if malformed. */
    function parseTokens(list) {
      var pos = 0, ok = true;
      function peek() { return list[pos]; }
      function isOp(t, set) { return t && t.t === "o" && set.indexOf(t.v) >= 0; }
      function atom() {
        var t = peek();
        if (!t) { ok = false; return null; }
        var node;
        if (t.t === "n") { pos++; node = { k: "num", tok: t, val: numValue(t) }; }
        else if (t.t === "f") {
          pos++;
          if (!peek() || peek().t !== "(") { ok = false; return null; }
          pos++; var e = expr();
          if (peek() && peek().t === ")") pos++; else ok = false;
          node = { k: "fn", f: t.v, a: e };
        } else if (t.t === "(") {
          pos++; var e2 = expr();
          if (peek() && peek().t === ")") pos++; else ok = false;
          node = e2;
        } else { ok = false; return null; }
        while (ok && peek() && peek().t === "!") { pos++; node = { k: "fact", a: node }; }
        return node;
      }
      function power() {                       // right-associative: 2^3^2 = 2^9
        var l = atom();
        if (ok && isOp(peek(), ["^"])) { pos++; var r = power(); l = { k: "bin", op: "^", l: l, r: r }; }
        return l;
      }
      function term() {
        var l = power();
        while (ok && isOp(peek(), ["×", "÷"])) { var op = list[pos++].v, r = power(); l = { k: "bin", op: op, l: l, r: r }; }
        return l;
      }
      function expr() {
        var l = term();
        while (ok && isOp(peek(), ["+", "−"])) { var op = list[pos++].v, r = term(); l = { k: "bin", op: op, l: l, r: r }; }
        return l;
      }
      var tree = expr();
      if (!ok || pos !== list.length || !tree) return null;
      return tree;
    }
    function toRad(x) { return deg ? x * Math.PI / 180 : x; }
    function fromRad(x) { return deg ? x * 180 / Math.PI : x; }
    function factorial(n) {
      if (!(n >= 0) || n !== Math.floor(n) || n > 170) return NaN;
      var r = 1; for (var i = 2; i <= n; i++) r *= i; return r;
    }
    function applyFn(f, x) {
      switch (f) {
        case "sin": return clean0(Math.sin(toRad(x)));
        case "cos": return clean0(Math.cos(toRad(x)));
        case "tan": return clean0(Math.tan(toRad(x)));
        case "asin": return fromRad(Math.asin(x));
        case "acos": return fromRad(Math.acos(x));
        case "atan": return fromRad(Math.atan(x));
        case "ln": return x > 0 ? Math.log(x) : NaN;
        case "log": return x > 0 ? Math.log(x) / Math.LN10 : NaN;
        case "sqrt": return x >= 0 ? Math.sqrt(x) : NaN;
        case "exp": return Math.exp(x);
        case "tenpow": return Math.pow(10, x);
        default: return NaN;
      }
    }
    function clean0(v) { return Math.abs(v) < 1e-15 ? 0 : v; }
    function evalTree(n) {
      if (n.k === "num") return n.val;
      if (n.k === "fn") return applyFn(n.f, evalTree(n.a));
      if (n.k === "fact") return factorial(evalTree(n.a));
      var a = evalTree(n.l), b = evalTree(n.r);
      switch (n.op) {
        case "+": return a + b;
        case "−": return a - b;
        case "×": return a * b;
        case "^": return Math.pow(a, b);
        default: return b === 0 ? NaN : a / b;
      }
    }
    function tidy(d) {
      if (!isFinite(d) || d === 0) return d;
      var r = Math.round(d);
      if (Math.abs(d - r) < 1e-9 * Math.max(1, Math.abs(d))) return r;   // 0.999999999999 -> 1
      return parseFloat(d.toPrecision(12));
    }

    /** The expression as it would be evaluated: dangling operators dropped, brackets closed. */
    function evalList() {
      var l = toks.slice();
      while (l.length) {
        var t = l[l.length - 1];
        if (t.t === "o" || t.t === "(" || t.t === "f" || (t.t === "n" && !hasDigit(t))) l.pop(); else break;
      }
      var open = 0; l.forEach(function (t) { if (t.t === "(") open++; else if (t.t === ")") open--; });
      while (open-- > 0) l.push({ t: ")" });
      return l;
    }
    function needsCalc(list) { return list.some(function (t) { return t.t === "o" || t.t === "f" || t.t === "!"; }); }

    /** Every typed number in order, with the operator right before it (brackets ignored). First has op null. */
    function buildNumLog(skipInjected) {
      var log = carried.slice(), prevOp = null;
      toks.forEach(function (t) {
        if (t.t === "o") prevOp = t.v;
        else if (t.t === "n") {
          if (t.carry) { prevOp = null; return; }           // a result carried over from an earlier "=": not a typed number
          if (!(skipInjected && t.inj)) log.push({ op: log.length ? prevOp : null, v: t.c ? formatResult(numValue(t)) : formatForHistory(t.v) });
          prevOp = null;
        }
      });
      return log;
    }

    // ── display ──
    var mainStr = "0", subStr = "", evaluated = false;
    function refreshDisplay() {
      if (justEvaluated) { hist = lastEquation; disp = showNum(resultVal); mainStr = disp; subStr = ""; evaluated = true; return; }
      evaluated = false;
      if (!toks.length) { hist = lastEquation; disp = "0"; mainStr = "0"; subStr = ""; return; }
      var l = evalList(), tree = l.length ? parseTokens(l) : null, t = lastTok();
      var complex = needsCalc(toks) || toks.some(function (x) { return x.t === "("; });
      hist = complex ? exprText(toks, false) : "";
      if (complex && tree && needsCalc(l)) disp = showRes(tidy(evalTree(tree)));
      else if (isNumTok(t)) disp = showNum(t.v);
      else disp = tree ? showRes(tidy(evalTree(tree))) : "0";
      mainStr = complex ? exprText(toks, false, true) : disp;
      subStr = (complex && tree && needsCalc(l)) ? disp : "";
    }

    // ── input dispatcher ──
    function handleInput(val) {
      expireFacedown();
      // AC always gets you out of the hidden modes, so the calculator can never feel stuck
      if (val === "AC" && (mode === MODE.FACEDOWN || mode === MODE.INJECTED)) {
        mode = MODE.NORMAL; facedownTaps = 0; injectedNow = false; startFresh(); lastEquation = ""; resultVal = "0";
        refreshDisplay(); return;
      }
      switch (mode) {
        case MODE.NORMAL: pressNormal(val); break;
        case MODE.FORCE_ENTRY: pressForceEntry(val); break;
        case MODE.FACEDOWN: handleFacedownTap(); break;
        case MODE.INJECTED: pressInjected(val); break;
      }
    }

    // ── NORMAL ──
    function startFresh() { toks = []; justEvaluated = false; carried = []; lastNums = []; chainKey = null; }
    function operandEnded(t) { return !!t && ((t.t === "n" && hasDigit(t)) || t.t === ")" || t.t === "!"); }
    function fromResult() { if (justEvaluated) { carried = lastNums.slice(); toks = [{ t: "n", v: resultVal, carry: true }]; justEvaluated = false; } return lastTok(); }
    var FN_KEYS = { "sin": ["sin", "asin"], "cos": ["cos", "acos"], "tan": ["tan", "atan"], "ln": ["ln", "exp"], "log": ["log", "tenpow"], "√": ["sqrt", null] };
    function pressNormal(val) {
      var t = lastTok();
      if (val === "AC") { startFresh(); lastEquation = ""; resultVal = "0"; refreshDisplay(); return; }
      if (val === "Deg") { deg = !deg; return; }
      if (val === "Inv") { inv = !inv; return; }
      if (val === "⌫") {
        if (justEvaluated) return;
        if (!t) return;
        if (t.t === "n" && !t.c) { t.v = t.v.slice(0, -1); if (t.v === "" || t.v === "-") toks.pop(); }
        else {
          toks.pop();
          if (t.t === "(" && lastTok() && lastTok().t === "f") toks.pop();   // "sin(" goes as one
        }
        refreshDisplay(); return;
      }
      if (val === "%") {
        t = fromResult();
        if (isNumTok(t) && hasDigit(t)) { t.v = formatResult(tidy(numValue(t) / 100.0)); t.c = false; refreshDisplay(); }
        return;
      }
      if (val === "()") {
        t = fromResult();
        var after = operandEnded(t);
        if (after && openCount() > 0) toks.push({ t: ")" });
        else {
          if (after) toks.push({ t: "o", v: "×" });
          else if (isNumTok(t) && !hasDigit(t)) { t.v = "-1"; toks.push({ t: "o", v: "×" }); }
          toks.push({ t: "(" });
        }
        refreshDisplay(); return;
      }
      if (val === "π" || val === "e") {
        t = fromResult();
        if (isNumTok(t) && !hasDigit(t)) toks.pop();
        if (operandEnded(lastTok())) toks.push({ t: "o", v: "×" });
        toks.push({ t: "n", v: val, c: true });
        refreshDisplay(); return;
      }
      if (val === "!") {
        t = fromResult();
        if (operandEnded(t)) { toks.push({ t: "!" }); refreshDisplay(); }
        return;
      }
      if (FN_KEYS[val]) {
        t = fromResult();
        var fname = FN_KEYS[val][inv ? 1 : 0];
        if (!fname) {                                // Inv + root = square
          if (operandEnded(t)) { toks.push({ t: "o", v: "^" }); toks.push({ t: "n", v: "2" }); refreshDisplay(); }
          return;
        }
        if (isNumTok(t) && !hasDigit(t)) toks.pop();
        if (operandEnded(lastTok())) toks.push({ t: "o", v: "×" });
        toks.push({ t: "f", v: fname }); toks.push({ t: "(" });
        refreshDisplay(); return;
      }
      if (isOperator(val) || val === "^") {
        if (val === "^") { t = fromResult(); if (!operandEnded(t)) return; }
        else t = fromResult();
        if (val === "−" && (!t || t.t === "o" || t.t === "(")) {
          toks.push({ t: "n", v: "-" }); refreshDisplay(); return;   // a sign: -5, 3 × -2, (-4
        }
        if (!t) { toks.push({ t: "n", v: "0" }); }
        else if (isNumTok(t) && !hasDigit(t)) { return; }          // lone sign: wait for a number
        else if (t.t === "(" || t.t === "f") { return; }
        else if (t.t === "o") { toks.pop(); }                      // changed my mind: replace the operator
        toks.push({ t: "o", v: val });
        refreshDisplay(); return;
      }
      if (val === "=") {
        if (justEvaluated) return;
        var l = evalList(), tree = l.length ? parseTokens(l) : null;
        if (!tree || !needsCalc(l)) return;            // nothing to calculate yet
        var res = tidy(evalTree(tree));
        var nums = buildNumLog(injectedNow);
        lastEquation = exprText(l, false) + " =";
        resultVal = formatResult(res);
        lastLog = nums.slice(1).map(function (x) { return x.op + "|" + x.v; });
        justEvaluated = true;
        var exprC = exprText(l, false, true);
        injectedNow = false;
        toks = l.slice();
        lastNums = nums;
        var notes = tryCapture(nums);
        if (env.evaluated) env.evaluated({ expr: exprC, result: showNum(resultVal), numbers: nums.map(function (x) { return (x.op || "") + " " + x.v; }), notes: notes, pattern: pattern().name });
        refreshDisplay();
        return;
      }
      // digit or dot
      if (justEvaluated) startFresh();
      t = lastTok();
      if (t && (t.t === ")" || t.t === "!" || (t.t === "n" && t.c))) { toks.push({ t: "o", v: "×" }); t = lastTok(); }
      if (!isNumTok(t)) { toks.push({ t: "n", v: "0", fresh: true }); t = lastTok(); }
      if (val === ".") {
        if (t.v.indexOf(".") < 0) { t.v = (t.v === "" || t.v === "-") ? t.v + "0." : (t.fresh ? "0." : t.v + "."); }
      } else if (t.fresh || t.v === "0") {
        t.v = val;
      } else if (t.v === "-0") { t.v = "-" + val; }
      else t.v += val;
      t.fresh = false;
      refreshDisplay();
    }

    // ── FORCE_ENTRY ──
    function enterForceEntryMode() {
      mode = MODE.FORCE_ENTRY; forceEntryVal = "0"; banner = "force";
      hist = ""; disp = "0"; acLabel = "C";
    }
    function pressForceEntry(val) {
      if (val === "AC" || val === "C") { forceEntryVal = "0"; disp = "0"; return; }
      if (val === "\u232B") {
        forceEntryVal = (forceEntryVal.length <= 1 || (forceEntryVal.length === 2 && forceEntryVal.charAt(0) === "-"))
          ? "0" : forceEntryVal.slice(0, -1);
        disp = forceEntryVal; return;
      }
      if (val === "=") {
        var v = parseDoubleStrict(forceEntryVal);
        if (v !== null) { forceNumber = v; savePrefs(); }
        exitForceEntryMode(); return;
      }
      if (val === "\u2212") {   // the minus key flips the sign (there is no +/- key any more)
        forceEntryVal = forceEntryVal.charAt(0) === "-" ? forceEntryVal.substring(1) : "-" + forceEntryVal;
        disp = forceEntryVal; return;
      }
      if (val === "%" || val === "()" || isOperator(val)) return;
      if (val !== "." && !/^[0-9]$/.test(val)) return;
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

    // ── FACEDOWN / injection ──
    var facedownStamp = 0;
    function enterFacedownMode() {
      mode = MODE.FACEDOWN; facedownTaps = 0; facedownStamp = env.now ? env.now() : Date.now(); env.vibrate && env.vibrate(80);
    }
    /** An accidental long-press must not lock the keypad: after a few seconds with no taps, the armed state lapses. */
    function expireFacedown() {
      if (mode !== MODE.FACEDOWN) return;
      var now = env.now ? env.now() : Date.now();
      if (now - facedownStamp > 8000) { mode = MODE.NORMAL; facedownTaps = 0; }
    }
    function handleFacedownTap() {
      facedownStamp = env.now ? env.now() : Date.now();
      env.vibrate && env.vibrate(30);
      facedownTaps++;
      if (facedownTaps >= 3) injectForce();
    }
    /** Find the value the last number must take so the whole expression equals `target`. */
    function invFn(f, T) {
      switch (f) {
        case "sin": return Math.abs(T) <= 1 ? fromRad(Math.asin(T)) : null;
        case "cos": return Math.abs(T) <= 1 ? fromRad(Math.acos(T)) : null;
        case "tan": return fromRad(Math.atan(T));
        case "asin": return Math.sin(toRad(T));
        case "acos": return Math.cos(toRad(T));
        case "atan": return Math.tan(toRad(T));
        case "ln": return Math.exp(T);
        case "log": return Math.pow(10, T);
        case "sqrt": return T >= 0 ? T * T : null;
        case "exp": return T > 0 ? Math.log(T) : null;
        case "tenpow": return T > 0 ? Math.log(T) / Math.LN10 : null;
      }
      return null;
    }
    function solveFor(tree, leaf, target) {
      function has(n) { return n.k === "num" ? n.tok === leaf : n.k === "bin" ? (has(n.l) || has(n.r)) : has(n.a); }
      var node = tree, T = target;
      while (node.k !== "num") {
        if (node.k === "fact") return null;
        if (node.k === "fn") { T = invFn(node.f, T); if (T === null || isNaN(T)) return null; node = node.a; continue; }
        var inLeft = has(node.l), other = evalTree(inLeft ? node.r : node.l);
        if (isNaN(other)) return null;
        switch (node.op) {
          case "+": T = T - other; break;
          case "−": T = inLeft ? T + other : other - T; break;
          case "×": if (other === 0) return null; T = T / other; break;
          case "^":
            if (inLeft) {
              if (other === 0) return null;
              if (T < 0) { if (other === Math.floor(other) && Math.abs(other) % 2 === 1) T = -Math.pow(-T, 1 / other); else return null; }
              else T = Math.pow(T, 1 / other);
            } else {
              if (!(T > 0) || !(other > 0) || other === 1) return null;
              T = Math.log(T) / Math.log(other);
            }
            break;
          default:   // divide
            if (inLeft) T = T * other;
            else { if (T === 0) return null; T = other / T; }
        }
        node = inLeft ? node.l : node.r;
      }
      return T;
    }
    /** The sum is linear in the last number, so a couple of Newton steps remove any rounding drift. */
    function refine(tree, leaf, x, target) {
      var node = null;
      (function find(n) { if (n.k === "num") { if (n.tok === leaf) node = n; } else if (n.k === "bin") { find(n.l); find(n.r); } else find(n.a); })(tree);
      if (!node) return x;
      var keep = node.val;
      function f(v) { node.val = v; return evalTree(tree); }
      for (var i = 0; i < 6; i++) {
        var err = f(x) - target;
        if (tidy(f(x)) === tidy(target)) break;
        var h = Math.abs(x) * 1e-7 + 1e-7, slope = (f(x + h) - f(x)) / h;
        if (!isFinite(slope) || slope === 0) break;
        var nx = x - err / slope;
        if (!isFinite(nx) || !(Math.abs(f(nx) - target) < Math.abs(err))) break;
        x = nx;
      }
      node.val = keep;
      return x;
    }
    function injectForce() {
      if (forceNumber === null) { mode = MODE.NORMAL; return; }
      var target = forceNumber, t;
      if (justEvaluated) startFresh();
      t = lastTok();
      if (t && t.t === "n" && !hasDigit(t)) { toks.pop(); t = lastTok(); }
      var anyOp = toks.some(function (x) { return x.t === "o" || x.t === "(" || x.t === "f" || x.t === "!"; });
      var v;
      if (!anyOp) {
        // no sum yet: the original shows "0 + target"
        v = { t: "n", v: "0", inj: true };
        toks = [{ t: "n", v: "0" }, { t: "o", v: "+" }, v];
      } else if (t && t.t === "n" && !t.c) {
        v = t;
      } else {
        if (t && (t.t === ")" || t.t === "!" || t.t === "n")) toks.push({ t: "o", v: "\u00D7" });
        v = { t: "n", v: "0" }; toks.push(v);
      }
      var tree = parseTokens(evalList());
      var x = tree ? solveFor(tree, v, target) : null;
      if (x !== null) x = refine(tree, v, x, target);
      v.v = formatResult(x === null ? 0 : x);
      v.inj = true; injectedNow = true;
      mode = MODE.INJECTED;
      refreshDisplay();
    }
    function pressInjected(val) {
      if (val === "=") { mode = MODE.NORMAL; pressNormal("="); }
    }

    // ── Recording: pattern captures -> banks -> record + notification ──
    function tryCapture(nums) {
      var pat = pattern(), notes = [];
      var byBank = {};
      pat.captures.forEach(function (c) { (byBank[c.bank] = byBank[c.bank] || []).push(c); });
      if (!pat.captures.length) notes.push("This pattern records nothing (no numbers are set to be recorded).");
      Object.keys(byBank).forEach(function (bankId) {
        var bank = banks[bankId];
        if (!bank) { notes.push("A recording uses a bank that no longer exists."); return; }
        var caps = byBank[bankId], i;
        function posOf(c) { return typeof c.pos === "number" ? c.pos : c.step + 1; }
        // every capture needs its number to exist (all-or-nothing, as in the original)
        for (i = 0; i < caps.length; i++) if (nums.length <= posOf(caps[i])) {
          notes.push(bank.name + ": needs number " + (posOf(caps[i]) + 1) + " (" + caps[i].field + "), but only " + nums.length + " number" + (nums.length === 1 ? " was" : "s were") + " typed.");
          return;
        }
        var values = {};
        for (i = 0; i < caps.length; i++) {
          var entry = nums[posOf(caps[i])];
          if (posOf(caps[i]) > 0 && caps[i].op !== "any" && canon(entry.op || "") !== canon(caps[i].op)) {
            notes.push(bank.name + " " + caps[i].field + ": number " + (posOf(caps[i]) + 1) + " (" + entry.v + ") was typed after “" + (entry.op || "?") + "” but the pattern wants “" + caps[i].op + "”.");
            return;
          }
          var num = parseDoubleStrict(entry.v);
          if (num === null) { notes.push(bank.name + " " + caps[i].field + ": “" + entry.v + "” isn’t a number."); return; }
          values[caps[i].field] = isNaN(num) ? 0 : ((bank.custom || bank.wide) ? Math.round(num) : (Math.round(num) | 0));
        }
        for (i = 0; i < bank.fields.length; i++) {
          var f = bank.fields[i], v = values[f.id];
          if (v === undefined) { notes.push(bank.name + ": " + f.label + " isn’t set to be recorded."); return; }
          if (v < f.min || v > f.max) { notes.push(bank.name + " " + f.label + ": " + v + " is outside " + f.min + "–" + f.max + "."); return; }
        }
        var fields = {};
        Object.keys(values).forEach(function (k) { fields[k] = values[k]; });
        var derived = bank.derive(values, env.now ? env.now() : Date.now());
        if (derived === null) { notes.push(bank.name + ": " + (bank.invalidNote || "nothing in the lookup table for that number") + " Nothing was recorded."); return; }
        Object.keys(derived).forEach(function (k) { fields[k] = derived[k]; });
        var key = bankId + JSON.stringify(values);
        if (carried.length && key === chainKey) { notes.push("Already recorded " + bank.name + " earlier in this sum."); return; }
        chainKey = key;
        var record = { bank: bankId, pattern: pat.id, ts: env.now ? env.now() : Date.now(), fields: fields, meta: bankMeta(bank) };
        if (env.publish) env.publish(record);
        notes.push("Recorded " + bank.name + ": " + (fields.date || fields.all || fields[bank.fields[0].id + "Text"] || JSON.stringify(values)) + ".");
        var n = pat.notify;
        if (n && n.enabled && n.bank === bankId) scheduleNotification(record, n);
      });
      return notes;
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
      expireFacedown();
      var now = env.now ? env.now() : Date.now();
      if (now - lastDisplayTapTime > 1500) displayTapCount = 0;
      lastDisplayTapTime = now;
      displayTapCount++;
      if (mode === MODE.FACEDOWN || mode === MODE.INJECTED) {
        handleFacedownTap();
      } else if (displayTapCount >= 5) {
        displayTapCount = 0;
        if (mode !== MODE.NORMAL) { mode = MODE.NORMAL; banner = "none"; acLabel = "AC"; refreshDisplay(); }
        if (env.openSettings) env.openSettings();
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
      getConfig: function () { cfg.forceNumber = forceNumber; return JSON.parse(JSON.stringify(cfg)); },
      setConfig: function (c) {
        if (!c || c.v !== 1 || !c.patterns || !c.patterns.length) return false;
        cfg = JSON.parse(JSON.stringify(c));
        if (!cfg.patterns.some(function (p) { return p.id === cfg.activePattern; })) cfg.activePattern = cfg.patterns[0].id;
        banks = resolveBanks(cfg);
        forceNumber = (typeof cfg.forceNumber === "number") ? cfg.forceNumber : null;
        savePrefs(); return true;
      },
      setForceNumber: function (n) { forceNumber = (typeof n === "number" && isFinite(n)) ? n : null; savePrefs(); },
      startKeypadForce: function () { if (mode === MODE.NORMAL) enterForceEntryMode(); },
      view: function () {
        var plain = banner !== "none";
        return { display: disp, history: hist, banner: banner, ac: acLabel,
          main: plain ? disp : mainStr, sub: plain ? hist : subStr, evaluated: !plain && evaluated,
          deg: deg, inv: inv };
      },
      state: function () {
        return { mode: mode, expr: exprText(toks, false), result: resultVal, justEvaluated: justEvaluated,
          opLog: lastLog.slice(), forceNumber: forceNumber,
          pending: pending.length, config: JSON.parse(JSON.stringify(cfg)) };
      }
    };
  }

  return {
    VERSION: 11, createCalc: createCalc, defaultConfig: defaultConfig, BANKS: BANKS, resolveBanks: resolveBanks, bankMeta: bankMeta,
    formatResult: formatResult,
    getStarSign: getStarSign, getCelebrity: getCelebrity, monthName: monthName,
    fillTemplate: fillTemplate, parseDoubleStrict: parseDoubleStrict, parseCard: parseCard, dataTable: dataTable
  };
});
