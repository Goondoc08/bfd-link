/* ============================================================
   BFDLink — Daily Manning read-only endpoint
   ------------------------------------------------------------
   Deployed and owned by BFD (CMD), not by Half Edge Dev. This script only
   READS the sheet — it never writes anything back — and only returns the
   fields listed below. Revoking access is one click: Deploy > Manage
   deployments > Archive.

   WHAT IT RETURNS (nothing else):
     - each apparatus's current seats (position + name, as typed)
     - each seat's listed activity, if any
     - each apparatus's radio/unit numbers, if any
     - the "Day 1 / Day 2" flag as typed on the sheet
     - BC / FIT / SQ1 command-slot notes, if filled in
     - when the sheet was last edited (for the app's "as of" / stale check)

   It does NOT parse OT/AM/PM/acting notes out of names — those stay exactly
   as typed on the sheet, because that free-text is how station CPTs actually
   use it (see BFDLINK-BUILD-PLAN.md section 4c for why that's deliberate).

   CACHING (added Aug 2026) -- why this exists:
   Without it, every device's request re-reads and re-parses the whole
   sheet. That's cheap for one device, but cost scales with (devices x
   poll frequency), and with ~40 people all polling, that adds up against
   Apps Script's daily execution-time quota fast. So the actual sheet read
   only happens on a fixed schedule (REFRESH_MINUTES, via a time-driven
   trigger someone sets up once -- see setupTrigger() below and
   MANNING-SCRIPT-DEPLOY.md). Every device request just reads that cached
   result: fast, and its cost no longer depends on how many devices ask or
   how often. Pass ?fresh=1 to force a live read instead of the cache --
   that's what a manual "refresh" tap in the app should use, so someone
   checking "is it done yet" right after 0800 isn't stuck waiting up to
   REFRESH_MINUTES for a stale cache to catch up.
   ============================================================ */

// Change this if the tab ever gets renamed or the sheet's gid changes.
// Current value matches the "Daily Manning & Activities" tab as of Aug 2026.
const SHEET_GID = 1220561888;

// Row (1-indexed) where apparatus data starts. In the sheet as of Aug 2026,
// row 4 is the "Apparatus:" label, so data begins at row 5. If someone adds
// or removes a row above the data, update this one number — nothing else
// needs to change.
const FIRST_DATA_ROW = 5;

// How often the scheduled trigger re-reads the sheet. Apps Script only
// supports fixed values here: 1, 5, 10, 15, or 30 (minutes), or hourly/
// daily. Set to 10 (Aug 2026) -- tighter than the 15 first discussed,
// specifically so the manual "fresh" refresh (below) has less reason to
// get hammered: the ambient cache is already fairly current, so someone
// checking "is it done yet" is less likely to feel the need to bypass it.
// Adjust freely; even 1 minute costs under an hour of runtime per day,
// since cost no longer scales with device count. Must match whatever's
// passed to .everyMinutes() in setupTrigger() below if you change it.
const REFRESH_MINUTES = 10;

// CacheService's own ceiling is 6 hours (21600s); this just has to safely
// outlast one refresh interval so a slightly-late trigger run doesn't
// leave doGet() with nothing to serve. Not the thing controlling how
// often the sheet actually gets read -- that's the trigger's job.
const CACHE_TTL_SECONDS = (REFRESH_MINUTES + 10) * 60;
const CACHE_KEY = 'bfdlink_manning_payload_v1';

// Separate from CACHE_KEY: holds the last payload that was built without
// error, at CacheService's own ceiling (6h). If the sheet read starts
// throwing (bad ID, revoked permission, structural change), doGet() falls
// back to this instead of returning Apps Script's default HTML error page.
const LAST_GOOD_KEY = 'bfdlink_manning_last_good_v1';
const LAST_GOOD_TTL_SECONDS = 21600;

// The fresh=1 bypass has no rate limit -- it's available to anyone with the
// URL, same as every other endpoint here. That's an accepted, known gap for
// now (Aug 2026): the 10-minute schedule above keeps ambient staleness low
// enough that there's less reason for anyone to reach for it, which is the
// current mitigation. If manual refreshes ever get hammered in practice,
// the cheap fix is a second short-TTL cache key here (e.g. "don't allow a
// forced live read more than once every 30s, serve the regular cache to
// anyone who asks sooner") -- not built now since it isn't needed yet.
function doGet(e) {
  const forceFresh = e && e.parameter && e.parameter.fresh;
  const cache = CacheService.getScriptCache();

  if (!forceFresh) {
    const cached = cache.get(CACHE_KEY);
    if (cached) {
      return ContentService.createTextOutput(cached).setMimeType(ContentService.MimeType.JSON);
    }
  }

  // No cache yet (first request ever, or trigger hasn't run since deploy),
  // or a caller explicitly asked to bypass it -- read live, and repopulate
  // the cache with what we just read so the NEXT request (even a normal
  // one) gets the fast path instead of also falling through to a live read.
  try {
    const json = buildPayload();
    cache.put(CACHE_KEY, json, CACHE_TTL_SECONDS);
    cache.put(LAST_GOOD_KEY, json, LAST_GOOD_TTL_SECONDS);
    return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    // Sheet/Drive read failed (bad ID, revoked permission, structural
    // change). Without this catch, Apps Script would return its default
    // HTML error trace with HTTP 200 -- valid-looking to the client's
    // r.ok check, but not JSON, and this would repeat on every request
    // until someone notices and fixes the sheet. Serve the last payload
    // that built successfully instead, if there is one.
    const lastGood = cache.get(LAST_GOOD_KEY);
    if (lastGood) {
      return ContentService.createTextOutput(lastGood).setMimeType(ContentService.MimeType.JSON);
    }
    const fallback = JSON.stringify({
      asOf: new Date().toISOString(),
      sheetModified: null,
      command: { BC: '', FIT: '', SQ1: '' },
      units: [],
      error: String(err)
    });
    return ContentService.createTextOutput(fallback).setMimeType(ContentService.MimeType.JSON);
  }
}

/* Called only by the time-driven trigger (see setupTrigger()) -- reads the
   sheet and refreshes the cache on schedule, so ordinary doGet() calls
   from devices almost never need to do the expensive read themselves. */
function refreshManningCache() {
  const cache = CacheService.getScriptCache();
  try {
    const json = buildPayload();
    cache.put(CACHE_KEY, json, CACHE_TTL_SECONDS);
    cache.put(LAST_GOOD_KEY, json, LAST_GOOD_TTL_SECONDS);
  } catch (err) {
    // Leave the existing cache entries alone -- a transient failure here
    // shouldn't wipe out the last good read. doGet() will retry live once
    // CACHE_TTL_SECONDS lapses, or fall back to LAST_GOOD_KEY if that also fails.
    Logger.log('refreshManningCache failed: ' + err);
  }
}

function buildPayload() {
  const ss = SpreadsheetApp.openById('1k3JfoW4H_4Lgq48PVJMfRHFbKMjRuYFboKKwMRzQ8g0');
  const sheet = findSheetByGid(ss, SHEET_GID) || ss.getSheets()[0];
  const values = sheet.getDataRange().getValues();

  const command = readCommandRow(values);
  const units = parseUnits(values);

  const file = DriveApp.getFileById(ss.getId());
  const payload = {
    asOf: new Date().toISOString(),
    sheetModified: file.getLastUpdated().toISOString(),
    command: command,
    units: units
  };
  return JSON.stringify(payload);
}

/* Run this ONCE, by hand, from the Apps Script editor after deploying (see
   MANNING-SCRIPT-DEPLOY.md) -- it registers the recurring trigger that
   calls refreshManningCache() every REFRESH_MINUTES. It does NOT need to
   run again after that; re-running it would just stack up duplicate
   triggers, so removeExistingTriggers() guards against that. */
function setupTrigger() {
  removeExistingTriggers();
  ScriptApp.newTrigger('refreshManningCache')
    .timeBased()
    .everyMinutes(REFRESH_MINUTES)
    .create();
  refreshManningCache();   // populate the cache immediately, don't wait for the first tick
}

function removeExistingTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === 'refreshManningCache') {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }
}

function findSheetByGid(ss, gid) {
  const sheets = ss.getSheets();
  for (let i = 0; i < sheets.length; i++) {
    if (sheets[i].getSheetId() === gid) return sheets[i];
  }
  return null;
}

/* BC:/FIT:/SQ1: live in one freeform cell each (e.g. a CPT types "BC: Smith"
   directly into the cell — there's no separate label/value column split).
   Scan the first few rows for cells starting with one of those three labels
   and return the raw cell text as typed. Blank ("BC: " with nothing after)
   comes back as an empty string — the app skips those rather than showing a
   label with nothing next to it. */
function readCommandRow(values) {
  const out = { BC: '', FIT: '', SQ1: '' };
  // Only scan the rows above FIRST_DATA_ROW -- everything from there on is
  // real apparatus data, not command-slot notes. Derived from FIRST_DATA_ROW
  // (not a separate literal) so the two can't drift out of sync.
  const scanRows = Math.min(values.length, FIRST_DATA_ROW - 1);
  for (let r = 0; r < scanRows; r++) {
    for (let c = 0; c < values[r].length; c++) {
      const cell = String(values[r][c] || '').trim();
      ['BC', 'FIT', 'SQ1'].forEach(function (label) {
        // \b after the label keeps this from matching a cell that merely
        // STARTS WITH the label's letters (e.g. a name "Fitzgerald", or a
        // unit code "BC1") -- it still matches "BC: Smith" or "BC Smith".
        if (new RegExp('^' + label + '\\b:?\\s*', 'i').test(cell)) {
          const rest = cell.replace(new RegExp('^' + label + '\\b:?\\s*', 'i'), '').trim();
          if (rest) out[label] = cell;
        }
      });
    }
  }
  return out;
}

/* Column layout (A-F), matching the sheet as of Aug 2026:
     A: unit code (e.g. "E1") — set only on a block's first row
     B: position (Capt/CPT/ENG/FF/STU)
     C: name — freeform, may include OT/acting/AM-PM notes, left as typed
     D: activity — freeform, may be blank
     E: "Day 1" / "Day 2" — set only on a block's first row
     F: radio/unit number — freeform, may appear on any row in the block

   A new unit block starts whenever column A has a value; every row after
   that with a blank column A belongs to the same block, until the next
   non-blank column A (or the sheet ends). This mirrors how the sheet is
   actually laid out — no blank separator rows between units. */
function parseUnits(values) {
  const units = [];
  let current = null;

  for (let r = FIRST_DATA_ROW - 1; r < values.length; r++) {
    const row = values[r];
    const unitCode = String(row[0] || '').trim();
    const position = String(row[1] || '').trim();
    const name = String(row[2] || '').trim();
    const activity = String(row[3] || '').trim();
    const dayFlag = String(row[4] || '').trim();
    const radio = String(row[5] || '').trim();

    if (unitCode) {
      current = { unit: unitCode, dayFlag: dayFlag || null, radios: [], seats: [] };
      units.push(current);
    }
    if (!current) continue;   // stray content before the first real unit row

    if (radio) current.radios.push(radio);
    if (position || name) {
      current.seats.push({
        position: position || null,
        name: name || null,
        activity: activity || null
      });
    }
  }
  return units;
}
