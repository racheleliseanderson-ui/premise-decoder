# Desk v4 — evidence, catalogs, overrides, pipeline controls

Elevates the existing multi-venue desk. Philosophy unchanged: education only, unknowns stay visible, fail closed when a setting is unresolved, no ranking of providers and no candidacy or outcome claims.

## 1. Evidence highlights

- Every extracted or entered field carries its provenance: pasted text, typed by you, scenario, or unresolved. Each signal reading shows the exact source sentence with the matched phrase highlighted in place.
- New "Evidence" rail on Fast Path, Full Evaluate and the Decision Packet: quoted sentence, which field it filled, which signal it moved, and a jump-back link to the pasted source with that sentence scrolled into view and marked.
- Inference is never silent: a field filled from text is labeled as read from the text, not stated by the venue. Anything not literally supported stays fail closed.

## 2. Field override and inline editing

- Every field on the desk becomes directly editable, including fields filled by extraction. Overriding an extracted value flips its provenance to "you edited" and keeps the original quote visible for contrast.
- Per-field controls: accept proposal, reject proposal, edit, mark "asked, no answer given" (a distinct state from empty — it records refusal), and revert to source.
- "Asked, no answer" is treated as a hard fail-closed with stronger burden than plain silence, since a declined answer is information.

## 3. Service and menu-line coverage

- Menu line becomes an assisted field with a large searchable catalog of real service names and their common marketing aliases, grouped by service class, so an entered line maps to a class instead of falling back to "unclear".
- Coverage spans injectables, energy devices, skin resurfacing, body contouring, hair removal, IV and infusion, oxygen and hyperbaric, PRP and microneedling, threads, peels and facials, massage and bodywork, hydrotherapy, sauna and cold, lash and brow, nail and waxing, permanent makeup and tattoo-adjacent, dental-adjacent aesthetics, weight and hormone programs, and diagnostics.
- Free text is still allowed and still scored; the catalog only helps the reader name what they were sold.

## 4. Product and device intelligence

- Product / device becomes a catalog-backed field covering the named brands and platforms the reader actually sees on menus: toxins, fillers and biostimulators, lasers and light platforms, RF and RF microneedling, ultrasound, cryolipolysis and EMS, microneedling systems, peel lines, and common infusion contents.
- Each catalog entry carries education-only attributes: category, what class of setting normally runs it, whether the name is a device platform or a trade name, and what the name alone does not tell you.
- A generic entry ("medical-grade laser", "custom booster") is explicitly flagged as an unnamed product, not accepted as a resolution.

## 5. Expanded intake knowledge base and dynamic extraction

- The extractor gains coverage for the catalogs above plus staffing titles, supervision phrasing, sterilization and single-use language, consent and medical-history language, aftercare and escalation, pricing and package pressure, membership and financing language, and jurisdiction mentions.
- Multi-source intake: paste several sources into one venue block (site copy, DM, email, price list) with per-source labeling, so evidence quotes say which source they came from and conflicts between sources are surfaced rather than merged.
- Conflict panel: when two sources answer the same field differently, both are shown and the field stays unresolved until you choose.

## 6. Expanded claim decoder

- Larger rule set across permanence, universality, medical borrowing, credential borrowing, safety absolutes, results guarantees, downtime minimization, urgency and scarcity, price framing, natural/organic framing, testimonial framing, and comparative superiority.
- Each decoded claim shows the quoted phrase, what it implies, what it does not establish, and the one question that would resolve it. Severity is described, never scored as a verdict on the business.

## 7. Pipeline run controls

- The evaluation becomes an explicit, replayable pipeline: intake, extraction, field resolution, scoring, claim decode, packet. A run bar shows each stage with status and count of items resolved or left open.
- Controls: run all, run one stage, re-run extraction after editing a source, reset a stage, and a run log with timestamps and what each stage changed. Nothing runs invisibly.
- Runs are per venue block and included in autosave.

## 8. Interaction, touch and accessibility

- All controls reach 44x44 minimum touch targets; catalog pickers, venue rail, mode bar and evidence rail are swipe- and keyboard-navigable with visible focus rings.
- Full keyboard path through the pipeline, roving focus in the venue rail, aria-live announcements for stage completion and score change, labeled form fields, single `main`, correct heading order, and `h-dvh` for full-height regions.
- Layout and flow pass: mobile recomposition of the comparison matrix and evidence rail, no clipped chips, printable packet at small widths, both themes checked for contrast.

## 9. Aesthetic direction

Luxury editorial meets instrument panel — maximalist Fifth Avenue, not soft wellness. Dominant oxblood and bone fields, bronze rules, deep display type at large scale against monospaced data, dense asymmetric composition, art-directed imagery already in the project used at full bleed with deliberate crops. Voice stays precise, dry and honest: no reassurance, no marketing softness, no false certainty.

## 10. Language switcher

Feasible for interface language. Ships English plus Spanish and French for interface chrome, field labels, questions, and the packet headings, with a switcher in the header persisted alongside theme. Engine readings that quote your pasted text stay in the original language and are labeled as such, since translating a quote would misrepresent evidence.

## Technical notes

- New `src/lib/catalog.ts` (services, aliases, devices/products with attributes) and `src/lib/claims.ts` (extracted rule set), keeping `engine.ts` as pure scoring.
- `EvalInput` fields become `{ value, provenance, quote, sourceId, state }` records with a migration in `session.ts`; `assess()` gains an "asked, no answer" state and keeps its signal contract.
- `src/lib/pipeline.ts`: stage definitions, run log, and per-block run state persisted in the existing versioned store.
- `src/lib/extract.ts`: multi-source input, per-source ids, conflict detection, catalog-driven matching.
- New components under `src/components/desk/`: `EvidenceRail.tsx`, `FieldEditor.tsx`, `CatalogPicker.tsx`, `RunBar.tsx`, `SourceStack.tsx`.
- `src/lib/i18n.ts` with a small typed dictionary and `useLocale()`; no new dependency.
- `src/lib/packet-pdf.ts` gains evidence quotes and run log; comparison packet updated.
- Verified with typecheck plus Playwright at mobile, tablet and desktop widths in both themes, including refresh-restore, override flow, and PDF export.
