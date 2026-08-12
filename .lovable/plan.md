# Handoff record refresh

The existing handoff note in `docs/handoff/` predates the last three rounds of work. It still describes a single-input desk with five files, so it no longer matches what is actually here: multi-venue blocks, evidence provenance, pipeline stages, catalogs, the cinematic masthead, the language switcher, the theme toggle, and the printable Setting Decision Packet.

This plan brings the handoff record up to date so the desk can be carried into the canonical repository and the WordPress runtime without guesswork.

## What gets written

**1. Refreshed port map** — one row per file that exists today, each classed RETAIN / REWRITE / VERIFY / REJECT, with a short note on why. Covers all 14 desk components, all 16 library modules, the five images, the token layer, and the route shell.

**2. Philosophy conformance table** — each core rule (education only, no diagnosis, no candidacy, no ranking, desire is allowed but the setting must answer, refusals are decisions, unknowns stay visible, credentials over brand) mapped to the exact place it is now enforced, so a reviewer can verify none of it was diluted during the visual work.

**3. Behavior contract** — the parts a port must not silently change: the eight-signal weighting and 0-100 resolution scale, the refusal state and its burden penalty, the burden bands, the posture thresholds, claim-rule severities, and the rule that a higher resolution figure means more was disclosed and nothing else.

**4. WordPress port map** — for each portable surface (packet, comparison matrix, promise-vs-place panel, claim ledger, intake extractor, reference library) the shortcode/container shape, what state it needs, and what it must not require: no server state, no persistence beyond the browser, no accounts, no analytics, no network calls.

**5. Data and privacy note** — session state is browser-local and versioned; no telemetry, no transmission, nothing to migrate. What to do about the storage key on port, and the fact that catalogs and scenarios are demonstration fixtures naming no real facilities.

**6. Asset note** — the five generated images, where each is used, and the licensing confirmation still owed before publication.

**7. Explicit non-scope** — publication, domains, backend, authentication, analytics, payments, and canonical branch merges were not performed and are not authorized from here.

## Technical detail

- All output stays under `docs/handoff/`, internal-only, rendered by nothing in the app. `PORT-MAP.md` is rewritten in place; the conformance, behavior-contract, and WordPress sections become sibling files so each can be reviewed independently.
- No application code, tokens, routes, or styles change. This is a documentation-only pass.
- Reader-facing surfaces are untouched, so no internal production vocabulary can leak into the page.

## Not included

No commit freeze, branch creation, push, or repository merge — those happen in the canonical repo outside this environment. The record tells you which commit's files to take and what to leave behind.
