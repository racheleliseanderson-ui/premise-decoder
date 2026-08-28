# Spa Intelligence — Handoff Record (internal)

Not reader-facing. Nothing in this directory is rendered by the application.

Companion files:

- `CONFORMANCE.md` — where each core rule is enforced in the code as it stands.
- `BEHAVIOR-CONTRACT.md` — the scoring and state behavior a port must not change silently.
- `WORDPRESS-PORT.md` — per-surface port shape for the publication runtime.
- `CI-DEPLOY.md` — verification gates and build/deploy shape.

## Frozen state

| Item | Value |
| --- | --- |
| Publication | Vanity or Vice · Spa Intelligence |
| Frozen commit | `90173e1` |
| Route surface | 9 routes: `/` (redirect to `/fast-path`) plus 8 panel routes |
| Panel routes | `/fast-path` · `/venue-text` · `/evaluate` · `/compare` · `/consult-prep` · `/claim-decoder` · `/library` · `/packet` |
| Shared state | one desk context (`src/lib/desk-context.tsx`) above the panel routes |
| Venue blocks | up to 5, session-only |
| Interface languages | EN · ES · FR (shell labels localise; publication and app names stay in English) |
| Themes | light desk · dark desk (night) · CVD |
| Persistence | this browser's `localStorage` only |
| Network calls | none at runtime |
| Verification | `bun run lint`, `bun run typecheck`, `bun run build`, `bun run test:e2e` (26 Playwright tests, desktop + mobile) |

The single-route client-mode shape described in earlier records is superseded:
each panel is now a real, linkable, indexable route. The mode identifiers
survive as the URL mapping in `src/lib/modes.ts`.

## Scope of this generation

One publication, one palette, one typography system, one image plan, one
composition map. The live build was the baseline and was elevated, not replaced.

## Fleet Shell Standard v1 compliance

This build implements the Northern Lantern House Fleet Shell Standard v1:

- House bar: one row, six nav items, language and display-mode pills, full
  "Northern Lantern House Labs" wordmark at every width.
- Hero: full-bleed photograph (`room-night.jpg`), min 62vh desktop / 70vh mobile,
  one headline, one subline, one primary CTA, one secondary link. Metrics and
  controls live below the fold.
- Working surface: the desk instrument starts below the hero.
- Labs footer: gold hairline, three columns (The House · This publication ·
  Across the fleet), bottom rule with house links.
- Palette: navy `#101828` / pearl `#F4F1EA` house grounds; gold `#C8A34A` reserved
  for the Labs wordmark and footer hairline only; app accent oxblood `#6E1F26`
  carries every CTA and state.
- Fleet link registry in `src/lib/fleet.ts` is the single source of truth for
  the house bar and footer. See §5 of `CONFORMANCE.md`.

## File-by-file port map

### Engine and data (`src/lib/`)

| File | Class | Note |
| --- | --- | --- |
| `engine.ts` | RETAIN | Pure, framework-free. Signals, scoring, burden, posture, claim rules, setting types, jurisdictions. Unit-test the signal matrix, `burdenOf`, and `decodeClaims` before merge. |
| `catalog.ts` | RETAIN | Service lines, products/devices, alias matchers and pickers. Data only; review entries against canonical editorial policy before publication. |
| `pipeline.ts` | RETAIN | Six-stage status derivation (intake · identify · agency · practice · decode · score). Pure function of one `EvalInput`. |
| `extract.ts` | RETAIN | Pasted-text extractor. Returns proposals with source sentences; never writes a field without a quote. |
| `compare.ts` | RETAIN | Builds the multi-venue matrix from `Assessment[]`. Pure. |
| `reference.ts` | RETAIN | Class references, glossary, verification desks. Editorial content — re-read before publication. |
| `terms.ts` | RETAIN | Glossary term definitions behind the inline term tips. Editorial content. |
| `fields.ts` | RETAIN | Shared field DOM id helper; the evidence rail's jump-to-field depends on it. |
| `modes.ts` | RETAIN (mapping) | Mode ids, labels, and their URLs. The mapping is the contract between panels and routes; re-express the paths if canonical URL policy differs. |
| `fleet.ts` | RETAIN | Northern Lantern House fleet link registry (Fleet Shell Standard v1 §5). Single source for house bar and footer links. |
| `desk-context.tsx` | REWRITE | Correct single source of desk state (blocks, active block, assessment, autosave, exports). React-specific; re-express in the canonical state layer, preserving the field set and the autosave debounce. |
| `session.ts` | REWRITE | Correct model, browser-specific storage. Keep the schema, provenance record, and `MAX_VENUES`. Keys are `spa-intel-desk-v3` / `spa-intel-sets-v3`, schema 3. |
| `i18n.ts` | REWRITE | Key set and copy RETAIN; the hook and storage layer follow canonical i18n. Shell labels now localise while publication/app names stay in English. |
| `lang-context.tsx` | REWRITE | React context wrapper for interface language. Re-express in canonical i18n layer. |
| `theme.ts` | REWRITE | Token switch is correct (light / dark / CVD); canonical stack likely already owns theme state. |
| `seo.ts` | REWRITE | Share metadata for `spa.vanityvice.blog`: titles, descriptions, canonical origin. The share image is overridden in `__root.tsx` to the WordPress-hosted photograph. Values RETAIN; emission moves to the canonical head/meta layer. |
| `packet-pdf.ts` | VERIFY | `jspdf` via dynamic import. Confirm the dependency is acceptable canonically; otherwise re-target the same layout at the canonical PDF path. |
| `scenarios.ts` | VERIFY | Demonstration fixtures. No real facility is named; confirm that stays true and that the UI keeps labelling them as demonstrations. |
| `utils.ts` | REJECT | Template scaffold. |
| `error-capture.ts`, `error-page.ts`, `error-reporting.ts` | REJECT | Environment instrumentation. Never merge. |

### Desk components (`src/components/desk/`)

| File | Class | Note |
| --- | --- | --- |
| `Packet.tsx` | RETAIN | Setting Decision Packet. Print-critical: depends on `.packet`, `.packet-block`, `.packet-h`, `@media print`, `@page`. Port markup and CSS together. |
| `PromiseVsPlace.tsx` | RETAIN | Signature panel; composition is load-bearing. Port markup faithfully. |
| `Compare.tsx` | RETAIN | Matrix on desktop, stacked cards on mobile. Both branches are required behavior. |
| `ClaimDecoder.tsx` | RETAIN | Claim ledger. Pure function of `DecodedClaim[]`. |
| `EvidenceRail.tsx` | RETAIN | Provenance and source quotes with jump-to-field. |
| `StageReadout.tsx` | RETAIN | Pipeline stage state, blocked-field chips, run log. |
| `Field.tsx` | RETAIN | `FieldEditor` — catalog search, provenance badge, refusal control. The refusal path is behavior, not decoration. |
| `Library.tsx` | RETAIN | Reference library surface. |
| `VenueIntake.tsx` | RETAIN | Paste, review proposals with citations, selectively fill. |
| `InfoTip.tsx`, `TermTip.tsx` | RETAIN | Inline explanation primitives; keyboard and touch behavior is part of the accessibility pass. |
| `ui.tsx` | RETAIN | Primitives; depend only on tokens. |
| `DeskPanel.tsx` | REWRITE | Maps the current mode to a panel. Thin; re-express as the canonical router's per-route rendering. |
| `DeskLayout.tsx` | REWRITE | Fleet shell wrapper: house bar, hero, working surface, results, demos, chapter break, method, Labs footer. Composition RETAIN, framework wiring REWRITE. |
| `VenueBar.tsx` | REWRITE | Block switching, duplicate, rename, saved sets. Correct behavior, storage-coupled. |
| `DecisionCard.tsx` | REWRITE | On-screen summary; superseded by `Packet` for the printable document. Keep only if the canonical desk still wants the short readout. Carries the `data-testid` hooks the e2e suite asserts on. |
| `Paths.tsx` | REWRITE | Fast / full / prep / decoder forms. Split per canonical component conventions; state model is intentionally session-only. |
| `Masthead.tsx` | REJECT | Replaced by the fleet shell `Hero` component. Do not merge. |

### Shell components (`src/components/shell/`)

| File | Class | Note |
| --- | --- | --- |
| `HouseBar.tsx` | RETAIN | Fleet house bar per §3.1. Full wordmark, publication link, six nav items, language and theme pills. Port markup and behavior together. |
| `Hero.tsx` | RETAIN | Full-bleed hero per §3.2. Depends on `room-night.jpg`, `scrim-hero`, `btn-accent`. Port markup and CSS together. |
| `LabsFooter.tsx` | RETAIN | Fleet footer per §5. Gold hairline, three columns, fleet registry. Port markup and CSS together. |

### Shell, tokens, tests, assets

| File | Class | Note |
| --- | --- | --- |
| `src/styles.css` — token layer, `@theme`, `@utility`, print block | RETAIN (values) | Port token values verbatim. Includes Fleet Shell Standard v1 house palette (navy, pearl, gold) and app accent (oxblood). Do not re-derive the palette or the print rules. |
| `src/styles.css` — scaffold remainder | REJECT | Template base. |
| `src/routes/index.tsx` | REWRITE | Landing redirect to `/fast-path`. Decide canonically whether `/` redirects or renders the fast path directly. |
| `src/routes/{fast-path,venue-text,evaluate,compare,consult-prep,claim-decoder,library,packet}.tsx` | REWRITE | Each is a ~7-line file: head metadata plus `<DeskPanel mode="…" />`. Re-express as canonical routes; the per-route title/description pairs are the part that matters. |
| `src/routes/__root.tsx` | REWRITE (metadata only) | Document shell, font links, and the emitted share meta. The `og:image` / `twitter:image` are overridden to the WordPress-hosted photograph (`spa-3.jpg` at 1200×630). Take the metadata values and the override pattern; leave the runtime shell behind. |
| `src/router.tsx`, `src/start.ts`, `src/server.ts`, `vite.config.ts` | REJECT | Runtime scaffold. Do not merge a React/TanStack runtime into canonical. Note `scrollRestoration: false` — the desk relies on it; whatever runtime hosts the panels needs the same behavior. |
| `e2e/desk-flow.spec.ts`, `playwright.config.ts` | VERIFY | 13 scenarios × desktop and mobile. The assertions describe required behavior and are worth porting; the selectors assume this markup, so re-point them rather than copying blind. |
| `.github/workflows/ci.yml` | REJECT | Canonical owns its own workflows. `CI-DEPLOY.md` records which gates must exist. |
| `src/components/ui/*` (shadcn scaffold) | REJECT | Unused by the desk surfaces above. |
| `src/assets/*.jpg` | VERIFY | See asset note below. |
| `public/og/*` | REJECT | The local OG card is no longer used; share image is served from the publication's WordPress media library. |
| lockfile, config, `robots.txt` | REJECT | Canonical owns these. |

## Dependencies a port actually needs

Only `jspdf` (PDF packet and comparison PDF, dynamically imported). Everything
else the desk uses is React, the token layer, and its own modules. No Radix
component is required by any desk surface. Do not carry the rest of the
scaffold's dependency list.

## Data and privacy

- All session state is this browser's `localStorage` under `spa-intel-desk-v3`
  (autosave, ~450ms debounce) and `spa-intel-sets-v3` (named saved sets),
  schema version 3. Nothing is transmitted; there is no telemetry, no account,
  no analytics, no server state, and nothing to migrate on port.
- Rename the storage key when the desk moves runtime. A stale key from a
  different host would silently restore blocks a reader did not create.
- Catalogs, scenarios and reference entries are demonstration and educational
  fixtures. No real facility, practitioner or price is named. Keep it that way.
- Provenance is recorded, never inferred. Origins are: entered by you, read from
  pasted text, demonstration scenario, chosen from catalog, asked · no answer
  given. A port must not add a sixth origin that means "assumed".

## Assets

| File | Used by | Note |
| --- | --- | --- |
| `room-night.jpg` | `Hero` | Opening frame. Load-bearing for the concept. |
| `consent-paper.jpg` | chapter break in `DeskLayout` | Scroll-rhythm pause. |
| `hero-tray.jpg` | desk sections | Instrument still-life. |
| `sanitation.jpg` | sanitation surfaces | Sterile-pouch macro. |
| `device.jpg` | product/device surfaces | Device macro. |

All five are generated imagery. Licensing policy confirmation is still owed
before publication; treat every one as VERIFY, not RETAIN. The share image is
separate: it is served from the publication's own media library and is not one
of these files.

## Known limits

- Extraction is pattern-based, not semantic. It proposes; it never silently
  fills. A port that auto-applies proposals breaks the provenance rule.
- Jurisdiction notes are orientation, not legal advice, and go stale.
- The comparison matrix is designed against 5 blocks. More blocks need a layout
  decision, not just a raised constant.
- PDF layout is tuned to the current field set. Adding fields requires
  re-checking pagination in both the print CSS and `packet-pdf.ts`.
- Panels are client-rendered below the shell; per-route head metadata is the
  only server-visible difference between them. A canonical port that needs
  crawlable panel content has to render it server-side.

## Not performed and not authorized here

Publication, custom domains, backend, authentication, analytics, payments,
persistence beyond the browser, remote data of any kind, production secrets, and
canonical branch merges. This record tells you which files to take from commit
`90173e1` and what to leave behind; the merge itself happens in the canonical
repository.
