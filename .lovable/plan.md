# Multi-venue desk, saved sessions, mobile, expanded settings

Elevates the existing desk. Same philosophy: education only, unknowns stay visible, fail closed when identity is unresolved. Nothing is inferred on your behalf.

## 1. Autosave and named saved sets

- Every change to a venue block autosaves locally (debounced), including Fast Path, Full Evaluate, pasted venue text and the Claim Decoder input.
- On return, the desk restores the last session automatically, with a quiet line stating when it was saved and a "Clear the desk" control.
- A "Saved sets" drawer lists your saved venue sets with name, venue count and date. You can save the current desk under a name, reopen, rename, duplicate or delete.
- Storage stays local to the browser only — no account, no upload, no server. Stated plainly in the UI so nobody assumes their notes were sent anywhere.

## 2. Multiple venue blocks and comparison

- The desk holds up to 5 venue blocks. Each block keeps its own inputs, extraction evidence, score, burden and fail-closed list.
- A venue switcher bar (tabs on desktop, horizontal scroll chips on mobile) with add, duplicate and remove; the active block feeds every existing mode.
- New "Compare" mode: one row per evaluated signal, one column per venue, showing known / partial / fail closed plus setting resolved %, promise-vs-place gap and burden band. Ties and gaps are shown as-is — no winner is declared and no venue is recommended.
- Compare view also lists "resolved by one venue, silent in another" so the reader knows which questions to carry back.
- Decision Packet and PDF gain a mode: current venue, or a comparison packet covering all blocks.

## 3. Expanded spa / med-spa knowledge and settings

- Setting types expand beyond day-spa / med-spa / clinic / unclear to include: hotel and resort spa, salon suite or booth rental, mobile and in-home, wellness or recovery studio, dermatology or plastic-surgery practice, and dental-adjacent aesthetics. Each carries its own expectation profile — who is normally on site, what supervision language should exist, what an unresolved answer means there.
- Reference Library gains a settings section comparing those setting types against service classes, so the difference between a spa facial and a med-spa treatment is explicit rather than implied.
- Jurisdiction layer: an optional state/region field on each venue block. Selecting one surfaces general, education-only oversight notes (which board type typically oversees which practice category, what "supervision" commonly means as a term) with an explicit note that this is not legal advice, rules change, and the facility must still answer for itself. No claim about any specific business.
- Scoring stays fail-closed: a setting type or jurisdiction that raises the bar makes silence more visible, never less.

## 4. Mobile

- The desk becomes fully usable on a phone: mode bar becomes a scrollable segmented strip, hero and rails restack, venue tabs scroll, comparison uses a stacked per-signal card layout instead of a wide table.
- Header row rebuilt with the grid + min-w-0 + shrink-0 pattern so the fail-closed chip and theme toggle never clip.
- Forms, textareas and the intake review list get touch-sized targets; the Decision Packet stays readable and printable at small widths.

## Technical notes

- `src/lib/session.ts`: versioned localStorage schema (`{ version, activeId, venues[], sets[] }`), debounced writes, safe migration and quota failure fallback, hydration-safe read in `useEffect`.
- `src/lib/engine.ts`: extend `Venue` union with new setting types, add `region` to `EvalInput`, add setting-expectation and jurisdiction tables; keep `assess()` pure and its existing signal contract.
- `src/lib/compare.ts`: derive a comparison matrix from an array of `Assessment`.
- `src/routes/index.tsx`: state moves from a single `EvalInput` to a venue collection plus `activeId`; add `compare` and saved-sets UI.
- New components under `src/components/desk/`: `VenueTabs.tsx`, `Compare.tsx`, `SavedSets.tsx`, `RegionNote.tsx`.
- `src/lib/packet-pdf.ts`: add a multi-venue comparison packet path.
- `src/lib/extract.ts`: recognise the new setting types and region mentions in pasted text, still quoting the source sentence.
- Verified with typecheck plus Playwright runs at mobile and desktop widths, both themes, including refresh-restore and PDF export.
