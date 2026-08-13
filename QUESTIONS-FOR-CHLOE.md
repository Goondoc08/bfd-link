# BFDLink — Questions for Chloe

Most of the original list is answered as of Aug 12 — see below. What's left is short.

---

## Still open

1. **SCBA Check-ins URL, Uniform Request Form URL, Peer Support document** — still
   tracking these down. Not blocking anything: each is a real tile in the app now with a
   "Coming Soon" badge, so people can see it's on the way rather than it just being
   missing. Drop in the real URL/doc whenever it lands.

2. **One date cell at the top of the manning sheet?** Still a nice-to-have, never came
   up in the Aug 12 conversation. Not a blocker — the app already gets a timestamp from
   Google Drive's own "last edited" info — but one cell would make it exact instead of
   inferred.

3. **Is the Daily Manning sheet one tab for everything, or one tab per shift/station?**
   Hasn't come up. Doesn't block anything — the manning script just reads whichever tab
   it's pointed at — but good to know before it's deployed rather than after.

4. **Maintenance week edge case:** if the 1st of the month is a Monday, is that the
   first full week, or does the following Monday count instead?

5. **iPhone or Android?** Doesn't change anything about the build — both are already
   supported — just tells me which one to have you test first once there's something
   worth testing.

---

## Resolved Aug 12 (kept for the record)

- **Manning Day 1 / Day 2** — it's tour-day (same concept the app's shift rotation
  already computes), not a date. CPTs update it manually, ~0800 typically, which is why
  it isn't always uniform across apparatus in a given moment.
- **Manning permission** — CMD has agreed to deploy the read-only Apps Script. Script
  and deployment instructions are done; just waiting on the URL back.
- **BC/FIT/SQ1** — show them when filled in, positions only, no further parsing needed.
- **Lexipol** — confirmed correct as originally listed.
- **Vector Solutions and ESO** — confirmed web-only, no app.
- **Health Insurance** — now points at myuhc.com (also caught and fixed a wrong Android
  package id in the process).
- **OnePass** — now points at its own app (separate from Health Insurance — UHC's
  fitness/wellness rewards program, not the main plan app).
- **Other sheets** — none; the four already in the app are all of them.
- **EAP access code** — confirmed fine to show, already public elsewhere.
- **WISER** — confirmed removed in favor of ERG + CAMEO Chemicals; both re-verified
  correct on both app stores.
