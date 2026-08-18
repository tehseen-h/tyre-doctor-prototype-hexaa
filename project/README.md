# TD One — Workshop (Phase 1: design build)

An interactive prototype of one place where a mining tyre or rim repair lives, from the mine site to dispatch. Front end only — no backend, no network calls, no auth.

Open **`TD One - Landing.dc.html`** in a browser. Everything is reachable by clicking from there; there is no install step. Checked at 1280×800; the field screens are phone width.

## The click path for the call

1. **Landing** — `TD One - Landing.dc.html` → *Open the workshop*.
2. **Who are you** — role and branch picker, Mackay preselected. Choose *Workshop supervisor*.
3. **Branch Console** — Needs a person sits at the top; below it the floor as wide bay strips, the cook oven with live countdowns, Ready to go out, the rim bays and the rim hours dials.
   - *Show me around* runs the 5-step tour.
   - Tap *Mark received* on a tyre in **On the way** and it rolls across into the wash bay, with a 5-second undo.
   - Type `EST-10482` or `BR7K48219` in the search, or press `/`. Type a serial that isn't there for the no-results state and the all-branches fallback.
   - Switch the branch to **Leeton** for the loading tyre and then the empty floor.
   - *See what sales gets told* opens the email preview.
4. **Job File** — from any tyre. The header band, the quote ribbon with the photo that caused the revision, the story of the repair stage by stage, the cook record, what we measured, the casing's previous jobs. 4-step tour.
   - *Advance this tyre* opens the stage drawer: blocked state, live timer or typed duration, supervisor override with a logged reason, then an undo toast.
   - *Flag worse than quoted* opens **Needs a decision**.
   - *Build the job report* opens the print sheet.
5. **Field** — `TD One - Field.dc.html`. Visit details → the capture loop (three camera tiles, determinate sending, the weak-signal queue, *Save and next tyre* blocked until the captures are there) → visit summary, 6 tyres, 5 repairable, 1 rejected → *Send to sales*.
6. **Rim** — `TD One - Rim.dc.html`. Drop the list (or *Type them in*) → row-by-row read → review and fix, five held rows in the hazard treatment with the reason at the offending cell → **18 rows in → 13 jobs created → 5 held**. 3-step tour.
   - *NDT bay*: the rim plan view with pinned cracks, method, technician, competency unit, pass or fail.
   - *Certificates*: both numbered certificates with the `PLACEHOLDER TEMPLATE` watermark, and *Print or save*.
7. **Branch Performance** — `TD One - Branch Performance.dc.html`, linked from the console header and from the role picker. Headline figures, repair mix per branch, man hours against repair hours (Mackay 1,200 h against 600 h), average time in each stage, the full branch table. *Open man-hours entry* reveals the manual input. 2-step tour.
8. **Customer Tracker** — `TD One - Customer Tracker.dc.html`. Received → being prepared → cooking → boxed up → dispatched, plain sentences, curated photos, certificates as documents you can open.

## Files

```
TD One - Landing.dc.html              landing page
TD One - Who are you.dc.html          role and branch picker (replaces a login)
TD One - Branch Console.dc.html       needs-a-person band, floor bays, oven, rim dials, search, empty state, tour, email preview
TD One - Field.dc.html                site visit, tyre capture, visit summary  (phone width)
TD One - Job File.dc.html             job file, the story of the repair, quote ribbon, stage drawer, escalation, job report
TD One - Rim.dc.html                  rim intake, NDT bay, certificates
TD One - Branch Performance.dc.html   cross-branch reporting
TD One - Customer Tracker.dc.html     external customer view

src/types.js                          domain types — Branch, Customer, Site, Asset, Job, SiteVisit, StageEvent,
                                      Photo, QuoteRef, RimFinding, Certificate, BranchReport, IntakeRow
src/config/stages.js                  the two rails: label, actor, required captures, notification, bay
src/config/rules.js                   every threshold with the source string its tooltip shows
src/fixtures.js                       the canonical fixture set, typed against src/types.js

DESIGN.md                             the TD One design system: palette with AA pairings, type, cards, motion, one line per decision
screenshots/                          the review set
```

## For Phase 2

- Screens are presentational. Business rules live in `src/config/*`; the fixture set lives in `src/fixtures.js`.
- Stage order is never invented by a screen — it comes from `src/config/stages.js`. Turning that table into the state machine is the Phase 2 job.
- Thresholds and their "where does this come from" strings live together in `src/config/rules.js`, so the tooltips cannot drift from the rules.
- The Branch Console and the Job File **seed their board and their stage spine from a literal at the top of the logic class**, so the demo paints on the first frame instead of waiting on a module load; the console also imports `src/fixtures.js` and takes it over when it resolves. Phase 2 deletes the seed and keeps the import.
- Search for `// PHASE 2:` for everything faked: spreadsheet parsing, cook countdowns, photo capture and upload, the branch-switch settle, undo, search.
- One token set (`--td-*`) is declared in each file's `<style>` block. If it moves to a shared stylesheet, change it in one place and nothing else needs to move.

## Known scope boundaries (deliberate)

No prices anywhere. No integration claims — the quote number is a typed field. No AI features or language. No on-site fleet inspection module. No login, settings, user admin or dark mode. Certificates are watermarked `PLACEHOLDER TEMPLATE`. Nothing is labelled sample, demo or example. Customers are invented; branch names, tyre sizes and makes are real.

Real cross-branch search, the append-only event engine, real parsing and `aria-live` orchestration are intentionally not built — the screens that will drive them are.
