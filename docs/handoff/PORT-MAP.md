# Spa Intelligence — Handoff Record (internal)

Not reader-facing. Nothing in this directory is rendered by the application.

## Scope of this generation

One publication (Vanity or Vice), one route (`/`), one palette, one typography
system, one image plan, one composition map. The live Vercel build was used as
the baseline: its flows are client-state tabs on a single route, so this build
preserves that shape rather than inventing routes.

## Core philosophy — preserved verbatim in behavior

| Rule | Where it is enforced |
| --- | --- |
| Education only — no diagnosis, candidacy, ranking, clinical verdict | `src/lib/engine.ts` header contract; footer of `DecisionCard`; `Boundaries` section |
| Desire is allowed · the setting still has to answer | Hero eyebrow, `PromiseVsPlace` framing |
| Before you book — try the setting, not just the promise | Hero H1 |
| Fail-closed states stay visible | `SignalState = "fail-closed"`, `StateChip`, `chip-fail`, header counter |
| Unknowns stay on the desk | `Assessment.unknowns`, printed as its own packet block |
| No invented claims about outcomes/safety/results | Engine emits only readings about what was named; no outcome vocabulary |
| Credentials and setting reality over facility brand | `performer` weight 18 (highest); "Reputation substitution" claim rule |

## File-by-file port map (Lovable -> canonical repo)

| File | Class | Note |
| --- | --- | --- |
| `src/lib/engine.ts` | RETAIN | Pure, framework-free. Portable to any runtime as-is. Unit-test the signal matrix and `decodeClaims` before merge. |
| `src/lib/scenarios.ts` | RETAIN | Demo fixtures only. Labeled as demonstration in UI; no real facilities. |
| `src/components/desk/ui.tsx` | RETAIN | Primitives; depends only on tokens. |
| `src/components/desk/PromiseVsPlace.tsx` | RETAIN | Signature panel. Composition is load-bearing; port markup faithfully. |
| `src/components/desk/DecisionCard.tsx` | RETAIN | Print packet source. Verify print CSS in the canonical stack. |
| `src/components/desk/ClaimDecoder.tsx` | RETAIN | |
| `src/components/desk/Paths.tsx` | REWRITE | Split per canonical component conventions; state model is intentionally session-only. |
| `src/routes/index.tsx` | REWRITE | Route shell + head metadata to be re-expressed in the canonical router. |
| `src/styles.css` (tokens + `@utility` layer) | RETAIN (tokens) | Port token values verbatim. Do not re-derive. |
| `src/assets/*.jpg` | VERIFY | Generated imagery; confirm licensing policy before publication. |
| Everything else in the template | REJECT | Scaffold. Do not merge lockfiles, workflows, or runtime config. |

## WordPress port notes

- `PromiseVsPlace`, `DecisionCard`, and `ClaimLedger` are pure functions of one
  `Assessment` object — portable as a single script bundle plus a shortcode
  container; no server state, no persistence, no network.
- Session-only by design: no storage, no accounts, no analytics, no telemetry.
- Print packet relies on the `@media print` block and `.no-print`; both must
  survive theme CSS.

## Not performed in this generation

Publication, domains, backend, authentication, analytics, payments, persistence,
and canonical branch merges — all out of scope and unauthorized here.
