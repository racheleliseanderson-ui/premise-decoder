# Handoff — Grok elevation → live desk

Companion to `docs/handoff/` at the repo root. Frozen baseline commit for the live app: `90173e1`. This directory is the elevated instrument built against that baseline.

## How to use this directory

Do **not** swap runtimes. The live app stays Vite + TanStack File Router + Fleet Shell. Copy behavior from here into the existing files.

| This directory | Live app target | Class |
| --- | --- | --- |
| `src/lib/engine/evaluate.ts` | `src/lib/engine.ts` (signals, scoring, burden, posture) | MERGE — take fail-closed matrix, unselected class, declined-as-worse-than-omission |
| `src/lib/engine/claims.ts` | claim rules inside `src/lib/engine.ts` | MERGE — marketing-sentence decoder |
| `src/lib/engine/extract.ts` | `src/lib/extract.ts` | VERIFY — still proposes with quotes; never auto-fills |
| `src/lib/engine/questions.ts` | consult-prep copy in `src/components/desk/Paths.tsx` | MERGE |
| `src/lib/engine/sensitivity.ts` | *(new)* What-if probes | ADD — new panel; does not exist on the live desk |
| `src/lib/engine/types.ts` | types in `engine.ts` / `session.ts` | MERGE — keep `unselected` service class |
| `src/lib/engine/evaluate.test.ts` | *(new tests)* | ADD |
| `src/lib/data/catalog.ts` | `src/lib/catalog.ts` | VERIFY — review entries against editorial policy before publication |
| `src/lib/data/demos.ts` | `src/lib/scenarios.ts` | VERIFY — keep labelling them as demonstrations |
| `src/lib/data/editorial.ts` | `src/lib/seo.ts` + fleet copy | VERIFY |
| `src/components/desk-app.tsx` | `Paths.tsx`, `DeskLayout.tsx`, `VenueBar.tsx` | REWRITE into existing components — do not drop in as a second shell |
| `src/components/result-card.tsx` | `DecisionCard.tsx` + `PromiseVsPlace.tsx` | MERGE |
| `src/components/bits.tsx` | `src/components/desk/ui.tsx` | MERGE tokens/primitives |
| `src/lib/store.ts` | `desk-context.tsx` + `session.ts` | REWRITE — keep schema/provenance; rename storage key on port |
| `src/styles.css` | token layer in `src/styles.css` | RETAIN values (navy `#101828`, pearl `#F4F1EA`, gold `#C8A34A`, oxblood `#6E1F26`) |
| `public/images/room-night.jpg` | `src/assets/room-night.jpg` | VERIFY — same still, already in the live app |
| `public/images/consent-paper.jpg` | `src/assets/consent-paper.jpg` | VERIFY |

## Required behavior a merge must not drop

From `docs/handoff/BEHAVIOR-CONTRACT.md`, plus:

1. Empty desk does **not** score as Facial. Service class sentinel is `unselected`.
2. Asked · no answer is worse than blank. Refusal is a recorded state.
3. Extraction proposes; the reader accepts. No silent fill.
4. What-if probes are educational. They do not invent a setting fact.
5. Print packet uses `.no-print` / `@media print`. Port markup and CSS together.
6. No accounts, no server, no telemetry.

## What this directory is not

- Not a deployable second app.
- Not a replacement for `src/components/shell/*` (HouseBar, Hero, LabsFooter).
- Not authorized to change publication, domain, or canonical branch policy.
