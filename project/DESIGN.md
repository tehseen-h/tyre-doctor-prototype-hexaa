# DESIGN.md — TD One

TD One has its own design system. One line of reasoning per decision, so each can be defended on the call.

## Why not the Industry system

Phase 1 was built on the attached **Industry** design system, and every complaint about that pass traces back to its own written rules: *do not round cards*, *cards stay transparent line drawings*, *the `.blueprint` class plus four corner marks*, *a single accent #5980a6 on a light ground #f2f2f3*, *density 0.85×*, Barlow Condensed headings over 12 px tracked-out mono labels. Followed honestly, that produces a cold grey wireframe — accurate, and wrong for a repairer with dirty hands who will otherwise go back to a piece of paper.

Two things were kept: **Barlow Condensed as a display face** for large headings only, and **hairline structure** — borders and rules do the work, not heavy shadow. Everything else is new and defined below. No `.blueprint`, no corner registration marks, no square-cornered cards, no uppercase-mono section labels.

## The idea

The product is heavy rubber and steel, heat and cure time, hazard and compliance, and a shed with bays in it. Every visual decision refers to something real in that business. The cook oven card was the one thing in Phase 1 with energy, so it became the reference the rest of the product had to catch up to.

## Colour

One token set, `--td-*`, declared once per file and used everywhere. No inline hexes outside the token block except inside the drawn glyphs and evidence tiles, where they are pigment rather than interface colour.

| Token | Value | Reasoning |
|---|---|---|
| `--td-ground` | `#e9eff4` | Bright daylight with a blue lean, not grey. Cards are white on top of it, so the interface reads lit rather than washed out. |
| `--td-paper` | `#ffffff` | Cards have a body. In Phase 1 they were transparent outlines, which is why nothing had presence. |
| `--td-ink` / `-2` / `-3` | `#111c24` `#3d4d59` `#65757f` | Three text weights only. Anything below `-3` was not needed once labels became sentence case. |
| `--td-steel` | `#16303f` | Chrome, oven ground, drawer header. Steel is the material a rim is made of, and a dark bar at the top makes the light body brighter by contrast. |
| `--td-blue` | `#0d64ad` | The accent voice, on every primary action and every key figure. Saturated industrial blue — the blue of machinery and of Bridgestone and Michelin livery — not Phase 1's muted blue-grey. It carries energy while leaving amber free for hazard. |
| `--td-hazard` | `#f5a300` + a 135° black hatch | **Needs a person.** Purple has no meaning in a mining workshop; hazard tape does. The band is drawn as tape, and the amber-and-black pairing is what a person in PPE reads as *stop and decide*. Used in exactly two places: the escalation and the held rim rows. |
| `--td-heat` | `#d2542c` | The oven, and only the oven. Orange therefore always means curing. |
| `--td-pass` | `#1f8a4d` | A pass or a certificate. |
| `--td-fail` | `#c02a22` | A crack, a rejection, a blocked stage. |
| `--td-rubber` / `--td-lug` | `#edebe9` / `#dad5d1` | Faded, desaturated rubber for the card edges. Material, not brown. |

Deliberately absent: beige, cream, sand, tan, warm off-white, grey-on-grey, and the ochre ground the Phase 1 field screens used — that world is now differentiated by darkness and hi-vis instead (see Worlds).

### AA pairings in use

| Text | On | Ratio | Where |
|---|---|---|---|
| `#111c24` | `#e9eff4` | 14.1:1 | all body copy |
| `#3d4d59` | `#ffffff` | 8.6:1 | secondary copy |
| `#65757f` | `#ffffff` | 4.9:1 | field labels, meta (≥14 px) |
| `#ffffff` | `#0d64ad` | 6.1:1 | every primary button |
| `#0a4d87` | `#e7f1fb` | 7.9:1 | blue text on its tint |
| `#eaf3f8` | `#16303f` | 12.6:1 | header chrome, drawer, oven |
| `#241a00` | `#f5a300` | 8.2:1 | hazard band and hazard buttons |
| `#8a5a00` | `#fff6e2` | 6.4:1 | hazard text on its tint |
| `#146035` | `#e8f6ee` | 6.6:1 | pass text |
| `#8c1d16` | `#fdedeb` | 7.4:1 | fail text |
| `#f6c1a6` | `#16303f` | 8.1:1 | oven meta on the dark card |
| `#ffffff` | `#c02a22` | 5.4:1 | FAIL button |

Colour is never the only signal: held rows also carry a hatch band and the word *Held*, pass and fail also carry their words, and the oven also carries the largest number on the screen.

## Type

- **Barlow Condensed 600/700** for display only — page titles, bay names, card headings, big numeric labels. Nothing below 19 px is set in it.
- **Barlow 400/500/600** for everything functional: body copy, field labels, buttons, table cells, notes.
- **IBM Plex Mono** for IDs and figures only — job numbers, serials, quote numbers, certificate numbers, hours, millimetres, cook times, all with `tabular-nums`. These get read down a phone line and compared by eye, so digits must not be transposable. This is the product's signature, and it stays narrow on purpose.
- **Uppercase mono section labels are gone.** Phase 1 had them on nearly every element; they are now sentence-case Barlow at 15–16 px.
- Floor: 14 px is the absolute minimum for any label; body 16–17 px; primary actions 19–22 px. Field: body 17 px and up, targets 58–74 px.

## The tyre-edged card

A card is a piece of the product. Three scales of one idea:

1. **Hero** — 22 px radius, a faded rubber band with a tread-lug rhythm across the **top and bottom** edges, clean white through the middle where all text and values live. Job header, landing panels, certificates, rim record, summary panels.
2. **Reduced** — same radius, a **single** tread band on the top edge only. List cards, KPI cards, side panels. This is the version that repeats.
3. **Row** — 14 px radius and a **vertical tread tick** down the left edge, nothing more. The bay strips on the console, where a dozen appear at once.

Padding always exceeds the band height, so the motif never touches type and never sits behind a value. The oven card is the deliberate exception and keeps its heat treatment.

## The tyre glyph

Phase 1's glyph was a conic-gradient sunburst that read as a gear or a broken image. It is now a drawn OTR tyre: dark carcass, a dashed lug ring for tread blocks, a sidewall step, a steel hub and a centre bore — legible at 28 px in the header and at 104 px as the loading indicator. Rims are a separate glyph: concentric steel rings with three bolt dots, no rubber.

## Evidence tiles

We do not own tyre photographs and stock imagery reads as stock, so every photo is a **drawn evidence tile**: a vignetted charcoal ground, a lit subject with depth (serial plate, sidewall cut, whole tyre, cut-out cavity, repair patch, crack), a white inner hairline so it reads as a framed capture, and a metadata strip burned into the bottom the way a workshop photo carries it — time, person, stage, place. Nothing pretends to be a photograph, and nothing looks like a failed image load.

## Layout

- **The Floor Board is now wide bay strips, not narrow columns.** Each bay is a full-width row: name, plain-English kicker and count on the left, the tyres physically in it on the right. Ten cramped columns could not hold "Marrakoo Gold Operations" without breaking it; a strip holds any number of tyres and never wraps a customer name.
- **One primary action per screen**, always the same treatment: solid blue, largest target, leftmost in its group. On the Job File that is *Advance this tyre* at 21 px — in Phase 1 the primary was the quietest button on the page.
- **Needs a person sits at the top of the console**, above the board, because nothing behind it moves until someone decides.
- Buttons never wrap: every one carries `white-space: nowrap`.
- Structure comes from hairlines and one soft card shadow. Heavy shadow is reserved for the three things that genuinely float: the stage drawer, modals, and print sheets.
- Checked at 1280×800 for the call, and the field screens at phone width.

## Worlds

Four contexts, separated by chrome and density rather than four palettes — consistency is itself a usability requirement here.

- **Workshop floor and office** share one shell: steel chrome, light ground, blue accent. The difference is density — bays and big targets on the floor, tables and tabular figures in the office.
- **Mine site** is a dark night-blue ground with a hi-vis amber chip and a phone frame. Outdoors, glare, gloves. The phone screen itself stays light, because a bright screen is what is readable in the sun.
- **Customer** has no internal chrome at all: white header, calm ground, blue and green only, coarse language. A customer should never think they are looking at the workshop tool.

## Motion

Machinery, not silk. Four primitives: a 12 px rise-and-fade on first paint, a 240 ms slide for the stage drawer, a 660 ms eased travel with rotation when a tyre physically moves from one bay to the next, and determinate progress bars everywhere (row 7 of 18, 2 of 3 photos). The loading indicator is a rotating drawn OTR tyre at 104 px. All of it off under `prefers-reduced-motion`.

## Deliberate omissions

No prices or dollar amounts. No integration or sync badge — the quote number is a typed field labelled "Quote no. (from NetSuite)". No AI language, OCR or confidence scores. No fleet-inspection module, no login, no settings, no dark mode. Certificates carry a visible `PLACEHOLDER TEMPLATE` watermark because we have never seen the client's template. Nothing is labelled sample, demo or example.
