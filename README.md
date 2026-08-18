# TD One — Workshop (prototype for Tyre Doctor)

A clickable, front-end-only prototype of one place a mining tyre or rim repair lives, from the mine site to dispatch. Front end only — no backend, no auth, no network calls at runtime.

See `CLAUDE.md` for the standing rules and `PRD.md` for the full requirement. `DECISIONS.md` records every judgement call made while building this; `PROGRESS.md` tracks milestone status.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173 (or the next free port Vite reports) — no setup, no credentials
npm run build       # production build, must be clean with no type errors
```

Built and demoed at **1280×800**. Field screens (`/field`) are designed at phone width and render inside a simulated phone frame.

## Deploying to Vercel

The app is a static Vite build with no backend and uses `HashRouter`, so it needs zero server-side rewrite rules — any static host works, Vercel included.

- **Via the Vercel CLI, straight from this folder** (no git needed): `npx vercel` then `npx vercel --prod`.
- **Via a connected git repo**: push this folder to GitHub/GitLab/Bitbucket, then "Import Project" in Vercel. It auto-detects Vite; `vercel.json` in the repo root pins the framework, build command (`npm run build`) and output directory (`dist`) explicitly so there's nothing to configure by hand.
- No environment variables, no secrets, no database — the whole app seeds itself from in-memory fixtures on load.

## Branding

The header/landing/field/customer-tracker logo is the real Tyre Doctor logo, pulled from `tyredoctor.com.au` (`src/assets/tyre-doctor-logo.svg` — white, for dark headers — and `tyre-doctor-logo-navy.svg` — for light headers). The favicon (`public/favicon.svg`) is the icon mark on the brand's own navy. Every other drawn glyph in the app (bay cards, evidence tiles, the oven, casing icons) is untouched — those are functional UI marks, not the logo, and were left exactly as they were.

## Plain-English walkthrough — what each page is and how to use it

**1. Landing page (`/`)** — the front door. It explains the problem in one sentence ("everything about a tyre repair lives in four different places today") and has one big button: **Open the workshop**. There's also a small **See the customer view** link — that's what the mine site sees, not the workshop.

**2. Who are you today? (`/who`)** — instead of a username/password, you just tap who you are: Workshop supervisor, Workshop repairer, Tyre repair manager (mine site), NDT technician, Sales, or Superintendent. Each one drops you straight onto the screen that role actually uses day to day. There's no real login because this prototype doesn't need one.

**3. Branch Console (`/console`)** — this is the main workshop floor screen, the "pizza tracker" itself. At the top, **Needs a person** lists anything waiting on a human decision. Below that, tyres are laid out in lanes matching where they physically are — just arrived, being washed, being inspected, in the oven cooking, ready to go out — plus a separate lane for rims being crack-tested. Click any tyre or rim card to open its full file. The search box at top finds a job instantly by its quote number or serial number.

**4. Job File (`/jobs/...`)** — one tyre's whole life on one page: what's happened so far (step by step, with who did it and when), photos at each step, the cook time if it went in the oven, and its repair history if it's been in before. The big **Advance this tyre** button moves it to the next step and asks for whatever that step needs to record (a photo, a measurement, etc). If a tyre turns out worse than what was quoted, **Flag worse than quoted** sends that news to sales — right there, no separate email program.

**5. Field capture (`/field`)** — this is the phone screen a fitter uses out at the mine site, before a tyre ever reaches the workshop. They log the visit, take three photos of each tyre, jot down basics, and it saves as they go — even with a bad signal, it just queues and sends when it can (never says "offline", because to the fitter it should just quietly work).

**6. Rim intake (`/rim/intake`)** — where a whole batch of rims comes in at once, usually from a spreadsheet the mine sends over. Drop the file on the upload box and it reads every row for real, sorting them into "ready to test" versus "needs a person to look at it" (duplicate, blank, odd serial, etc.) with a plain-English reason for each. From there, each rim goes through the **NDT bay** (crack testing) and, if it passes, gets a numbered, watermarked **certificate**.

**7. Branch Performance (`/performance`)** — the manager's view across all eight branches: how the workload splits between repair types, hours spent, and how long jobs sit at each step. Click a branch's row to see it broken down further.

**8. Customer Tracker (`/t/ridgeview`)** — the page a mine customer opens themselves, with no login. It only shows plain milestones (received → being prepared → cooking → boxed up → dispatched) and a few photos — never a price, never internal detail, never anything that hasn't actually happened yet.

Everything resets to its starting state with the **Reset demo** button (top corner of most screens, tap twice) — handy for running through the demo more than once.

## The click path for the call

1. **Landing** (`/`) → **Open the workshop**.
2. **Who are you** (`/who`) — role and branch picker, Mackay preselected. Pick **Workshop supervisor** to land on the console (or pick any other role to land on its own entry screen — Field, NDT bay, Branch performance).
3. **Branch Console** (`/console`) — Needs a person sits at the top; below it the floor as wide bay strips, the cook oven with two live countdowns, Ready to go out, the rim bays, and the rim-hour dials.
   - **Show me around** runs the 5-step guided tour.
   - Tap **Mark received** on a tyre in *On the way* — it moves into the wash bay with a 5-second undo toast.
   - Type `EST-10482` or `BR7K48219` into the search box (or press `/` to focus it). Type something that doesn't exist for the no-results state and the **Search all branches?** fallback.
   - Switch the branch selector to **Leeton** for the loading state, then the empty-floor state.
   - **See what sales gets told** on the escalation card opens the email preview.
   - **Reset demo** (top right, tap twice) puts every job, quote and intake row back to its starting state.
4. **Job File** (`/jobs/MKY-TR-26-0417`, or click any tyre from the console) — header band, the quote ribbon with the photo that caused the revision, the story of the repair stage-by-stage, the cook record, what was measured, the casing's previous jobs.
   - **Advance this tyre** opens the stage drawer: per-stage required captures, the blocked state with supervisor override, and — at the Cooked stage — the live timer / typed-entry toggle.
   - **Flag worse than quoted** (visible once a tyre reaches Inspected or Cut out) opens the escalation screen; `MKY-TR-26-0419` is already pre-escalated to show the "waiting on a revised quote" state, with an un-pause action.
   - **Build the job report** opens the printable report.
5. **Field** (`/field`, or the Tyre repair manager role) — visit details → the capture loop (three photo tiles with a determinate "sending" animation, the weak-signal queue after the first save, **Save and next tyre** blocked until every requirement is met) → visit summary → **Send to sales** opens the email preview built from what was actually captured.
6. **Rim** (`/rim/intake`) — the console's "Needs a person" band already shows 5 held rows from the last list; **Work through the 5** (or **Take in a rim list** from the console) opens the intake stepper. Drop `data/rim-returns-ridgeview-2026-08-08.xlsx` on the upload tile (or use **Type them in**) to re-run the real parse — **18 rows in → 13 jobs created → 5 held**, every held row with a plain-English reason, fixable inline or confirmable as-is.
   - **NDT bay** (`/rim/:jobNo/ndt`) — the rim schematic with pinned cracks, method/technician/competency-unit, PASS/FAIL. `MKY-RJ-26-0132` already has two findings pinned; a clean rim (e.g. `MKY-RJ-26-0133`) walks the BTP path straight to certificates.
   - **Certificates** (`/rim/:jobNo/certs`) — both numbered certificates with the `PLACEHOLDER TEMPLATE` watermark, and **Print or save**.
7. **Branch Performance** (`/performance`, linked from the console header) — headline figures, repair mix per branch (click a row to drill into its average stage times), man hours vs repair hours (Mackay recomputes live), the full eight-branch table. **Open man-hours entry** reveals the manual input. **Show me around** runs the 2-step tour.
8. **Customer Tracker** (`/t/ridgeview`, linked from Landing/Who-are-you/Job File) — received → being prepared → cooking → boxed up → dispatched, plain sentences, curated photos, certificates as documents you can open. No login, no internal detail, no price.

## Project layout

```
src/
  app/            role + branch state (persisted to localStorage), not auth
  components/     shared primitives — Card, Button, Glyphs, EvidenceTile, Tour, Toast, EmailModal, ResetDemo, reveal-announcer hook
  config/         stages.ts (the two rails) and rules.ts (every threshold + its source string)
  data/           fixtures.ts, the event-sourced Store, the real xlsx parser, the shared intake state, format helpers
  layout/         the persistent workshop shell + header-slot portal system
  routes/         one file per screen, matching the router in App.tsx
  types/          domain.ts — ported from project/src/types.js

project/          the APPROVED DESIGN BUNDLE — read-only reference, not part of the running app
data/             the one real input file this product ingests
```

## Known, honestly-logged gaps

See the end of `PROGRESS.md` (M7) and `DECISIONS.md` for the short list of things simplified or not fully hand-verified in this pass — most notably: arrow-key navigation between bays is not implemented, and Rim Intake's guided tour is 2 steps rather than 3 (the third step lived on what is now a separate NDT bay route).
