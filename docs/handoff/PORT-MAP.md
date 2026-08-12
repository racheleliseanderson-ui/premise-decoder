# Spa Intelligence — Handoff Record (internal)

Not reader-facing. Nothing in this directory is rendered by the application.

Companion files:

- `CONFORMANCE.md` — where each core rule is enforced in the code as it stands.
- `BEHAVIOR-CONTRACT.md` — the scoring and state behavior a port must not change silently.
- `WORDPRESS-PORT.md` — per-surface port shape for the publication runtime.

## Frozen state

| Item | Value |
| --- | --- |
| Publication | Vanity or Vice · Spa Intelligence |
| Route surface | one route, `/` — all flows are client-state modes on that route |
| Frozen commit | `048b299` |
| Modes on the route | fast, full, decoder, intake, prep, compare, library, packet |
| Venue blocks | up to 5, session-only |
| Interface languages | EN · ES · FR |
| Themes | light desk · dark desk (night) |
| Persistence | this browser's `localStorage` only |
| Network calls | none |

## Scope of this generation

One publication, one route, one palette, one typography system, one image plan,
one composition map. The live build was the baseline; its shape (client-state
modes on a single route) was preserved rather than replaced with a route tree.

## File-by-file port map

### Engine and data (`src/lib/`)

| File | Class | Note |
| --- | --- | --- |
| `engine.ts` | RETAIN | Pure, framework-free. Signals, scoring, burden, posture, claim rules, 9 setting types, 14 jurisdictions. Unit-test the signal matrix, `burdenOf`, and `decodeClaims` before merge. |
| `catalog.ts` | RETAIN | 55 service lines, 44 products/devices, alias matchers and pickers. Data only; review entries against canonical editorial policy before publication. |
| `pipeline.ts` | RETAIN | Six-stage status derivation (intake · identify · agency · practice · decode · score). Pure function of one `EvalInput`. |
| `extract.ts` | RETAIN | Pasted-text extractor. Returns proposals with source sentences; never writes a field without a quote. |
| `compare.ts` | RETAIN | Builds the multi-venue matrix from `Assessment[]`. Pure. |
| `reference.ts` | RETAIN | 7 class references, 10 glossary entries, 5 verification desks. Editorial content — re-read before publication. |
| `session.ts` | REWRITE | Correct model, browser-specific storage. Keep the schema, provenance record, and `MAX_VENUES`; re-express storage per canonical conventions. Key is `spa-intel-desk-v3` / `spa-intel-sets-v3`, schema 3. |
| `i18n.ts` | REWRITE | Key set and copy RETAIN; the hook and storage layer follow canonical i18n. |
| `theme.ts` | REWRITE | Token switch is correct; canonical stack likely already owns theme state. |
| `packet-pdf.ts` | VERIFY | `jspdf` via dynamic import. Confirm the dependency is acceptable canonically; otherwise re-target the same layout at the canonical PDF path. |
| `scenarios.ts` | VERIFY | 10 demonstration fixtures. No real facility is named; confirm that stays true and that the UI keeps labelling them as demonstrations. |
| `fields.ts` | RETAIN | Shared field DOM id helper. Trivial, but the evidence rail's jump-to-field depends on it. |
| `utils.ts` | REJECT | Template scaffold. |
| `error-capture.ts`, `error-page.ts`, `lovable-error-reporting.ts` | REJECT | Environment instrumentation. Never merge. |

### Desk components (`src/components/desk/`)

| File | Class | Note |
| --- | --- | --- |
| `Packet.tsx` | RETAIN | Setting Decision Packet. Print-critical: depends on `.packet`, `.packet-block`, `.packet-h`, `@media print`, `@page`. Port markup and CSS together. |
| `PromiseVsPlace.tsx` | RETAIN | Signature panel; composition is load-bearing. Port markup faithfully. |
| `Compare.tsx` | RETAIN | Matrix on desktop, stacked cards on mobile. Both branches are required behavior, not a convenience. |
| `ClaimDecoder.tsx` | RETAIN | Claim ledger. Pure function of `DecodedClaim[]`. |
| `EvidenceRail.tsx` | RETAIN | Provenance and source quotes with jump-to-field. |
| `StageStepper.tsx` | RETAIN | Pipeline controls, blocked-field chips, run log. |
| `Field.tsx` | RETAIN | `FieldEditor` — catalog search, provenance badge, refusal control. The refusal path is behavior, not decoration. |
| `Library.tsx` | RETAIN | Reference library surface. |
| `VenueIntake.tsx` | RETAIN | Paste, review proposals with citations, selectively fill. |
| `Masthead.tsx` | RETAIN | Cinematic opening; depends on `room-night.jpg`, `scrim-oxblood`, `display-2xl`, `btn-lux`. |
| `ui.tsx` | RETAIN | Primitives; depend only on tokens. |
| `VenueBar.tsx` | REWRITE | Block switching, duplicate, rename, saved sets. Correct behavior, storage-coupled. |
| `DecisionCard.tsx` | REWRITE | Superseded by `Packet` for the printable document; keep only if the canonical desk still wants the short on-screen summary. |
| `Paths.tsx` | REWRITE | Fast / full / prep forms. Split per canonical component conventions; state model is intentionally session-only. |

### Shell, tokens, assets

| File | Class | Note |
| --- | --- | --- |
| `src/styles.css` — token layer, `@theme`, `@utility`, print block | RETAIN (values) | Port token values verbatim. Do not re-derive the palette or the print rules. |
| `src/styles.css` — scaffold remainder | REJECT | Template base. |
| `src/routes/index.tsx` | REWRITE | Route shell, mode switching, autosave wiring, head metadata. Re-express in the canonical router; the mode set and the autosave debounce are the parts that matter. |
| `src/routes/__root.tsx`, `src/router.tsx`, `src/start.ts`, `src/server.ts`, `vite.config.ts` | REJECT | Runtime scaffold. Do not merge a React/TanStack runtime into canonical. |
| `src/components/ui/*` (shadcn scaffold) | REJECT | Unused by the desk surfaces listed above. |
| `src/assets/*.jpg` | VERIFY | See asset note below. |
| lockfile, workflows, config, `robots.txt` | REJECT | Canonical owns these. |

## Dependencies a port actually needs

Only `jspdf` (PDF packet, dynamically imported). Everything else the desk uses
is React, the token layer, and its own modules. No Radix component is required
by any desk surface. Do not carry the rest of the scaffold's dependency list.

## Data and privacy

- All session state is this browser's `localStorage` under `spa-intel-desk-v3`
  (autosave, ~450ms debounce) and `spa-intel-sets-v3` (named saved sets),
  schema version 3. Nothing is transmitted; there is no telemetry, no account,
  no analytics, no server state, and nothing to migrate on port.
- Rename the storage key when the desk moves runtime. A stale key from a
  different host would silently restore blocks a reader did not create; a
  version bump with no reader-visible loss is the safe move.
- Catalogs, scenarios and reference entries are demonstration and educational
  fixtures. No real facility, practitioner or price is named. Keep it that way:
  a named facility would turn a disclosure instrument into a claim about that
  facility.
- Provenance is recorded, never inferred. Origins are: entered by you, read from
  pasted text, demonstration scenario, chosen from catalog, asked · no answer
  given. A port must not add a sixth origin that means "assumed".

## Assets

| File | Used by | Note |
| --- | --- | --- |
| `room-night.jpg` | `Masthead` | Opening frame. Load-bearing for the concept. |
| `consent-paper.jpg` | chapter break in `index.tsx` | Scroll-rhythm pause. |
| `hero-tray.jpg` | desk sections | Instrument still-life. |
| `sanitation.jpg` | sanitation surfaces | Sterile-pouch macro. |
| `device.jpg` | product/device surfaces | Device macro. |

All five are generated imagery. Licensing policy confirmation is still owed
before publication; treat every one as VERIFY, not RETAIN.

## Known limits

- Extraction is pattern-based, not semantic. It proposes; it never silently
  fills. A port that auto-applies proposals breaks the provenance rule.
- Jurisdiction notes are orientation, not legal advice, and go stale.
- The comparison matrix is designed against 5 blocks. More blocks need a layout
  decision, not just a raised constant.
- PDF layout is tuned to the current field set. Adding fields requires
  re-checking pagination in both the print CSS and `packet-pdf.ts`.

## Not performed and not authorized here

Publication, custom domains, backend, authentication, analytics, payments,
persistence beyond the browser, remote data of any kind, production secrets, and
canonical branch merges. This record tells you which files to take from commit
`048b299` and what to leave behind; the merge itself happens in the canonical
repository.
