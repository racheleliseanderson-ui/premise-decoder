# Spa Intelligence — Handoff Package

Internal documentation for porting the Vanity or Vice Spa Intelligence desk from
this application repository into the canonical publication runtime.

Nothing in this directory is rendered by the application.

## Files

- `PORT-MAP.md` — file-by-file inventory: RETAIN / REWRITE / VERIFY / REJECT.
- `CONFORMANCE.md` — mapping of core philosophy rules and Fleet Shell Standard
  v1 rules to their enforcement points in the code.
- `BEHAVIOR-CONTRACT.md` — scoring, posture, burden, claim decoder, pipeline,
  session and print behavior that a port must not change silently.
- `WORDPRESS-PORT.md` — shortcode/container shape for each portable surface in
  the WordPress runtime.
- `CI-DEPLOY.md` — verification scripts, CI workflow, and Vercel deploy mapping.

Elevated instrument source (Grok, 2026-08-27) lives in `/setting-analyst/`.
See that directory's `README.md` and `HANDOFF.md` for the port map onto this
live desk. It does not replace this package.

## Current frozen commit

`90173e1`

## What this package covers

- Multi-venue setting evaluation desk (up to 5 blocks).
- Fast Path, Full Evaluate, Venue Text intake, Compare, Consult Prep, Claim
  Decoder, Reference Library, and printable Setting Decision Packet.
- EN / ES / FR interface language support.
- Light / dark / CVD display modes.
- Northern Lantern House Fleet Shell Standard v1 shell: house bar, full-bleed
  hero, working surface, Labs footer.
- Browser-local `localStorage` persistence only; no server state, no telemetry,
  no accounts.

## What is not authorized here

Publication, custom domains, backend, authentication, analytics, payments,
persistence beyond the browser, remote data of any kind, production secrets, and
canonical branch merges. This package tells you which files to take from the
frozen commit and what to leave behind; the merge itself happens in the canonical
repository.
