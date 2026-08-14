# BFDLink — Build Plan (v2 draft)

**Department:** Baytown Fire Department
**Working name:** BFDLink
**Sources:** `App Links.docx` (47 links), `BFD Monthly Maintenance.docx` (policy 1100.3),
`Daily Manning & Activities.csv` (one-day export)
**Status:** PLAN ONLY — nothing built. Decisions in §0, open items in §8.

---

## 0. Decisions locked

- **Rotation: 48/96, three platoons.** Anchor **Aug 11 2026 = B, day 1**, cycle
  `B B C C A A`. (Verified against Aug 12 = B/2 … Aug 16 = A/2.)
- **Desktop wide view from Phase 1**, not retrofitted.
- **Moderate color re-theme**, same structure.
- **No Command module.** Not in v1, not planned.
- **No donate link.** Decided against — see §7.
- **Both app stores sourced**, direct-open where verifiable (§3a).
- **BFD has no city WiFi** — intranet links become copy-URL tiles (§3b).
- **Shift calendars (A/B/C): link out**, view-only.
- **Manning: "current manning" only, not per-day.** Forced by the source (§4).
- **WISER is retired and must not ship** (§3a).

---

## 1. What this is

Phone-first PWA with a real desktop mode: a launcher for every app/portal a Baytown
firefighter needs, plus read-only "today" views — shift, manning, monthly maintenance.
Static files on GitHub Pages. No login, no accounts, no analytics.

---

## 2. Reuse from Pearland Fire Link

`Documents\Claude APPS\Pearland Fire Link\`:

| File | Reuse | Notes |
|---|---|---|
| `links.js` | Data swap | Schema covers every BFD case; one new flag (§3b). |
| `index.html` | Reskin + extend | Tile grid, search, pinned row, ≥1200px desktop dashboard. |
| `shift.js` | Re-anchor | ~5 lines. New constants per §0. |
| `duties.js`/`duties.html` | Adapt → maintenance | Weekday-keyed data + view. |
| `sw.js`, `manifest.json`, icons | Rebuild | Same pattern, cache-bust discipline. |
| `command.*`, `mando.*`, `roster.js`, `benchmarks.js`, `flowchart.html` | Drop | Out of scope. |

### 2a. Desktop wide view

PFD's `index.html` at `min-width:1200px`: `.wrap` becomes `420px 1fr` — left rail +
tile field — capped 1500px, going 1700px / 9 tile columns at 1600px+. Search moves
inline into the header. Phone stays single-column, 4→5→6 tiles.

**Rail contents for BFD:** Today card (date, shift letter, day of tour) · **Manning
panel** · maintenance strip (only during maintenance week). Manning in the rail is the
payoff for building desktop-first: on a phone it's a tile→popup, on desktop it's just
permanently visible. Same data, same code. Retrofitting would mean building the manning
UI twice.

### 2b. Theming

Same structure, moved palette: header/brand color, accent hues, and A/B/C shift colors
all distinct from Pearland. Driven by CSS custom properties in one block.

---

## 3. The link list

### 3a. App store sourcing — done

Both stores, verified via the iTunes lookup/search API:

| App | Android package | iOS |
|---|---|---|
| Operative IQ Front Line | `com.operativeiq.frontline` | `id1616940091` |
| Bryx Mobile | `com.bryx.bryx911` | `id813078029` |
| BFD Protocols | `com.acidremap.PPPBaytownFireDepartment` | `id981936582` |
| ArcGIS Field Maps (Pre-Plan) | `com.esri.fieldmaps` | `id1515671684` |
| MissionSquare (ICMA) | `com.icmarc.app` | `id908841242` |
| UnitedHealthcare | `com.mobile.uhc` | `id1348316600` |
| what3words | `com.what3words.android` | `id657878530` |
| IRPG (2025) | `com.irpg` | `id1562135017` |
| Pulsara | `com.pulsara.stopapps` | `id873184192` — link only |
| NREMT *(new — doc had web only)* | — | `id1300657339` |

**Notes:**
- **BFD Protocols has a public App Store listing** — unlike Pearland's, which is
  Custom-Apps-only (promo code). Baytown gets a real store link on both platforms.
- **Pulsara: confirmed dead end, do not retry.** PFD Link already tested a guessed
  scheme, checked Pulsara's `apple-app-site-association` (covers only
  `/oauth2callback/*`), and tested an Android `intent:` on a real device. Chrome refuses
  to launch a non-`BROWSABLE` activity from a web page. Plain link, `webOnly` badge.
- **WISER: retire it.** NLM discontinued WISER in **February 2023**. Installed copies
  still open but the chemical data is frozen and no longer updated. A hazmat reference
  with three-year-stale data is worse than no tile. **Replace with** PHMSA **ERG**
  (`id1597142669` / `gov.dot.phmsa.erg2`) and/or NOAA **CAMEO Chemicals**
  (`id1151912682` / `gov.noaa.cameochemical`) — both free and current.
  **Check PFD Link for the same tile.**
- **Lexipol — needs confirming (§8).** The doc's package `com.lexipol.mobile.prime` is
  Google Play's *"Lexipol KMS Mobile"* (iOS twin `id1022190091`), but the doc's web link
  `policy.lexipol.com` is *policy management*, which is **LexOne**
  (`com.lexipol.phoenix` / `id6467042230`). Two different products. Not guessing.
- **Vector/TargetSolutions and ESO:** no training/EHR app found on either store. Both
  appear web-only, matching how PFD Link treats them. Confirm (§8).

**Direct-open expectation.** The `scheme` → `store` fallback pattern is right and
already built. But a scheme must be **verified on a real device** — a wrong guess burns
~1s and can throw an "address is invalid" alert on iOS. Store IDs are sourceable
remotely; schemes are not. **Plan: ship Phase 1 with store links, then convert to
direct-open one app at a time as each is tested on a real iPhone and a real Android.**
Some will never work (Pulsara is proof) — that's the vendor's choice, not a gap.

### 3b. Intranet links — new `intranet: true` flag

BFD has no city WiFi, so these seven can **never** resolve from a phone. Grouped into a
distinct "Desktop / City Network" section; **tapping copies the URL rather than
navigating**. A link that always fails reads as a broken app.

Affected: CAD (`cobbss76prod:1914`), HR Policy Manuals (`http://cobvision...`),
Executime, IT Ticket Center, Training Request Form, Tuition Assistance, Uniform Request.
Note CAD uses a nonstandard port, and the policy manual is plain `http://` — which an
HTTPS PWA would refuse to navigate to anyway.

### 3c. Data-quality items to resolve

- `SCBA Check-ins — TBD`, `Uniform Request Form — TBD` — no URLs.
- `Monthly Maintenance Schedule — Document` → becomes the in-app view.
- `Peer Support — Document` → not provided.
- **Health Insurance and OnePass are the same URL** — likely an error.
- EAP tile embeds access code `cob123` — publishing a shared code on a public repo.

---

## 4. Manning — scoped against the real CSV

### 4a. What the source actually is

A **single snapshot overwritten in place.** Confirmed against the export:

- **No date anywhere in the sheet.** Not a log of days — one state, always "now."
- **Day 1 / Day 2 (col E) resolved (Aug 12, Nick).** It's not a date, and the earlier
  guess that it might be a station-local activity stagger was wrong. It's the **same
  Day 1 / Day 2 as the platoon rotation `shift.js` already computes** — which day of a
  crew's 48-hour tour this is. A tour runs 0700→0700; Day 1 is the first 24 hours, Day 2
  the second. Station CPTs update the dropdown themselves, typically by ~0800, to match
  whichever tour-day it actually is. **It isn't uniform across apparatus in a snapshot
  because updating it is a manual per-station action** — some CPTs get to it before
  others. That non-uniformity is the signal, not noise (§4b).

**Consequence: "click a day → that day's manning" is still not buildable** — there is
only ever one day in the source and no way to request another. **The feature stays a
single "Current Manning" tile → popup** (and the always-visible desktop rail panel).

*Possible v2:* the Apps Script could append a daily snapshot to a history tab, building
per-day history over time. That's a **write** to their Drive and a much bigger ask —
not v1, and only if admin wants it.

### 4b. Staleness — now a designed feature, not just a guardrail

With no date in the sheet, the anchor is still the **Drive last-modified timestamp**,
which the Apps Script returns. That covers the guardrail case (§4b originally):

1. **Every manning view carries "as of HH:MM."** Never render manning undated.
2. **Fail loud, not stale.** On fetch failure show last-good *explicitly labeled* with
   its timestamp, or an honest error. Never silently serve an old crew.

**⚠ SUPERSEDED (Aug 14 2026).** The `dayFlag`-comparison check described in this section
was replaced — CPTs sometimes finished updating the roster before getting to the dropdown,
producing false "Not updated" badges. It now compares each unit's actual roster
(position+name) against what it was the last time the tour day changed, computed
server-side in `manning-apps-script.gs` (not client-side as originally planned below, so
every phone agrees) so every phone sees the same answer. See that file's own comments for
the current logic. Left the original rationale below for history.

**But §4a's finding adds a second, more useful check.** Since the sheet's Day 1/Day 2
flag *should* match `shift.js`'s own computed tour-day, the app can compare the two and
flag any apparatus that's fallen behind — telling BC exactly which unit's CPT hasn't
updated yet, instead of BC having to notice on their own.

**The comparison, precisely (per Nick, Aug 12):**
- Tours turn over at **0700**, not midnight — `shift.js` computes by calendar date, so
  the "expected" day value has to shift from yesterday's tour to today's at 0700, not at
  midnight.
- CPTs typically update by **~0800**. Flagging a mismatch between 0700 and 0800 would
  flag *everyone* every single morning — that's noise, not signal. **No mismatch
  flagging before 0800.**
- After 0800, any apparatus whose `dayFlag` doesn't match the expected value gets a
  quiet "needs update" indicator — informational for BC, not an alarm.

**This logic lives client-side, in the PWA, not in the Apps Script.** The script's job
stays narrow and stable — return the raw `dayFlag` per apparatus and the sheet's
last-modified time. The 0700/0800 windowing is exactly the kind of thing we'll want to
tune after watching it run for a week; that should never require re-deploying a script
that lives in BFD's Google account. `shift.js` already has everything needed to compute
"expected day" — this is a new small comparison function alongside it, not a new data
source.

**Cheap fix still worth asking for:** one date cell at the top of the sheet. Not a
blocker either way — last-modified and the dayFlag comparison both work without it.

### 4c. Parsing rule: render faithfully, parse minimally

Column C as it really appears:

```
Taylor-A/ENG          Chaplain-OT          Najvar-TT
Garofalo (OT) AM      Henry (PM)
"Cruz (OT) AM, Kennedy PM"          <- two people, one cell, COMMA
V. Kelly (A/CPT-AM)/ Dobbins (PM)   <- two people, one cell, SLASH
Burkhalter - EMTB (24hrs)
```

Plus `Capt` vs `CPT` inconsistently, typos (`Chek ins`, `FItness`), ragged block
lengths, apparatus labels only on a block's first row (merged-cell style), and
`E7- R1385 (2556 OOS)` where OOS is load-bearing. Col F is headed "Do Not Delete This
Column" — a spreadsheet-mechanics warning, not a data label. Row 2 holds `BC:` / `FIT:`
/ `SQ1:` command slots, empty in this export.

**None of this is a defect — it's how people actually use the sheet.** Any plan that
depends on them standardizing it will fail.

So: **structure only what's reliable** — apparatus block → seat → position code, plus
the activity string and unit-number string. **Display the name cell as written.** A
firefighter reads `Cruz (OT) AM, Kennedy PM` instantly; a parser splitting
acting/OT/AM-PM into fields will be wrong the first week someone types it differently.
**Explicit v1 non-goal.**

### 4d. Mechanism — resolved (Aug 12): Option B, CMD has agreed to deploy

A static PWA cannot read a private Google Sheet. Three options were on the table:

| | **A. Publish to web** | **B. Apps Script web app** ⭐ | **C. Link out only** |
|---|---|---|---|
| How | Owner publishes sheet; app fetches CSV | Owner deploys a script reading the locked sheet, returns current manning as JSON | Tile opens the Sheet |
| Exposed | **Entire sheet, all tabs, permanently**, public URL | Current manning, fields we request | Nothing |
| Revoke | Copies already out | One click | n/a |
| Audit | None | Execution log | n/a |
| Authenticated? | No | **No** — narrow, but open | Yes (her login) |
| Normalization | In our JS, blind | **On the sheet side, fixable by its owner** | n/a |
| Owner | — | **BFD** | — |

**Recommendation: B.** Categorically smaller than A — not "publish the roster," but
"expose current staffing." BFD deploys, owns, logs, and revokes it. We host no data and
store no credentials. §4c makes this decisive: normalization belongs where the sheet's
maintainer can repair it.

**State the residual risk plainly to admin.** A web app deployed as "anyone" is an
unauthenticated URL; anyone holding it reads what it returns. Be concrete about what
that is: **roughly 40 named employees with seat assignments, activities, and unit
numbers** for the current day. Not historical, no contact info, no PII beyond names
already on a shift calendar — but it is not nothing, and it should be an explicit
decision.

**Resolved.** Nick spoke with CMD; they've agreed to deploy it. The script is written,
validated against the real sheet export, and ready to hand over — see
`manning-apps-script.gs` and the step-by-step in `MANNING-SCRIPT-DEPLOY.md`, both in the
project folder. **Blocked only on getting the deployed `/exec` URL back** — nothing else
about this phase requires further design work.

BC/FIT/SQ1 (row 2 of the sheet) also resolved — "filled out sometimes, for reference
only, just pull the positions" (Nick, Aug 12). The script reads them as a `command`
object; the app shows whichever ones are non-blank and skips the rest silently — no
special validation or staleness logic for those three, unlike the per-apparatus dayFlag.

Actual response shape (script-side, matches the deployed script exactly):
```
{ asOf, sheetModified,
  command: { BC, FIT, SQ1 },              // raw strings, "" if blank
  units: [ { unit:"E1", dayFlag:"Day 1"|null,
             radios:[…], seats:[ { position, name, activity } ] } ] }
```
`dayFlag` and per-seat `activity` are `null`, not omitted, when blank — the app can
treat "no value" consistently instead of checking for a missing key in one path and a
blank string in another.

---

## 5. Monthly Maintenance (1100.3) — easy, best value-add

**First full week of the month**, Mon–Fri, fixed assignments (Mon windows/furniture,
Tue kitchen/halls/stairs, Wed bays/mezzanine/gym, Thu apparatus, Fri restrooms/lockers).
All content in the doc, no interpretation needed.

`maintenance.js` + view answering, in order:
1. Maintenance week active? → today's assignment + full checklist.
2. Otherwise → "Next: Sep 7–11", week laid out.
3. **Shift overlay** — *"your shift covers Tuesday and Friday of maintenance week."*
   That's the reason to build it instead of linking a PDF.

"First full week" = first Mon–Fri block entirely inside the month. ~15 lines. Edge case
in §8.

Optional per-item checkboxes in `localStorage`, reset monthly. **Keep disposable** —
clearing site data for any one of these PWAs wipes all of them, so this can never be the
record of whether work got done.

---

## 6. Other views

- **Shift calendars (A/B/C):** link out, view-only. Free win: **auto-pin her own shift's
  calendar** based on today's rotation.
- **Google Forms** (SCBA Repairs/Cleaning, Radio Repair): Forms *are* frameable, unlike
  Sheets — but a domain-restricted form shows a sign-in wall inside the frame and looks
  broken. **Link out for v1**; embedding is a small change later.
- **Shift awareness:** unblocked. Today-strip, 7-day grid, calendar auto-pin,
  maintenance overlay.

---

## 7. Donate link — decided against

Considered and rejected. These apps carry department branding and are distributed
through a public agency to city employees, and Chloe works in BFD admin — a personal
payment link inside that is what municipal ethics policy exists to catch, and she'd be
the one holding the bag. Hosting is free (GitHub Pages), so there's no cost-recovery
story; it reads as a pure tip jar. Both repos are public, putting a personal payment
handle on a page tied to a fire department. And PFD Link's posture — no login, no
tracking, nothing collected — is an asset a payment ask would dent.

**Instead:** a small *"Half Edge Dev — report a bad link"* footer. Attribution, plus it
actively improves the app, since link lists rot.

---

## 8. Open questions

**Manning — resolved Aug 12, one item left:**
1. ~~What is Day 1 / Day 2 in column E?~~ **Answered** — it's tour-day, same concept
   `shift.js` already computes. See §4a.
2. ~~Admin decision on §4d~~ **Answered** — Apps Script, CMD has agreed to deploy. Only
   remaining step is getting the `/exec` URL back once they do (§4d).
3. **Can one date cell still be added** to the top of the sheet? Nice-to-have, not a
   blocker — never came up in the Aug 12 conversation, still worth asking whenever
   convenient.
4. ~~Are BC/FIT/SQ1 meant to be shown?~~ **Answered** — yes, when filled in, positions
   only, no further parsing. See §4d.
5. Is the sheet one tab for all shifts, or one per shift/station? — *(still open; hasn't
   come up, and doesn't block anything — the script reads whichever tab `SHEET_GID`
   points at.)*

**Links — resolved Aug 12:**
6. ~~Lexipol: KMS Mobile or LexOne?~~ **Answered** — correct as originally listed, web
   link only.
7. ~~Vector/TargetSolutions and ESO — web-only?~~ **Answered** — confirmed, both.
8. ~~Health Insurance / OnePass duplicate~~ **Answered and fixed** — Health Insurance
   now points at myuhc.com (also fixed a wrong Android package id found in the process);
   OnePass now points at its own app (fitness/wellness rewards, separate product).
   SCBA Check-ins, Uniform Request, and Peer Support are **still pending** — each is now
   a real tile with a `comingSoon` badge and popup rather than missing or a dead link;
   swap in the real URL/doc whenever it arrives.
9. ~~Other sheets~~ **Answered** — no others, the four already listed are all of them.

**General:**
10. **Maintenance week** — if the 1st is a Monday, is that the first full week?
    *(still open)*
11. **Distribution** — public GitHub Pages like PFD Link, or internal? **Partially
    answered** — EAP access code confirmed fine to show (already public). Public-vs
    -internal hosting itself hasn't been explicitly confirmed, but nothing since has
    pushed back on the public GitHub Pages plan.

---

## 9. Phasing

- **Phase 1 — Launcher + desktop + shift. ✅ BUILT (Aug 11 2026), refined since.**
  45 tiles (42 + 3 `comingSoon`) both stores, badges, intranet copy-tiles, search,
  favorites, offline shell, installable, ≥1200px rail, today-strip, month calendar.
  Domain: `bfdlink.halfedge.dev`.
  - **Aug 12:** re-themed from the original navy/gold to **Harbor** (navy/teal), chosen
    over an **Ember** (warm red/amber) alternative built for side-by-side comparison —
    both kept as `preview-ember.html` / `preview-harbor.html`. Tiles moved from one flat
    accent per section to a per-tile color hashed from the link's name, for more visual
    variety in the grid.
  - **Aug 12:** app icon replaced with real department-red/gold/white artwork the user
    supplied (chain-link mark + "BFD"), superseding the placeholder `make-icons.py`
    generator — see `icon-source-badge.png` if a different crop/size is ever needed.
  - **Aug 12:** added the `comingSoon` tile type (dashed border, badge, popup instead of
    a dead link) for anything BFD hasn't supplied yet, so those stay visible/discoverable
    rather than missing entirely.
  See `README.md` for what was verified at each pass.
- **Phase 2 — Monthly Maintenance.** 1100.3 + shift overlay. *Unblocked, not started.*
- **Phase 3 — Manning.** Script written and validated (`manning-apps-script.gs`),
  deployment instructions handed to CMD (`MANNING-SCRIPT-DEPLOY.md`), staleness/mismatch
  design finalized (§4b). **Blocked only on the deployed `/exec` URL coming back.** Once
  it does: current-manning tile, rail panel, freshness banner, and the Day1/Day2
  mismatch indicator are all that's left to build — no remaining design decisions.
- **Phase 4 — optional.** Embedded Forms; manning history tab (only if admin wants it).

Phases 1–2 are a complete, shippable app on their own.
