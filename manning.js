/* ============================================================
   BFDLink — Daily Manning (live view)
   ------------------------------------------------------------
   Reads the Apps Script endpoint (manning-apps-script.gs / see
   MANNING-SCRIPT-DEPLOY.md) and renders the same card format approved in
   manning-card-preview.html. This file is function/data definitions only —
   wiring (which elements it renders into, tile-tap → open sheet, refresh
   buttons) lives in index.html's inline script, same split as shift.js
   (logic) vs the inline script (wiring).

   Payload shape (matches the deployed script and BFDLINK-BUILD-PLAN.md
   section 4, "Actual response shape"):
     { asOf, sheetModified,
       command: { BC, FIT, SQ1 },
       units: [ { unit:"E1", dayFlag:"Day 1"|null,
                  radios:[…], seats:[ { position, name, activity } ] } ] }

   Note seats here are {position,name,activity} OBJECTS, not the [pos,name]
   tuples the ported parser below expects (that shape came from hand-typing
   a preview snapshot). groupIntoStations() is the adapter between the two,
   so the parser itself didn't need touching.
   ============================================================ */

const MANNING_ENDPOINT =
  'https://script.google.com/macros/s/AKfycbwg9vuEqkIpDq8dAv-q3RLazKVyTAJ6al6P-SiTI9BZrBsa_fbC3iBBJ7Np96_MbE-GAw/exec';
const MANNING_CACHE_KEY = 'bfd-manning-lastgood';

function manningEsc(s){
  return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;')
                  .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* ---------------- staleness: tours turn over at 0700, not midnight ----------------
   Per BFDLINK-BUILD-PLAN.md section 4b (confirmed with Nick, Aug 12):
     - shift.js's shiftFor() computes by calendar date, so before 0700 the
       "expected" sheet value is still YESTERDAY's tour-day, not today's.
     - CPTs typically update by ~0800. Flagging the 0700-0800 window would
       flag every apparatus every single morning -- noise, not signal. No
       mismatch flagging before 0800 at all.
   This mirrors what the header's own shift bar does NOT do -- the header
   always shows the correct calendar day the instant it flips (midnight),
   because that's a different question ("what day is it") from "has this
   apparatus's manning entry been updated for the tour that's now current." */
function expectedTourDayLabel(now){
  var eff = new Date(now);
  if (now.getHours() < 7) eff.setDate(eff.getDate() - 1);
  var s = shiftFor(eff.getFullYear(), eff.getMonth(), eff.getDate());
  return 'Day ' + s.dayOf;
}

/* Blank reads the same as a match (nothing to flag) -- it isn't evidence
   the manning is stale, just a unit whose sheet doesn't track this field at
   all (every Medic/Truck row, as typed). The only thing worth surfacing is
   a unit that DOES have a day value and it's wrong. */
function isDayStale(dayFlag, now){
  if (now.getHours() < 8) return false;
  var norm = (dayFlag || '').trim();
  return !!norm && norm !== expectedTourDayLabel(now);
}

/* ---------------- name-cell parser (ported from manning-card-preview.html,
   approved format round 2) ---------------- */

function normalizePosition(raw){
  var t = (raw || '').trim();
  if (/^(eo|eng|do)$/i.test(t)) return 'ENG';
  if (/^(capt|cpt)$/i.test(t)) return 'CPT';
  return t;
}

var UNIT_FULL_NAMES = { E: 'Engine', M: 'Medic', T: 'Tower' };
function unitFullName(code){
  var m = (code || '').match(/^([A-Za-z]+)(\d.*)$/);
  if (!m) return code;
  var full = UNIT_FULL_NAMES[m[1].toUpperCase()];
  return full ? (full + ' ' + m[2]) : code;
}

var TAG_WORD_RE = /^(ENG|EO|DO|CPT|CAPT|FF|STU|AM|PM|OT|TT|A)\b/i;

function splitPeople(raw){
  var out = [];
  var buf = '';
  for (var i = 0; i < raw.length; i++){
    var ch = raw.charAt(i);
    if (ch === ','){ out.push(buf); buf = ''; continue; }
    if (ch === '/'){
      var after = raw.slice(i + 1).replace(/^[\s(]+/, '');
      var m = after.match(/^([A-Za-z]+)/);
      var word = m ? m[1] : '';
      if (TAG_WORD_RE.test(word)){ buf += ch; continue; }
      out.push(buf); buf = ''; continue;
    }
    buf += ch;
  }
  out.push(buf);
  var result = [];
  for (var j = 0; j < out.length; j++){
    var v = out[j].trim();
    if (v) result.push(v);
  }
  return result;
}

function parsePerson(raw){
  var s = raw;
  var tags = [];

  var acting = s.match(/\(?A\/([A-Za-z]+)(-[A-Za-z]+)?\)?/i);
  if (acting){
    tags.push({ cls: 'tag-acting', text: 'Acting' });
    s = s.replace(acting[0], '');
  }
  if (/\bOT\b/i.test(s)){ tags.push({ cls: 'tag-ot', text: 'OT' }); s = s.replace(/\bOT\b/i, ''); }
  if (/\bTT\b/i.test(s)){ tags.push({ cls: 'tag-tt', text: 'TT' }); s = s.replace(/\bTT\b/i, ''); }
  s = s.replace(/\b(AM|PM)\b/gi, '');
  s = s.replace(/[()\-,\/]/g, ' ').replace(/\s+/g, ' ').trim();

  return { name: s, tags: tags };
}

function splitByHalfKeywords(raw){
  var amAll = raw.match(/\bAM\b/gi);
  var pmAll = raw.match(/\bPM\b/gi);
  if (!amAll || !pmAll || amAll.length !== 1 || pmAll.length !== 1) return null;

  var amMatch = raw.match(/\bAM\b/i);
  var pmMatch = raw.match(/\bPM\b/i);
  if (amMatch.index > pmMatch.index) return null;

  var end = amMatch.index + amMatch[0].length;
  if (raw.charAt(end) === ')') end += 1;

  var first = raw.slice(0, end).trim();
  var second = raw.slice(end).replace(/^[\s\/,\-]+/, '').trim();
  if (!first || !second) return null;
  return [first, second];
}

function parseSeat(rawName){
  if (!rawName) return { empty: true };

  var people = splitPeople(rawName);
  if (people.length === 1){
    var byHalf = splitByHalfKeywords(rawName);
    if (byHalf){
      var amH = parsePerson(byHalf[0]);
      var pmH = parsePerson(byHalf[1]);
      if (amH.name && pmH.name) return { am: amH, pm: pmH };
    }
    var p = parsePerson(people[0]);
    if (!p.name) return { unclear: true, raw: rawName };
    return { single: p };
  }
  if (people.length === 2){
    var am = parsePerson(people[0]);
    var pm = parsePerson(people[1]);
    if (!am.name || !pm.name) return { unclear: true, raw: rawName };
    return { am: am, pm: pm };
  }
  return { unclear: true, raw: rawName };
}

function tagsHTML(tags){
  var s = '';
  for (var i = 0; i < tags.length; i++) s += '<span class="tag ' + tags[i].cls + '">' + tags[i].text + '</span>';
  return s;
}

function stripeDiv(rowIndex){
  return '<div class="stripe" style="grid-row:' + rowIndex + '"></div>';
}

/* Every content cell carries an explicit grid-column, not just an explicit
   grid-row -- the .stripe div for the same row is grid-column:1/-1 and sits
   earlier in the DOM, so auto-placed columns would otherwise get shoved
   into implicit columns off to the right instead of overlapping it. */
function seatHTML(position, rawName, narrow, rowIndex){
  var pos = normalizePosition(position);
  var parsed = parseSeat(rawName);
  var stripe = (rowIndex % 2 === 0) ? stripeDiv(rowIndex) : '';
  function c(col){ return ' style="grid-row:' + rowIndex + ';grid-column:' + col + '"'; }

  if (narrow){
    if (parsed.empty)
      return stripe + '<div class="seat"><div class="pos"' + c(1) + '>' + pos + '</div><div class="name mvacant"' + c(2) + '>— vacant —</div></div>';
    if (parsed.unclear)
      return stripe + '<div class="seat"><div class="pos"' + c(1) + '>' + pos + '</div><div class="name"' + c(2) + '>' + manningEsc(parsed.raw) + ' <span class="tag tag-raw">unclear</span></div></div>';
    var solo = parsed.single || { name: '', tags: [] };
    return stripe + '<div class="seat"><div class="pos"' + c(1) + '>' + pos + '</div><div class="name"' + c(2) + '>' + manningEsc(solo.name) + tagsHTML(solo.tags) + '</div></div>';
  }

  if (parsed.empty)
    return stripe + '<div class="seat"><div class="pos"' + c(1) + '>' + pos + '</div><div class="mk"' + c(2) + '></div>' +
           '<div class="name am-slot mvacant"' + c(3) + '>— vacant —</div><div class="mk"' + c(4) + '></div><div class="name"' + c(5) + '></div></div>';

  if (parsed.unclear)
    return stripe + '<div class="seat"><div class="pos"' + c(1) + '>' + pos + '</div><div class="mk"' + c(2) + '></div>' +
           '<div class="name"' + c('3/6') + '>' + manningEsc(parsed.raw) + ' <span class="tag tag-raw">unclear</span></div></div>';

  if (parsed.single)
    return stripe + '<div class="seat"><div class="pos"' + c(1) + '>' + pos + '</div><div class="mk"' + c(2) + '></div>' +
           '<div class="name am-slot"' + c(3) + '>' + manningEsc(parsed.single.name) + tagsHTML(parsed.single.tags) + '</div>' +
           '<div class="mk"' + c(4) + '></div><div class="name"' + c(5) + '></div></div>';

  return stripe + '<div class="seat"><div class="pos"' + c(1) + '>' + pos + '</div>' +
         '<div class="mk a"' + c(2) + '>AM</div><div class="name am-slot"' + c(3) + '>' + manningEsc(parsed.am.name) + tagsHTML(parsed.am.tags) + '</div>' +
         '<div class="mk p"' + c(4) + '>PM</div><div class="name"' + c(5) + '>' + manningEsc(parsed.pm.name) + tagsHTML(parsed.pm.tags) + '</div></div>';
}

function isUnitUnfilled(seats){
  for (var i = 0; i < seats.length; i++){
    if ((seats[i][1] || '').trim()) return false;
  }
  return true;
}

function unitHasSplit(seats){
  for (var i = 0; i < seats.length; i++){
    var parsed = parseSeat(seats[i][1]);
    if (parsed.am && parsed.pm) return true;
  }
  return false;
}

function hasWord(s, word){
  return new RegExp('\\b' + word + '\\b', 'i').test(s || '');
}

/* Some split seats arrive as two SEPARATE ROWS in the sheet -- same position
   code, one row tagged AM only, the next tagged PM only -- rather than one
   comma/slash-joined cell. Detected and combined here before the per-seat
   parser runs, by joining them into one cell the way a real AM/PM cell
   already looks. Confirmed real pattern (E2's Saif/Galvan in the original
   transcribed sheet), not a hypothetical -- kept for the live feed too. */
function groupSeatRows(seats){
  var out = [];
  for (var i = 0; i < seats.length; i++){
    var cur = seats[i];
    var next = seats[i + 1];
    // Compare through normalizePosition(), not the raw sheet text -- "Capt"
    // on one row and "CPT" on the next (a real documented inconsistency,
    // see BFDLINK-BUILD-PLAN.md) is the same seat and should still merge.
    if (next && normalizePosition(cur[0]) === normalizePosition(next[0])){
      var curName = (cur[1] || '').trim();
      var nextName = (next[1] || '').trim();
      var curIsAmOnly = curName && hasWord(curName, 'AM') && !hasWord(curName, 'PM');
      var nextIsPmOnly = nextName && hasWord(nextName, 'PM') && !hasWord(nextName, 'AM');
      if (curIsAmOnly && nextIsPmOnly){
        out.push([cur[0], curName + ', ' + nextName]);
        i++;
        continue;
      }
    }
    out.push(cur);
  }
  return out;
}

function unitHTML(u, now){
  var seats = groupSeatRows(u.seats);
  var narrow = !unitHasSplit(seats);
  var body;
  if (isUnitUnfilled(seats)){
    body = '<div class="filler"><span class="dot"></span>Manning not entered yet</div>';
  } else {
    body = '';
    for (var i = 0; i < seats.length; i++) body += seatHTML(seats[i][0], seats[i][1], narrow, i + 1);
  }

  var badge = isDayStale(u.dayFlag, now) ? '<span class="daybadge mismatch">Not updated</span>' : '';

  return '<div class="unit' + (narrow ? ' narrow' : '') + '"><div class="unit-top"><span class="unit-code">' + manningEsc(unitFullName(u.unit)) + '</span>' + badge + '</div>' +
         '<div class="seats' + (narrow ? ' narrow' : '') + '">' + body + '</div></div>';
}

var UNIT_TYPE_RANK = { E: 0, T: 1, M: 2 };
function unitTypeRank(code){
  var letter = code.replace(/[0-9].*$/, '');
  return UNIT_TYPE_RANK.hasOwnProperty(letter) ? UNIT_TYPE_RANK[letter] : 9;
}
function sortUnits(units){
  return units.slice().sort(function(a, b){ return unitTypeRank(a.unit) - unitTypeRank(b.unit); });
}
function sortStations(stations){
  return stations.slice().sort(function(a, b){
    if (a.station === null) return b.station === null ? 0 : 1;
    if (b.station === null) return -1;
    return a.station - b.station;
  });
}

/* A narrow unit that ends up alone on its flex row gets .solo (see the CSS)
   so it fills the row instead of leaving a dead band of panel background
   beside it. Re-run on resize, and scoped to a container (not the whole
   document) since the rail panel and the mobile sheet can both be in the
   DOM with their own copies of the same stations. */
function fixSoloNarrowUnits(container){
  if (!container) return;
  var narrowUnits = container.querySelectorAll('.unit.narrow');
  for (var i = 0; i < narrowUnits.length; i++) narrowUnits[i].classList.remove('solo');

  var groups = container.querySelectorAll('.units');
  for (var ci = 0; ci < groups.length; ci++){
    var rows = {};
    var els = groups[ci].querySelectorAll('.unit.narrow');
    for (var ei = 0; ei < els.length; ei++){
      var rowTop = els[ei].offsetTop;
      (rows[rowTop] = rows[rowTop] || []).push(els[ei]);
    }
    for (var rowTop2 in rows){
      if (rows[rowTop2].length === 1) rows[rowTop2][0].classList.add('solo');
    }
  }
}

/* ---------------- API payload -> render-ready stations ---------------- */

/* Unit codes don't carry an explicit station number -- it's the leading
   digit(s) after the letter prefix (E1 -> station 1, M7 -> station 7). A
   code with no digit at all (a typo, or freeform text like "SPARE" in
   column A) has no real station -- null, not 0, so it doesn't collide with
   an actual "Station 0" and doesn't render as one. */
function stationOfUnit(code){
  var m = (code || '').match(/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function groupIntoStations(units){
  var map = {};
  for (var i = 0; i < units.length; i++){
    var u = units[i];
    var st = stationOfUnit(u.unit);
    var key = (st === null) ? 'unlisted' : st;
    if (!map[key]) map[key] = { station: st, units: [] };
    var seats = (u.seats || []).map(function(s){ return [s.position, s.name]; });
    map[key].units.push({ unit: u.unit, dayFlag: u.dayFlag, seats: seats });
  }
  var out = [];
  for (var k in map) out.push(map[k]);
  return out;
}

function commandRowHTML(cmd){
  if (!cmd) return '';
  var parts = ['BC', 'FIT', 'SQ1']
    .map(function(k){ return (cmd[k] || '').trim(); })
    .filter(Boolean);
  if (!parts.length) return '';
  return parts.map(function(p){ return '<span class="mp-cmd-item">' + manningEsc(p) + '</span>'; }).join('');
}

function formatAsOf(iso){
  try {
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  } catch (e) { return '—'; }
}

/* "stale" (above) only means the fetch itself failed -- it says nothing
   about whether a SUCCESSFUL fetch actually returned current data. If the
   server-side refresh trigger dies (quota exhaustion, a project edit that
   un-registers it), doGet() can keep returning HTTP 200 with an
   old-but-technically-valid payload forever, which would otherwise render
   as fully fresh. 45 min is well beyond the normal ~20 min cache window, so
   crossing it means something more than ordinary caching latency. */
var MANNING_MAX_AGE_MINUTES = 45;
function isPayloadOld(payload, now){
  var modified = new Date(payload && payload.sheetModified);
  if (isNaN(modified.getTime())) return false;
  return (now - modified) > MANNING_MAX_AGE_MINUTES * 60 * 1000;
}

/* ---------------- fetch + last-good fallback ----------------
   "Fail loud, not stale" (BFDLINK-BUILD-PLAN.md section 4b): a fetch
   failure shows the last successfully-fetched payload, explicitly labeled
   as such with its own as-of time -- never a silently-stale render that
   looks current. Cached in localStorage (not just memory) so a phone that
   opens the app with no signal still has something to show. */
function loadCachedManning(){
  try { return JSON.parse(localStorage.getItem(MANNING_CACHE_KEY)); } catch (e) { return null; }
}
function saveCachedManning(payload){
  try { localStorage.setItem(MANNING_CACHE_KEY, JSON.stringify(payload)); } catch (e) {}
}

function fetchManning(forceFresh){
  var url = MANNING_ENDPOINT + (forceFresh ? '?fresh=1' : '');
  return fetch(url).then(function(r){
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(function(payload){
    saveCachedManning(payload);
    return { payload: payload, stale: false };
  }).catch(function(err){
    var cached = loadCachedManning();
    if (cached) return { payload: cached, stale: true, error: err };
    throw err;
  });
}

/* ---------------- render into a {body, asof, cmd} target ---------------- */

function renderManningInto(target, result){
  var payload = result.payload;
  var now = new Date();

  var asofText = 'As of ' + formatAsOf(payload.sheetModified);
  target.asof.innerHTML = result.stale
    ? '<span class="mp-stale">Couldn’t refresh — showing last known, ' + manningEsc(asofText.toLowerCase()) + '</span>'
    : isPayloadOld(payload, now)
      ? '<span class="mp-stale">' + manningEsc(asofText) + ' — hasn’t updated in a while</span>'
      : manningEsc(asofText);

  var cmdHTML = commandRowHTML(payload.command);
  target.cmd.innerHTML = cmdHTML;
  target.cmd.hidden = !cmdHTML;

  var stations = sortStations(groupIntoStations(payload.units || []));
  if (!stations.length){
    target.body.innerHTML = '<div class="mp-empty">No manning data available.</div>';
    return;
  }

  var html = '';
  for (var si = 0; si < stations.length; si++){
    var st = stations[si];
    var stationLabel = (st.station === null) ? 'Unlisted' : ('Station ' + st.station);
    html += '<div class="station"><div class="station-h"><span>' + stationLabel + '</span><span class="line"></span></div><div class="units">';
    var units = sortUnits(st.units);
    for (var ui = 0; ui < units.length; ui++) html += unitHTML(units[ui], now);
    html += '</div></div>';
  }
  target.body.innerHTML = html;
  fixSoloNarrowUnits(target.body);
}

function renderManningError(target, err){
  target.asof.innerHTML = '<span class="mp-stale">Couldn’t load manning' +
    (err ? '' : '') + '.</span>';
  target.cmd.innerHTML = '';
  target.cmd.hidden = true;
  target.body.innerHTML = '<div class="mp-empty">No connection and nothing saved yet from an earlier visit.</div>';
}
