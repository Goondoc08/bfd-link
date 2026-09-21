/* ============================================================
   PAY PERIODS — Baytown Fire Department
   ------------------------------------------------------------
   14-day cycles. Anchor is the period START implied by the pay-period-END
   date BFD gave us (Sun Sep 20 2026) -- 13 days earlier, Mon Sep 7 2026.

   The 120/120/96-hour repeating pattern (one shift draws the 96hr period
   every 3-period/42-day cycle, phase-offset per shift) is NOT hand-entered
   from a payroll document the way PFD Link's version was -- it's the
   mechanical result of running shift.js's own rotation math against this
   anchor: a 6-day (2-on/4-off) cycle against a 14-day pay period always
   produces exactly this pattern, confirmed by walking the rotation day by
   day for several periods before committing to PAY_SHIFT_PHASE below (see
   BFDLINK-BUILD-PLAN.md for the worked table). Sanity-check against a real
   BFD pay stub if one ever contradicts this.
   ============================================================ */
const PAY_DAY = 86400000;
const PAY_ANCHOR = Date.UTC(2026, 8, 7);        // Mon Sep 7 2026 = period start
const PAY_HOURS_CYCLE = [120, 120, 96];
const PAY_SHIFT_PHASE = { A: 0, B: 2, C: 1 };   // derived -- see BFDLINK-BUILD-PLAN.md

/* { hours, dayOf (0-13), isStart, isEnd } for a UTC-midnight ms and a
   shift letter ('A'|'B'|'C'). */
function payPeriodInfo(ms, shift){
  const diffDays = Math.round((ms - PAY_ANCHOR) / PAY_DAY);
  const idx = Math.floor(diffDays / 14);
  const dayOf = ((diffDays % 14) + 14) % 14;
  const phase = PAY_SHIFT_PHASE[shift] || 0;
  const hours = PAY_HOURS_CYCLE[(((idx + phase) % 3) + 3) % 3];
  return { hours, dayOf, isStart: dayOf === 0, isEnd: dayOf === 13 };
}

/* UTC-midnight ms of the start of the 14-day pay period containing ms. */
function payPeriodStart(ms){
  const diffDays = Math.round((ms - PAY_ANCHOR) / PAY_DAY);
  const idx = Math.floor(diffDays / 14);
  return PAY_ANCHOR + idx * 14 * PAY_DAY;
}

/* First day (UTC-midnight ms) of the LAST on-duty tour that *starts*
   within the pay period beginning at periodStartMs, for the given shift.
   That tour's second day can land in the NEXT period -- a real, confirmed
   case (14 mod 6 != 0, so tours don't always align to period boundaries)
   -- it's still the right trigger day: "this is your last shift touching
   this pay period." Returns null only if the shift has zero on-days that
   period, which shouldn't happen given the 96/120-hour cycle always has
   at least 4. */
function lastTourStartInPeriod(shift, periodStartMs){
  let lastStart = null;
  for (let dayOf = 0; dayOf <= 13; dayOf++){
    const ms = periodStartMs + dayOf * PAY_DAY;
    const d = new Date(ms);
    const onToday = shiftFor(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).letter === shift;
    if (!onToday) continue;
    const pd = new Date(ms - PAY_DAY);
    const onYesterday = shiftFor(pd.getUTCFullYear(), pd.getUTCMonth(), pd.getUTCDate()).letter === shift;
    if (!onYesterday) lastStart = ms;   // dayOf starts a new tour
  }
  return lastStart;
}
