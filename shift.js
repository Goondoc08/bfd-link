/* ============================================================
   SHIFT ROTATION — Baytown Fire Department
   ------------------------------------------------------------
   3 platoons, 48/96 (2 days on, 4 off) = 6-day cycle: B B C C A A

   Anchor: Tue Aug 11 2026 = B shift, day 1 of 2.
   Confirmed against: Aug 12 = B/2, Aug 13 = C/1, Aug 14 = C/2,
                      Aug 15 = A/1, Aug 16 = A/2.

   If the department ever re-anchors the rotation, this file is the only
   thing that needs to change.
   ============================================================ */
const ANCHOR = Date.UTC(2026, 7, 11);   // months are 0-indexed: 7 = August
const CYCLE  = ['B','B','C','C','A','A'];

function shiftFor(y, m, d){
  const days = Math.round((Date.UTC(y, m, d) - ANCHOR) / 86400000);
  const i = ((days % 6) + 6) % 6;
  return { letter: CYCLE[i], dayOf: (i % 2) + 1 };
}

/* Convenience: shift info for a JS Date (defaults to today). */
function shiftForDate(dt){
  dt = dt || new Date();
  return shiftFor(dt.getFullYear(), dt.getMonth(), dt.getDate());
}
