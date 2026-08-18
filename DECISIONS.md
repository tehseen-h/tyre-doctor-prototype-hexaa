# DECISIONS.md — judgement calls, one line of reasoning each

Nothing here was asked of a human; PRD.md and CLAUDE.md said to decide and keep moving. This is that record.

## Foundation / architecture

- **App lives at the repo root, not inside `animate-project-deliverables/`.** CLAUDE.md's paths assumed a folder that doesn't exist in this checkout (`project/` is the actual design bundle at root) — the app is built alongside it as `src/`, `index.html`, `package.json` at the repo root, and `project/` is left untouched as the design reference.
- **HashRouter, not BrowserRouter.** The prototype has to run as static files with `npm run dev`/`npm run build` and no server-side rewrite rules; hash routing means every route also works from a plain `file://`-style static host with zero config.
- **In-memory pub-sub `Store` class, not Redux/Zustand.** One extra dependency doesn't buy anything a 120-line class with `subscribe`/`emit` doesn't already give us, and it keeps the "reads like an API" framing from the brief literal.
- **`useSyncExternalStore` snapshots are memoized against a numeric `store.version` counter, not the raw derived array.** Returning a fresh array/object from `getSnapshot` every call breaks React's "same reference if nothing changed" contract and can cascade into a real infinite render loop (see Bugs below) — `useMemo` keyed on `version` fixes it cleanly.
- **Header persistence across console / job file / rim / performance is done with React portals into stable DOM nodes**, not by lifting rendered JSX through context state. Lifting JSX through a context provider's own `useState` re-renders the whole subtree (including the routed page) on every header update, which regenerates the JSX and re-triggers the update — an infinite loop I hit and had to fix (see Bugs). Portals sidestep it entirely: the header DOM node is set once, and each page paints straight into it on render with no extra state hop.

## Data model

- **Added `quotedCategory` to `Job`, distinct from `category`.** The fixture data implies these can differ (a tyre quoted Intermediate that measures Major at inspection) but the ported type only had one field. `category` is now the current/measured value and updates through the job's life; `quotedCategory` is stamped once at creation and never touched again, which is exactly what the escalation screen's "as quoted vs measured" comparison needs to stay honest after a real inspection capture.
- **`store.advance()` takes an optional `patch`.** The generic stage-drawer form was recording captures (category, damage size, belt/ply, repair unit) into the event log's payload only — the job's own fields never moved, so the escalation screen and "what we measured" card kept showing stale fixture values after a real inspection. `patch` lets a stage's capture also update the job record itself, while the event log still carries the same information for the audit trail.
- **Rim rail branching (`ndt_tested` → `btp` on pass, → `rim_repaired` on fail) needed an explicit-target advance.** `nextStageId()` is a plain "next array entry" walk, which can't express a fork — a new `store.advanceTo(jobNo, targetStage, opts)` method is used at that one decision point instead.
- **Every job's `events` array is the source of truth for `stage`** — it's never written directly. Fixture jobs that only specified a `stage` string get a synthesized history built at store-seed time (plausible staff, deterministic per-job timestamps within the fixture's August 2026 window) so the append-only log is real for every job, not just the one the design bundle detailed in full.
- **`RIM_REGISTER_SERIALS` / `OPEN_RIM_ASSET_NOS` were built from the real spreadsheet's actual contents** (read and dumped row-by-row), not just copied from the design bundle's fixture list — confirmed the real file independently produces 18 → 13 clean → 5 held before wiring it into the UI.

## Rim intake parsing

- **Header row is found by scanning for a row containing both "asset" and "serial"**, rather than assuming index 2. A mine that adds one extra banner row shouldn't break intake — this is the actual "parse for real" requirement, not a hardcoded row offset.
- **Two real fleet numbers with trailing whitespace (`LD-40 `, `HT-412 `) are trimmed silently, not flagged.** PRD describes this as the sheet's deliberate awkwardness to be *handled*, not one of the plain-English held-row reasons.
- **Size-typo suggestion matches on the leading "NN in" digits** rather than a full fuzzy match — simple, and correct for the one real typo in the data (`5 peice`).

## Field capture

- **The mine-site capture form doesn't collect make/size/fleet number** (matches the approved design), so a saved tyre invents these via round-robin over the real makes/sizes list (Bridgestone/Michelin/Goodyear; the six real OTR sizes) and a fleet number pattern `FV-nn`. Logged here per CLAUDE.md's "where data is missing, create it plausibly" instruction.

## Escalation

- **The email preview after "Send to sales" stays inline on the same page** instead of navigating straight back to the job file. The original click-path implied an immediate return, but PRD §9 names this as one of the five scroll-into-view-and-announce moments, which needs something to reveal. A "Back to the job" button inside the panel replaces the auto-navigate.
- **The already-paused view and the "just sent" view share one job record**, so the component checks `job.paused && !sentEmail` rather than `job.paused` alone — otherwise the moment the store marks the job paused (which happens synchronously on send), the component would flip straight to the generic "already escalated" view and the just-built email would never render.

## Branch performance

- **Only Mackay's repair mix / hours / average-stage-time are computed live from the store's job and event data.** The other seven branches have no live job records in this prototype (by design — Mackay is the demo branch), so they keep the `BRANCH_REPORTS` historical aggregate. This is a real boundary, not a shortcut: it's computed where the data exists, and honestly aggregate where it doesn't.
- **The period switcher (This month / Quarter / Year) is a deterministic ×1 / ×3 / ×12 multiplier** over the one dataset that exists. There's no real multi-period history to switch between; the alternative was a switcher that visibly did nothing, which is worse.

## Customer tracker

- **Token → customer is a tiny static lookup** (`ridgeview` → Kurrajong Coal) since there's no auth in this product at all — a real link would carry an opaque token the server resolves; here it's a route param standing in for that.
- **Only stages that have physically reached the workshop are shown.** A tyre still at `triaged` / `initial_quote_sent` / `collected` is deliberately not listed — the customer view must never imply visibility into pre-arrival logistics or expose the escalation/pause state, per the absolute rule against leaking internal detail.

## Accessibility

- **The five scroll-into-view + focus + `aria-live` moments share one hook** (`useRevealAnnouncer`) rather than five bespoke implementations, so the reduced-motion jump-instead-of-smooth-scroll behaviour is guaranteed identical everywhere.
- **Rim intake's guided tour has 2 steps, not the 3 named in PRD §5.** The third step ("on the rim side, every crack is pinned...") lived on the NDT bay in the single-page-with-tabs design; this rebuild gives NDT bay its own route, and a tour that jumps across a route boundary was out of scope for this pass. Documented here rather than silently dropped.
- **Arrow-key navigation between bays (PRD §9) is not implemented.** `/` to focus search and `Esc` to close drawers/tours are; a full roving-tabindex spatial nav across every bay's job cards is a real feature, not a one-line addition, and the floor screens are explicitly mouse/tap-first per the client's own framing. Left as a known gap rather than a rushed, possibly-broken addition.

## Design fidelity (defects fixed per PRD §11)

- **#6 evidence tiles** — added an extra highlight gradient + inset shadow beyond the original spec so tiles read as a lit, framed capture rather than a flat icon square.
- **#7 rim hour arcs** — the non-overdue arc is capped at 94% fill (never a closed ring) and overdue rims get a dashed outer ring, so "at interval" and "overdue" are visually distinct, not just colour-coded.
- **#3 bay dead space** — job cards keep a fixed, readable width and wrap within the bay row rather than stretching to fill; this reads correctly whether a bay holds one card or six.
- **#8 held/clean counts** — the console's "Needs a person" band and the rim intake stepper both read from the same `intakeState` singleton, so the numbers can never drift apart.
- **#10 fonts/React from CDN** — bundled locally via `@fontsource` packages; confirmed zero external network requests in the production build.

## Branding and deployment (added after initial build)

- **The drawn tyre-glyph placeholder in every logo/header spot was replaced with the client's real logo**, fetched from `tyredoctor.com.au` (user-supplied URL) — a white variant for dark headers (console/job file/rim/performance shell, Who-are-you, Field) and a navy variant for light headers (Landing, Customer Tracker). Every other use of the drawn glyph (bay cards, the oven, evidence tiles, casing icons) was left untouched — those are functional UI marks, not branding.
- **Favicon is the icon-only mark on the brand's own navy** (`public/favicon.svg`), not the full wordmark — a wordmark favicon is unreadable at 16px.
- **`vercel.json` pins framework/build/output explicitly** rather than relying on auto-detection, since HashRouter already means no rewrite rules are needed — the only remaining risk was Vercel guessing a different build command.

## Bugs found and fixed during this build (not defects in the approved design — introduced while building it)

- **Infinite render loop** from passing fresh JSX into the header-slot context every render (see "Header persistence" above) — fixed with portals.
- **Guided tours silently did nothing on any screen.** Each screen declared its own `useRef`s for its tour anchor points instead of registering them with `useTour`'s own ref map via `tour.setRef(key)` — the tour's `measure()` was always looking up an empty map. Fixed on all four screens (console, job file, branch performance, rim intake).
- **Rim Intake had no "Show me around" button at all** — the tour hook and its two steps existed but nothing in the header triggered `tour.start`. Added alongside the intake/NDT/certs tab switcher.
- **Escalation "as quoted" panel showed the post-inspection category on both sides** until `quotedCategory` was added (see "Data model" above).
