# CLAUDE.md — TD One (Workshop), for Tyre Doctor

This file is loaded on every turn. Keep it in mind at all times. The full requirements are in `PRD.md`.

## What this repo is

A **clickable, front-end-only prototype** that will be walked through live on a sales call with a prospective client, **Tyre Doctor**. It is not production software and has no backend. Its job is to make the client say "that's my workshop".

The visual design is **already done** and lives in `animate-project-deliverables/`. Your job is to turn it into a working React app. See "Rule zero" below.

## Who the client is, in four lines

Tyre Doctor is a family-owned Australian business that repairs **six-tonne mining tyres** and crack-tests **safety-critical steel rims**, across eight workshop branches. Today one repair job's information is scattered across Smartsheet, WhatsApp photos, a photographed paper sheet, and NetSuite — so nobody can see where a tyre is, and reports are rebuilt by hand at the end. This product makes a job live in **one file**, visible to the workshop, to sales, and to the mine.

The client's own words for the goal: a **pizza tracker**. And his hardest requirement: *"You're not dealing with the most tech-savvy guys, so it's got to be simple and easy to use, otherwise they just put it aside and go back to a piece of paper."*

## Rule zero — do not redesign

The design in `animate-project-deliverables/project/*.dc.html` plus `DESIGN.md` is **approved and is the visual source of truth.** Match it. Do not change the palette, the type, the spacing, the layout, the copy, or the component structure. Where the design and this file disagree, the design wins on appearance and this file wins on behaviour.

Those `.dc.html` files are **design-tool templates, not runnable code** — they contain `{{ placeholder }}` bindings and load React from a CDN. Do not try to run them or copy their markup wholesale. Read them, then rebuild each screen in React so it looks the same.

The bundle also ships a ready-made data layer you should use: `project/src/fixtures.js`, `project/src/config/rules.js`, `project/src/config/stages.js`, `project/src/types.js`. Port these to TypeScript rather than reinventing them.

## Absolute rules — breaking one of these damages the client relationship

- **No prices, no dollar amounts, no currency symbols, anywhere.** Quoting happens in the client's ERP (NetSuite), not here. We hold a quote *number* and a status only.
- **No integration claims.** Nothing may say "Connected to NetSuite", "Synced", "Live", or show an integration badge. The quote number is a field a person types, labelled `Quote no. (from NetSuite)`.
- **No AI anywhere.** No OCR, no "AI detected", no auto-classification, no confidence scores, no AI wording in copy or comments visible in the UI.
- **No on-site fleet inspection module** (tread depth / pressure rounds by field fitters). It is explicitly out of scope — no screen, no tab, no nav item.
- **No login or auth.** A role picker replaces it.
- **Certificates must keep the visible `PLACEHOLDER TEMPLATE` watermark.** We have never seen the client's real template.
- **Nothing may be labelled "sample", "demo", "example" or "test data"** in the UI.
- **No invented statistics, testimonials, partner logos or accuracy percentages.**
- **Customer names are invented and must stay invented:** Kurrajong Coal, Barrunga Iron Ore, Marrakoo Gold Operations, Bellara Copper, Yandarra Minerals, Wattlebank Coal. Never use a real mining company (BHP/BMA, Glencore, Anglo American, Peabody, Whitehaven, Northern Star, Rio Tinto, Fortescue…) or a competitor (Kal Tire, TOMS).
- **Real branch names, real tyre sizes, real tyre makes.** Branches: Brisbane, Blackwater, Cobar, Kalgoorlie, Leeton, Mackay, Muswellbrook, West Wyalong. Sizes: 40.00R57, 53/80R63, 33.00R51, 27.00R49, 24.00R35, 18.00R33, and the rim sizes in the fixtures. Makes: Bridgestone, Michelin, Goodyear only — **never invent a tyre manufacturer.**

## How to work

- **Work in milestones.** `PRD.md` §10 defines M0–M7 with acceptance criteria. Do them in order. Finish and verify one before starting the next.
- **There is nothing to ask.** No further input is available from the human. Every question you might have is either answered in `PRD.md` or is yours to decide. Decide, note the decision in `DECISIONS.md` with one line of reasoning, and keep moving. Do not stop to request clarification, confirmation or approval.
- **Where data is missing, create it** — plausibly, in the industry's own formats, matching the naming rules above. `PRD.md` §8 says exactly what to generate.
- **Never fake a capability to pass a milestone.** If a thing genuinely cannot work, make its limitation visible and honest in the UI rather than pretending. But do not use that as an excuse — the spreadsheet parsing, the state machine and the reports must all really work.
- Keep `DECISIONS.md` (your judgement calls) and update `PROGRESS.md` (milestone status) as you go.

## Tech

- **React 18 + TypeScript + Vite.** React Router with nested routes under one persistent layout. Route-level code splitting.
- Front end only: no backend, no database, no auth, no network calls at runtime. Bundle fonts locally — the design's CDN font links must not remain.
- Data lives in a typed in-memory layer that reads like an API, seeded from the ported fixtures. State survives navigation within a session and is resettable.
- **Status is derived from an append-only event log**, never a mutable status field. This is the audit trail the certificates depend on.
- Client-side spreadsheet parsing for the rim intake (`data/rim-returns-ridgeview-2026-08-08.xlsx` is in this repo).
- Accessibility is part of the spec, not a nicety: focus management, `aria-live` on the five reveal moments, keyboard reachable, visible focus rings, `prefers-reduced-motion` respected.

## Commands

```bash
npm install
npm run dev        # must be clickable end to end with no setup and no credentials
npm run build      # must succeed with no type errors
```

Must be usable in a browser at **1280×800** — that is the screen it will be demonstrated on. Field screens are designed at phone width.

## Quick orientation

| Path | What it is |
|---|---|
| `animate-project-deliverables/project/*.dc.html` | The approved screens (templates — read, don't run) |
| `animate-project-deliverables/project/DESIGN.md` | Palette, type, layout, motion, with reasoning. Follow it. |
| `animate-project-deliverables/project/src/fixtures.js` | Seed data: jobs, visits, intake rows, reports, emails |
| `animate-project-deliverables/project/src/config/rules.js` | Every threshold, with the source string its tooltip shows |
| `animate-project-deliverables/project/src/config/stages.js` | The two rails and the console bays |
| `animate-project-deliverables/project/screenshots/` | Rendered references (highest number prefix = latest) |
| `PRD.md` | Full requirements, milestones, acceptance, known defects |
| `data/rim-returns-ridgeview-2026-08-08.xlsx` | The one real input file the product ingests |
