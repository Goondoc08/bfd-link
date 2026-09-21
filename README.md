# BFDLink

Unofficial quick-link launcher and shift calendar for **Baytown Fire Department**.
Static PWA — no backend, no accounts, no analytics, nothing collected.

**Live:** https://bfdlink.halfedge.dev
**Plan:** `BFDLINK-BUILD-PLAN.md` · **Open questions:** `QUESTIONS-FOR-CHLOE.md`

---

## Status — Phase 1 complete

| | |
|---|---|
| ✅ Phase 1 | Launcher, search, favorites, shift calendar, desktop dashboard, offline, installable |
| ⬜ Phase 2 | Monthly Maintenance (policy 1100.3) — unblocked, next up |
| ⬜ Phase 3 | Daily manning — **blocked** on a department decision (plan §4) |

---

## Files

| File | What it is |
|---|---|
| `links.js` | **The only file you need to edit to add or fix a link.** Heavily commented. |
| `index.html` | Everything else — layout, tiles, search, calendar, install/share |
| `shift.js` | 48/96 rotation. Anchor: **Aug 11 2026 = B, day 1**, cycle `B B C C A A` |
| `payroll.js` | Pay periods (14-day, 120/120/96hr cycle per shift) + the last-shift-of-period reminder trigger. Added Sep 21 2026 — see `BFDLINK-BUILD-PLAN.md` §10 for the derivation |
| `sw.js` | Service worker. **Bump `CACHE` every deploy** or phones keep the old links |
| `icon-source-badge.png` | Rounded-square icon artwork (red/gold/white, chain-link + "BFD"), user-supplied (Aug 14 redesign). Source of truth for every **non-maskable** icon — `icon-64/180/192.png`, `icon-512.png`, `favicon-32.png` |
| `icon-source-badge-round.png` | Circular version of the same artwork, user-supplied (Aug 14). Source of truth for `icon-maskable-512.png` specifically — full-bleed round content sidesteps the corner-clipping issue a square badge has under an aggressive circular OS mask |
| `icon-source-badge-original.png` | Backup of the very first artwork supplied (Aug 11), before either the Aug 12 link-glyph resize or the Aug 14 full redesign. Historical only, not used to generate anything current |
| `icon-64.png` | Pre-downsampled small icon for the header/sheets. **Don't delete** — see "Things that will bite you" |
| `make-icons.py` | **Retired, do not run.** Old programmatic placeholder, superseded by the real artwork above |
| `.dev-server.py` | Local preview with no-cache headers. Not deployed |

## Run it locally

```bash
python .dev-server.py 8137
```

Then open http://localhost:8137. Plain `python -m http.server` will serve stale
files from the browser's disk cache while you edit — use the script.

---

## Deploying

1. Push to the repo's default branch.
2. GitHub Pages → deploy from that branch, root.
3. The `CNAME` file (already committed) claims `bfdlink.halfedge.dev`.
4. DNS at the `halfedge.dev` registrar — one record:

   | Type | Name | Value |
   |---|---|---|
   | CNAME | `bfdlink` | `<github-username>.github.io` |

   Point it at the **`github.io` host**, not the repo path and not an IP.
5. In Pages settings, wait for the DNS check to pass, then tick **Enforce HTTPS**.
   The certificate can take a few minutes; until it's issued you'll see a warning.

**Every deploy: bump `CACHE` in `sw.js`** (`bfdlink-v1` → `v2` → …). The service
worker is network-first so it usually self-heals, but the version bump is what
guarantees an installed phone drops the old shell.

---

## Things that will bite you

**Bump the service worker version.** See above. This is the single most common
way a "fix" fails to reach anyone's phone.

**Don't add an app `scheme` you haven't tested on a real device.** A wrong one
wastes ~1s before falling back and can throw an "address is invalid" alert on
iOS. Every app tile currently ships as a store link on purpose — store IDs are
verifiable remotely, schemes are not. Convert them one at a time as each app is
tested on an actual iPhone and an actual Android. Some apps can't be opened from
a web page at all (see the Pulsara note in `links.js` — that one is settled, don't
re-litigate it).

**Testing tile-name truncation:** do **not** use `scrollHeight > clientHeight`.
Sub-pixel line-height rounding makes `scrollHeight` overshoot by ~1px per line,
so that test flags every tile as clipped and is worthless — it produced a false
"22 of 42 names are clipped" during the build. Compare against the unclamped
height instead; the working snippet is in the `.tiles` comment in `index.html`.

**localStorage is shared across all these PWAs.** Clearing site data for any one
of them wipes favorites here *and* everything in the other apps on the same
origin family. Never suggest a "clear site data" fix casually.

**City Network tiles copy instead of navigating.** Baytown has no station WiFi,
so those pages can't load on a phone on any connection. That behavior is
deliberate — see the `intranet` flag in `links.js`.

**Don't let the browser shrink a detailed icon by more than ~3x at runtime.**
The header brandmark and the two sheet icons use `icon-64.png`, not
`icon-192.png` — pointing them at the 192px asset produced visible dark
speckling at the ring's corners once the browser scaled it down to the ~26px
CSS box (a ~7x shrink of a fine metallic gradient).

**Regenerating any icon from a master? Two steps, not one — both matter.**
(Learned twice: partially fixed Aug 12, the gap that caused finally closed
Aug 14.) Pillow's plain `Image.resize()` on RGBA doesn't premultiply alpha
first, so hidden RGB under fully-transparent source pixels can bleed into
visible edges on a big downscale — premultiply, resize, then divide back out.
**That alone isn't enough**: the premultiply/unpremultiply round trip still
leaves pure black `(0,0,0,0)` at any output pixel that lands at true
alpha=0 (0 × anything = 0), and a renderer that doesn't respect premultiplied
alpha will sample that raw black. After resizing, explicitly overwrite every
`alpha==0` pixel with the badge's own visible color (keeping alpha at 0).
Current implementation: git history around Aug 14.

**The icon composition changed Aug 14** — new user-supplied artwork
(`icon-source-badge.png` rounded-square, `icon-source-badge-round.png`
circular) replaced the Aug 11/12 original, with the badge content filling
noticeably more of the frame. The old "BFD text is at its geometric maximum"
measurement no longer applies to this artwork — re-measure before relying on
it if the balance ever needs revisiting again.

---

## Verified during the Phase 1 build

- Rotation matches all seven supplied dates (Aug 11 B/1 → Aug 17 B/1), and runs
  correctly backwards.
- Layout clean at 375 / 480 / 680 / 1200 / 1600px: no name truncation, no
  name-vs-badge collision, no horizontal overflow.
- Favorites persist and re-render; starring doesn't trigger the tile's link.
- Search matches names *and* the hidden `desc` field ("hazmat" → ERG, CAMEO).
- City Network tiles cancel navigation and copy.
- Service worker registers and activates; no console errors.

**Not yet verified — needs a real phone:** whether the clipboard copy lands on
first tap. Automated clicks can't grant the user activation the clipboard API
requires, so both copy paths correctly reported failure in testing. There's an
`execCommand` fallback behind the modern API, but confirm on an actual device.

---

## Unofficial

Not created, endorsed, or maintained by the City of Baytown or Baytown Fire
Department. Every tile links out to the official source — nothing is hosted or
copied here.
