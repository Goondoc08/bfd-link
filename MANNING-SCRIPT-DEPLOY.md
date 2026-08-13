# Manning script — deployment instructions for CMD

**What this is:** a small script that lets BFDLink show the day's manning
without anyone changing how the Daily Manning sheet works. It only *reads*
the sheet. It never writes anything back, never touches formatting, never
locks anyone out of editing.

**Who owns it:** whoever deploys it. It runs under their Google account, they
can see every time it's been accessed (Apps Script keeps a log), and they can
kill it in one click if that's ever wanted — no need to loop us in either way.

**What it hands out, precisely:** for each apparatus — the seats (position +
name, exactly as typed on the sheet), each seat's listed activity if any, the
unit's radio numbers if any, and the "Day 1 / Day 2" flag as typed. Plus
BC/FIT/SQ1 if those are filled in, and a timestamp of when the sheet was last
edited. Nothing else. No other tabs, no edit history, no formulas.

**How often it actually reads the sheet:** not every time someone's phone
asks. The script reads the sheet on its own schedule (every 15 minutes, via
a trigger set up once — step 12 below) and hands every phone the same cached
copy in between. That keeps it cheap no matter how many people have the app
open at once — the cost doesn't grow with how many phones are asking, only
with how often the schedule itself runs, and 15 minutes is nowhere close to
any usage limit. Someone tapping a manual refresh in the app can still force
a same-second live read when they specifically want it.

**The one thing worth saying plainly:** once deployed this way, the link
that it returns data to is not behind a login — anyone who has the exact URL
can read what it returns. It's narrow (just today's manning, not the whole
sheet) and it's revocable, but it isn't nothing. If that's not comfortable,
BFDLink just keeps linking straight to the sheet instead — nothing else in
the app depends on this.

---

## Deploy steps

1. Open the **Daily Manning & Activities** Google Sheet.
2. Menu bar: **Extensions → Apps Script**. A new tab opens, empty editor.
3. Delete whatever's in `Code.gs` (probably just `function myFunction() {}`).
4. Paste in the contents of **`manning-apps-script.gs`** (in this same
   folder) — the whole file, nothing needs editing first.
5. Click the disk icon (or Ctrl+S) to save. Name the project anything —
   "BFDLink manning" is fine.
6. Top right: **Deploy → New deployment**.
7. Click the gear icon next to "Select type" → choose **Web app**.
8. Fill in:
   - Description: `BFDLink manning read`
   - Execute as: **Me**
   - Who has access: **Anyone**
     *(This has to be "Anyone," not "Anyone with a Google account" — the app
     itself isn't signed in to anything, it's just fetching a URL.)*
9. Click **Deploy**.
10. Google will show an "authorize" prompt — this is normal for any new
    script, not a warning about this one specifically. Click through:
    **Authorize access → pick your account → Advanced → Go to (project
    name), unsafe → Allow.** ("Unsafe" here just means Google hasn't
    manually reviewed this script — it's not a signal anything is wrong.)
11. After it deploys, you'll see a **Web app URL** ending in `/exec`. Copy
    that whole thing.
12. Back in the Apps Script editor, one more one-time step: at the top where
    it says **Select function**, choose **`setupTrigger`** from the
    dropdown, then click **Run** (▶). This is what turns on the every-15-
    minute schedule mentioned above — without it, the script still works,
    it just re-reads the sheet on every single request instead of using the
    schedule. You'll get the same authorize prompt as step 10 the first
    time; same deal, click through it. **Run this once — running it again
    later is harmless** (it clears out the old schedule before creating a
    new one, so it won't end up with duplicates), but it never needs to be
    run again unless the deployment gets rebuilt from scratch.

## What to send back

Just that one URL from step 11. Nothing else needed.

## If it ever needs to change

- **Sheet gets a new tab / different name:** update the `SHEET_GID` constant
  near the top of the script (Extensions → Apps Script → edit → redeploy
  as a **new version** of the same deployment, not a whole new deployment).
- **Want to shut it off:** Deploy → Manage deployments → find it → Archive.
  The URL stops working immediately.
- **Sheet's column layout changes** (someone reorders A–F): the script will
  need a matching update on our end — just let us know what changed.
- **Want the refresh schedule tighter or looser than 15 minutes:** change the
  `REFRESH_MINUTES` constant near the top (only 1, 5, 10, 15, or 30 are valid
  — Apps Script doesn't allow arbitrary values there), save, then re-run
  `setupTrigger` once the same way as step 12 so the new interval actually
  takes effect. Cost-wise any of those values is fine; it's purely about how
  fresh you want the ambient view to be.
