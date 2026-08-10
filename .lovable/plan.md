# Desk v5 — immersive luxury instrument, deeper run controls, accessibility pass

The desk already has catalog-backed editable fields with provenance, an evidence rail, a six-stage pipeline with a run log, multi-venue comparison, EN/ES/FR chrome, and a printable + PDF decision packet. This pass elevates presentation, interaction depth, and accessibility without touching the philosophy: education only, unknowns stay visible, fail closed when a setting is unresolved, no ranking of providers, no candidacy or outcome claims.

## 1. Immersive opening and page rhythm

- Replace the current header/hero with a full-bleed cinematic masthead: art-directed instrument still-life at large scale, oxblood field bleeding across the top, the publication title set as composition (deliberate line breaks, offset display type crossing the image edge) rather than a centered logo line.
- A live readout is welded into the masthead: current setting resolution, burden band, and count of fail-closed signals, set in mono against the display type, so the first screen already states the honest position of the desk.
- Scroll rhythm changes deliberately down the page: dark image band, bone working surface, oxblood chapter break before the packet, quiet parchment pause before the reference library. No five consecutive sections of equal visual weight.
- Two new art-directed images generated for the new bands (a low-light treatment-room band, a paper/consent-form macro used behind the packet chapter break), used full bleed with deliberate crops.

## 2. Maximalist typographic hierarchy

- Widen the display scale so section openings run genuinely large on desktop and recompose (not shrink) on mobile; mono data type stays small and tight against it for contrast.
- Numbered chapter marks on each desk section, bronze hairline rules with real weight difference, drop-style opening lines on section intros, and eyebrow labels kept mono and tracked.
- Voice pass over every heading and helper line: dry, exact, no reassurance, no marketing softness, no implied certainty.

## 3. Pipeline run management, deeper

- The run bar becomes a persistent stage stepper with: run all, run one, re-run from a chosen stage, stop a run in progress, and jump-to-work for any stage with open items.
- Each stage exposes its open items inline as clickable chips that focus the exact field that stage is blocked on.
- Run all animates through stages with progress and an `aria-live` announcement per stage; the run log gains stage name, duration, and what changed, plus expand/collapse and clear.
- A compact sticky run strip follows the reader down the page on desktop and collapses into a single-line status bar on mobile.

## 4. Interactive elements

- Signal rows become expandable: reading, source quote, catalog note, the one question that resolves it, and an inline editor — opened in place instead of navigating away.
- Hover/focus link between an evidence quote and the field it filled (both highlight), and a jump-back that scrolls the source into view with the sentence marked.
- Comparison matrix gains column focus (dim the others), per-signal row expansion, and a "show only differences" filter.
- Scenario loading gets a preview line stating what the scenario demonstrates before it overwrites the desk, with undo.

## 5. Decision packet as the finished object

- The on-screen packet is rebuilt as a typeset document: masthead, venue identification, signal ledger, refusals, open questions to ask, claim decode, burden statement, and the education-only limitation — with print styles that hold at small widths.
- PDF export updated to match the new packet order and to carry evidence quotes, refusals, and the run log.

## 6. Layout, accessibility, and flow assessment

- Full audit and fixes: single `main`, correct heading order, labeled fields, visible focus rings on every control, 44x44 minimum targets, roving focus in venue rail and mode bar, keyboard path through the whole pipeline, `aria-live` for stage and score changes, `h-dvh` for full-height bands.
- Contrast checked in both themes for every new band, including type over imagery (scrim where needed).
- Mobile recomposition verified for masthead, run strip, evidence rail, comparison matrix, and packet — no clipped chips, no collapsed rows.

## 7. Luxury theme

- Keep bone/oxblood/bronze/pine as the palette but use it dynamically: dominant color fields, oxblood chapter breaks, bronze focal detail, deep night-desk variant of every new band rather than an inverted document.
- Grain and hairline texture applied as material, not decoration; both themes reviewed side by side.

## Technical notes

- New components: `src/components/desk/Masthead.tsx`, `src/components/desk/StageStepper.tsx` (replaces `RunBar` usage), `src/components/desk/SignalRow.tsx`, `src/components/desk/Packet.tsx`.
- `src/lib/pipeline.ts` gains run orchestration state (progress, current stage, per-stage duration, stop) while `stageStatuses` stays a pure derivation.
- `src/styles.css`: extended display type scale, chapter-mark and scrim utilities, sticky run strip, print rules for the packet; tokens only, no hardcoded colors in components.
- `src/lib/packet-pdf.ts` updated for the new packet order; `src/lib/i18n.ts` extended for new chrome strings; `src/lib/engine.ts` and `compare.ts` scoring contracts unchanged.
- Two new images under `src/assets/`, imported directly.
- Verified with typecheck plus Playwright at 390px, 834px and 1280px in both themes: refresh-restore, run-all, stage jump, override flow, comparison filter, print and PDF export.
