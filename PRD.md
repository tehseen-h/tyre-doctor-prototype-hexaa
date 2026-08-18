# PRD — TD One (Workshop) · prototype for Tyre Doctor

**Version 1.0 · the complete requirement.** `CLAUDE.md` holds the standing rules; this document holds the detail, the milestones and the acceptance criteria. Read both fully before writing code.

There is **no further input available from the human.** Anything not answered here is yours to decide — decide it, log it in `DECISIONS.md`, and continue.

---

## 1. Why this exists

Tyre Doctor is a second-generation, family-owned Australian business servicing **mining and earthmoving tyres and rims** — the giant tyres on haul trucks, loaders and dozers. One tyre weighs about **six tonnes** and is worth serious money, which is why mines pay specialists to repair rather than replace them. Eight workshop branches sit near the mining regions: Brisbane, Blackwater, Cobar, Kalgoorlie, Leeton (head office), Mackay, Muswellbrook, West Wyalong.

Two service lines matter:

1. **Tyre repair.** A damaged tyre reaches a workshop, is washed, inspected, the damaged section is **cut out**, **filled** with rubber, then **cooked** (hot vulcanising — heat-curing the repair). Cook duration is a recorded quality parameter.
2. **Rim NDT.** Rims are safety-critical steel; a cracked rim under pressure can fail explosively. Mines return rims at roughly **10,000 machine hours** for **NDT** crack testing. A clean rim gets **BTP** — "blast, test, paint", the cheap base service. A cracked rim is cut, welded or has sections replaced. Every rim leaves with two certificates and earns another ~10,000 hours.

### The problem

Today one job's information lives in **four places**: a Smartsheet row, photos in a WhatsApp thread keyed by quote number, a **photographed handwritten paper sheet** carrying the repair description, and the quote in NetSuite. Consequences, in the client's words:

- *"At the moment it's going into four different things and we're pulling it together at the end."*
- The mine phones sales asking **"where's my tyre?"**; sales phones the workshop to find out.
- The operations superintendent hand-builds a branch-efficiency spreadsheet in his spare time.

### What this product does

Makes a job live in **one file** — from a repair manager photographing a damaged tyre at a mine site to dispatch — with every photo attached to the stage it came from, every step time-stamped and named, and live status for the workshop, for sales and for the mine. The client described the goal himself as a **pizza tracker**.

### What it explicitly does not do

Price anything (quoting stays in NetSuite), integrate with anything, use AI, or touch the on-site fitters' daily tread-and-pressure rounds. Those are later phases and must not appear.

---

## 2. Users

| Role | What they do in the product | Where |
|---|---|---|
| Tyre repair manager | Triages a pile of tyres at a mine, photographs each, marks repairable — **this starts a job** | Phone, outdoors, poor signal |
| Workshop repairer | Advances stages, takes stage photos, records cook time | Tablet, workshop floor, gloves |
| Workshop supervisor | Receives goods, runs the branch queue, overrides a blocked stage | Tablet / desktop |
| NDT technician | Blasts, crack-tests, records findings, issues certificates | Workshop test bay |
| Sales | Reads the job, raises/revises the quote **in NetSuite**, answers the mine | Desktop |
| Logistics | Collects tyres, records collection and dispatch | Desktop |
| Superintendent / branch managers | Cross-branch performance | Desktop |
| Customer (the mine) | Read-only status page and their certificates | Any browser, via a link |

The floor staff are not computer people. Every interaction must be faster and clearer than WhatsApp-plus-paper, or the product loses to a piece of paper.

---

## 3. Rail A — tyre repair

Stage definitions are authoritative in `src/config/stages.js`. One job engine, two stage configurations.

| Stage | Actor | Must capture | Notifies |
|---|---|---|---|
| Triaged | Repair manager, at the mine | Per tyre: 3 photos (serial plate, damage, whole tyre), serial typed, repairable yes/no, damage position (sidewall / tread / shoulder / bead) | Sales — "initial inspection ready" with the batch summary |
| Initial quote sent | Sales | Quote number typed in | Logistics — "collect these" |
| Collected | Logistics | Carrier, driver, date | — |
| Received | Supervisor / repairer | One tap per tyre | Sales |
| Washed | Repairer | Tap through; photo optional | — |
| Inspected | Repairer | Confirmed category, damage size in mm, belt/ply damage yes/no, photos | Escalation if the category rises |
| Cut out | Repairer | Photos of the cut-out cavity | Escalation if the category rises |
| Repaired | Repairer | Repair unit / patch size, photos | — |
| Cooked | Repairer | Cook duration — live timer **or** typed entry; both must work | — |
| Final quote sent | Sales | Quote status → Final | Customer |
| Dispatched | Logistics / supervisor | Destination site, carrier, date, released by | Sales (they raise the delivery docket manually, outside this app) |
| Closed | system | — | — |
| Not repairable | Repair manager / repairer | Reason + photos | Sales |

**The escalation gate — the single most important behaviour.** Available at **Inspected** and at **Cut out**. Flagging "worse than quoted" requires a reason, the new category, and the evidence photo. On submit: sales is notified (email preview), and **that one tyre pauses** while the rest of the batch keeps moving. Sales marking "revised quote sent" un-pauses it. A paused tyre must appear in the console's *Needs a person* band.

**The batch.** One site visit = one pile of tyres = many jobs = one quote = one pickup. The client's own example: *"out of them six tyres, there's five we can repair."* Sales quotes the batch, logistics collects the batch, but each tyre is its own job.

---

## 4. Rail B — rim NDT

| Stage | Actor | Must capture | Notifies |
|---|---|---|---|
| Notified | Sales / supervisor | The mine's list of returned rims (see §7) | — |
| Received | Supervisor | Rim IDs confirmed, photos | Sales |
| Blasted | NDT tech | Tap through | — |
| NDT tested | NDT tech | Method (magnetic particle / ultrasonic), technician, competency unit, pass/fail; on fail a crack list pinned to rim locations (flange / bead seat / gutter / disc / weld) + photos | On fail → sales |
| BTP (pass path) | NDT tech | Blast, test, paint confirmed | — |
| Rim repaired (fail path) | Repairer | Sections cut out / cracks welded / sections replaced, photos | — |
| Re-tested (fail path) | NDT tech | Retest result | — |
| Certified | NDT tech / supervisor | Issue **Rim NDT certificate** + **Rim repair certificate**, numbered; next test due = hours at removal + 10,000 | Sales + customer |
| Dispatched → Closed | as Rail A | | |

---

## 5. Screens

All of these exist in the design bundle. Build every one, and make every one reachable by clicking.

| # | Screen | Design file | Purpose |
|---|---|---|---|
| 1 | Landing | `TD One - Landing` | Honest one-screen explanation; one button in |
| 2 | Who are you | `TD One - Who are you` | Role + branch picker, replacing login; reachable any time from the header so roles can be swapped mid-demo |
| 3 | Branch Console | `TD One - Branch Console` | The main screen: needs-a-person band, tyre line bays, the cook oven, rim side bays, rim hours dials, search by quote or serial |
| 4 | New site visit | `TD One - Field` step 1 | Customer, site, date, tyres on the pallet |
| 5 | Tyre capture | `TD One - Field` step 2 | The repeating 3-photo loop; must feel like the fastest screen in the product |
| 6 | Visit summary | `TD One - Field` step 3 | 6 tyres, 5 repairable, 1 rejected with its reason and photo; send to sales |
| 7 | Job File | `TD One - Job File` | Header, "what happened to the quote" ribbon, "the story of this repair" evidence spine, cook record, what we measured, this casing before |
| 8 | Stage action drawer | `TD One - Job File` (`drawer`) | Advance a stage without leaving the page; required captures; blocked list; cook timer + typed toggle; supervisor override with logged reason |
| 9 | Needs a decision | `TD One - Job File` (`isEscalation`) | As quoted vs measured, evidence, required reason, who gets told |
| 10 | Rim intake | `TD One - Rim` (`isIntake`) | 3-step stepper: upload **or** type in → review & fix → create jobs |
| 11 | NDT bay | `TD One - Rim` (`isNdt`) | Rim schematic with pinned cracks, method, technician, competency unit, pass/fail |
| 12 | Certificates | `TD One - Rim` (`isCerts`) | Two numbered certificates, watermarked, print view |
| 13 | Job report | `TD One - Job File` (`isReport`) | Print-style page: stages with times, photos grouped by stage, cook record, quote history |
| 14 | Branch performance | `TD One - Branch Performance` | Repair mix by branch, man hours vs repair hours, average time in stage, every-branch table |
| 15 | Customer tracker | `TD One - Customer Tracker` | External skin, own route, no login: received → being prepared → cooking → boxed up → dispatched, certificates when issued |
| 16 | Email preview | in console / field / job file (`email`) | What sales actually receives; proves the notification without a mail server |

### States — all of them, all reachable

| State | Where | Requirement |
|---|---|---|
| Loading | Console, reports, job spine | Skeletons + the rotating tyre indicator |
| Empty branch | Switch the branch to **Leeton** | Instructive empty state that draws the rail and offers the two starting actions. Never "no data". |
| Searching / no results | Console search | Includes the "Search all branches?" fallback |
| Upload in progress | Rim intake step 1 | Determinate, with row counts. Never an indeterminate spinner. |
| Weak-signal photo queue | Tyre capture | "2 photos waiting for signal — they'll send themselves." Must never say "offline mode". |
| Validation failure | Rim intake step 2 | Offending cell highlighted, plain-English message, fixable inline, running count of problems left. Errors inline, never as a toast. |
| **Needs a person** — exactly two places | (a) held rim rows (b) the tyre escalation | The hazard-tape treatment. It appears nowhere else. |
| Blocked stage | Stage drawer | Says what is missing; supervisor override writes a logged reason |
| Toast + undo | After every stage confirm | 5-second undo, implemented as a compensating event so history stays honest |
| Guided tour | Console (5 steps), Job File (4), Rim intake (3), Performance (2) | Coach marks; progress remembered for the session |

---

## 6. Rules and thresholds — every one with its source

These are already encoded in `src/config/rules.js`. Keep the source strings; they appear in tooltips so the presenter can defend each number on the call.

| Rule | Source |
|---|---|
| Rim NDT due at 10,000 machine hours; +10,000 after certification | Client, on the discovery call |
| Rim inspection frequency is ultimately risk-based per mine, not universally fixed | Queensland **Recognised Standard 13 — Tyre, Wheel and Rim Management** |
| NDT methods: magnetic particle testing (**AS 1171**), ultrasonic testing (**AS 2207**) | **AS 4457.1-2007** §4 |
| Rim records carry NDT history, repair history, damage, position, rotation history | QLD Recognised Standard 13 |
| Repaired assemblies require marking and a report | **AS 4457.1-2007** §5.7 |
| Defects are formally classified | AS 4457.1-2007 Appendix B |
| NDT technician competency units AURKTJ011–016, five-year refresher | QLD Recognised Standard 13 |
| Repair categories Minor / Intermediate / Major | Client ("intermediates and majors", "minor became major") + **AURKTJ013**, a defined Australian competency for minor OTR tyre repair |
| Thresholds: Minor ≤50 mm and no belt/ply · Intermediate 50–150 mm or single ply · Major >150 mm, multi-ply, sidewall/bead, or a section repair | **Our own judgement**, wording aligned to Tire Industry Association "section repair" terminology. Must read as adjustable — the client will correct it. |
| Escalation fires when measured damage moves the tyre up a category | Client's own minor→major example |
| An escalated tyre pauses; the rest of the batch continues | Our judgement — unconfirmed, keep it simple and visible |
| Damage positions sidewall / tread / shoulder / bead | Client said sidewall and tread; the rest is standard tyre anatomy |
| Crack locations flange / bead seat / gutter / disc / weld | Standard rim anatomy |
| BTP = blast, test, paint = the clean-rim path | The client's own term |
| Rim re-test after repair, before certifying | Our judgement — certifying an untested repair is indefensible |
| Cook time is **recorded**, and flagged only against the average of the same category **in the data on screen** | Client + our judgement. **Do not invent an industry cure-time constant.** |
| Intake flags: under 9,000 h (early) or over 12,000 h (overdue); duplicate asset; unknown serial; open job already exists | Our judgement, a ±10% band on the client's 10,000 |
| Quote statuses Initial → Revised → Final | The client's own words |
| A stage cannot advance without its required capture; supervisor override allowed but logged | Our judgement |
| No prices anywhere | Quoting lives in NetSuite |

---

## 7. The one input the product ingests

This project is not a document-processing pipeline; it is a workflow tracker. But it has exactly **one real intake → validate → output moment**, and it is the credibility highlight of the demo:

**`data/rim-returns-ridgeview-2026-08-08.xlsx`** — the spreadsheet a mine's maintenance planner sends when rims come off for NDT. It ships in this repo. Its deliberate awkwardness is the point:

- Two preamble rows before the header, so **the header is on row 3**.
- Column names that do not match our field names (`Asset No.`, `Rim Serial No`, `Size`, `Machine`, `Hrs at Removal`, `Date Off`, `Comments`) — hence the mapping confirmation the design shows.
- 18 data rows containing: a duplicate asset (`R-4492`, rows 3 and 13), a blank rim serial, a size typo (`5 peice`), trailing whitespace on two fleet numbers, a blank hours value, an early return at 8,240 h, an overdue return at 21,100 h, a serial not in the register (`RM-88-9911`), a date stored as the text `last Tues`, and one rim (`R-4471`) that already has an open job.

**Required outcome, and it must be consistent everywhere it appears: 18 rows in → 13 jobs created → 5 held for a human.** `INTAKE_ROWS` and `INTAKE_SUMMARY` in the fixtures define exactly which rows are held and the plain-English message for each. Parse the real file; do not hardcode the result.

The manual "type them in" tab must also fully work — the client may well say they only ever get a phone call.

---

## 8. Data to create yourself

No real client data exists. Everything is generated by us, in the industry's own formats, following the naming rules in `CLAUDE.md`. The fixtures already carry most of it — port them and fill any gaps.

**Volumes:** 34 open jobs across the eight branches. **Mackay is the demo branch**: 11 tyre jobs spread across every stage, 6 rim jobs, 1 tyre paused on escalation, **2 tyres in the cook oven with live countdowns**, 1 not-repairable rejection with its photo, 3 closed jobs with a full report and issued certificates. **Leeton deliberately empty**, so the empty state is reachable.

**Deliberately echo the client's own numbers**, so he recognises them instantly: a visit of **6 tyres with 5 repairable** · rims at **10,000 hours** · Mackay at **1,200 man hours against 600 repair hours** · the intake at **18 → 13 + 5**.

**ID formats:** job `MKY-TR-26-0417` / `MKY-RJ-26-0132` · site visit `SV-26-0088` · quote `EST-10482` · tyre serial 8–9 alphanumeric (`BR7K48219`) · rim customer asset `R-4471` plus manufacturer serial `RM-88-2214` · certificates `NDT-MKY-26-0311` and `RRC-MKY-26-0311`.

**Photos.** We do not own tyre photographs, and stock imagery reads as stock. Every photo is a **drawn evidence tile** — a component rendering a serial plate, a sidewall cut, a whole tyre, a cut-out cavity, a repair patch, a crack — with real metadata burned in (time, who, stage, place), the way a workshop photo carries it. Build these as reusable SVG components. They must read as *captured evidence*, not as icons; that is the one place the current design is weakest (see §11).

**Everything else you need and cannot find** — a driver's name, a carrier, an extra branch's numbers — invent it in the same register and log it in `DECISIONS.md`.

---

## 9. Interaction and navigation

- React Router, **nested routes under one persistent layout** — the shell and header never re-mount. **Route-level code splitting** for console, field, job file, rim, reports, customer tracker; the design's skeletons cover chunk loads.
- Field routes (`/field/*`) and the customer tracker (`/t/:token`) render in their own shells, as designed.
- **Smooth scroll-into-view with focus management** at exactly these five moments. Each moves the view to the newly revealed region, moves keyboard focus to its heading, announces via `aria-live="polite"`, and jumps instantly under `prefers-reduced-motion`:
  1. Tyre capture → *Save & next tyre* → the newly appended tyre card
  2. Rim intake → *Validate* → the results table and the flagged-row summary
  3. Job File → *Confirm stage* → the new block on the evidence spine
  4. Escalation → *Send to sales* → the email preview below
  5. NDT bay → *Issue certificates* → the certificate pair below the findings
- **Progressive disclosure.** Two true steppers (site visit; rim intake), both showing all steps with future ones dimmed. On the Job File, **future stages stay dimmed but visible** — visibility is the product's whole pitch, so hiding them would contradict it. The certificate section appears only after findings, and after re-test where a rim was repaired. The man-hours input reveals only when that chart is opened, so the manual dependency stays honest.
- **Motion:** crisp and functional, per `DESIGN.md`. The rotating OTR tyre as the loading indicator, and a tyre visibly travelling from one bay to the next when a stage advances. All motion off under `prefers-reduced-motion`.
- Keyboard: `/` focuses search, `Esc` closes drawers, arrows move between bays, visible focus rings throughout.
- An unobtrusive **reset demo** control, so the walkthrough can be replayed cleanly.

---

## 10. Milestones

Do these in order. Each has a hard acceptance bar; do not start the next until the current one passes. Record status in `PROGRESS.md`.

### M0 — Foundation
Vite + React 18 + TypeScript. Router with the persistent layout and code splitting. Design tokens from `DESIGN.md` as CSS variables in one place. Fonts bundled locally (Barlow, Barlow Condensed, IBM Plex Mono) — no CDN links. `src/types.ts`, `src/config/stages.ts`, `src/config/rules.ts`, `src/data/` ported from the bundle's JS to typed TS. Shared primitives built to match the design: tread-edged card, button hierarchy, status pills, hazard band, mono ID treatment, drawn tyre and rim glyphs.
**Accepted when:** `npm run dev` serves the landing page and the role picker, pixel-close to the design, with zero type errors and no CDN requests.

### M1 — The event engine
Both rails from `stages.ts`. **Append-only event log; status derived, never stored as a mutable field.** Required-capture gates, supervisor override with a logged reason, backwards moves supervisor-only, and undo as a compensating event.
**Accepted when:** a job can be walked stage to stage in code and in the UI, every transition appears in its history, an override is recorded with its reason, and undo leaves an honest trail.

### M2 — Branch Console
The full console: needs-a-person band, tyre line bays, cook oven with real ticking countdowns, rim side bays, rim hours dials, search by quote number and serial with the all-branches fallback, skeleton loading, and the empty Leeton state. The tyre-travels-between-bays motion on a stage advance.
**Accepted when:** all 17 Mackay jobs appear in the right bays, both oven timers tick, search finds a job by quote *and* by serial, and switching to Leeton shows the empty state.

### M3 — Job File, drawer, escalation, report
The header with every field populated, the quote ribbon including the photo that caused the revision, the full evidence spine with drawn tiles, cook record, what-we-measured, this-casing-before. The stage drawer with required captures, the blocked state, the cook timer and the typed alternative. The escalation flow end to end, including the pause and the un-pause. The printable job report.
**Accepted when:** a tyre goes triaged → dispatched → closed with the escalation and pause included, and the job report prints with every photo grouped under its stage.

### M4 — Field capture
The three-step site visit at phone width: details, the capture loop, the summary. The weak-signal photo queue. The email preview to sales. 6 tyres, 5 repairable, 1 rejected.
**Accepted when:** a visit can be completed on a 390 px viewport with big targets, the queue state is reachable, and finishing it creates five jobs plus one recorded rejection and shows the email.

### M5 — Rim rail
Real client-side parsing of the shipped spreadsheet, including the row-3 header and the column mapping step. Row-level validation with inline fixes and a running count. Job creation. The NDT bay with pinned crack locations, method, technician and competency unit. Both paths — clean to BTP, cracked to repair and re-test. Numbered, watermarked certificates with a print view. The manual type-in tab, fully working.
**Accepted when:** dragging in the real file yields **18 → 13 created + 5 held**, each held row carries its plain-English reason and can be fixed or confirmed inline, and a rim reaches two numbered certificates down both paths.

### M6 — Reports and the customer view
Branch performance computed from the data: repair mix by branch, man hours vs repair hours with the visible manual entry, average time in each stage from the event log, the rejection rate, and **the every-branch table populated** (it is empty in the design — see §11). Period switcher and branch drill-down. The customer tracker on its own route, showing only whitelisted content.
**Accepted when:** every figure is computed rather than hardcoded, the table has rows, and the tracker leaks no internal note, no damage discussion, no escalation and no price.

### M7 — Polish, guardrails and QA
All five scroll-and-focus moments. All four tours. Reset demo. Reduced-motion paths. The full checklist in §12.
**Accepted when:** every line of §12 passes by clicking, and `npm run build` is clean.

---

## 11. Known defects in the design bundle — fix these while building

The design is approved, but these are genuine faults found in review. Fixing them is in scope; they are not licence to redesign.

| # | Defect | What to do |
|---|---|---|
| 1 | The **every-branch table** on Branch Performance renders no rows — it is an unbound placeholder loop | Populate it from `BRANCH_REPORTS`: branch, minor, intermediate, major, closed, man hours, repair hours, booked %, rejected |
| 2 | The **cook oven** card clips its second countdown at narrower widths, and the `elapsed` / `target` labels collide | Make the oven card responsive: two cards side by side above ~1200 px, stacked below, labels never touching |
| 3 | **Bay rows leave large dead space** to the right when a bay holds one or two cards | Let cards flow to fill, or narrow the bay row, so no bay looks broken when it is nearly empty |
| 4 | **Uneven card heights** on the customer tracker leave one card with a big empty area | Equal-height rows, or content that fills |
| 5 | The field stepper label **"Review and send" wraps to two lines** | No wrapping labels or buttons anywhere in the product |
| 6 | **Evidence tiles read as dark icon squares**, not captured evidence — the client may think images failed to load | Keep them drawn, but give them enough form, framing and depth to read as photographs, with the metadata overlaid. Highest-leverage visual fix in the build. |
| 7 | **Rim hours arcs** read as complete rings for "At interval", so the fill encodes nothing | The arc must visibly encode hours against the 10,000 h interval; overdue overshoots and is distinct |
| 8 | The **held/clean counts** are bound to variables in the intake stepper but hardcoded as "5 of 18" in the console band | Both must read from `INTAKE_SUMMARY`. One set of numbers everywhere. |
| 9 | **Rim schematic labels overlap** the arcs and the pins (`BEAD SEAT` over pin 1, `WELD SEAM` clipped by pin 2) | Lay out the leader lines and labels so nothing overlaps at any pin position |
| 10 | The design's HTML loads **fonts and React from CDNs** | Bundle everything locally; no runtime network calls |

---

## 12. Final QA — verify every line by clicking

1. Landing → role picker → console, with no full page reload and no shell flicker.
2. A full tyre job walks from a site visit at the mine to dispatch and a printed job report, **including the escalation and the pause**.
3. A full rim job walks from the real spreadsheet to two numbered, watermarked certificates — **down both the clean (BTP) and cracked (repair + re-test) paths**.
4. Dragging in `data/rim-returns-ridgeview-2026-08-08.xlsx` yields **13 created and 5 held**, each held row with a plain-English reason, fixable or confirmable inline.
5. The manual rim type-in tab creates jobs correctly.
6. Every state in §5 is reachable: empty Leeton, upload progress, photo queue, validation failure, both needs-a-person cases, blocked stage, no results with the all-branches fallback, toast with undo.
7. All five scroll-into-view moments move the view **and** the focus, announce politely, and jump instantly under reduced motion.
8. All four tours run; every threshold tooltip still names its source.
9. Search finds a job by quote number and by serial.
10. Status is derived from the event log — no mutable status field anywhere. Overrides and undos appear in history.
11. Reports and both print views render correctly from the data, and the every-branch table has rows.
12. The customer tracker exposes no internal note, no escalation, no damage discussion, no price.
13. No price, no dollar sign, no integration badge, no AI wording, no unwatermarked certificate, nothing labelled "sample".
14. No invented tyre manufacturer; no real mining company or competitor named anywhere.
15. Every screen is usable at 1280×800; field screens at 390 px; no wrapping buttons; no empty value sitting under a label.
16. `npm run build` succeeds with no type errors; the browser console is clean.
17. `DECISIONS.md` lists every judgement call you made, one line of reasoning each. `PROGRESS.md` shows every milestone as done.
