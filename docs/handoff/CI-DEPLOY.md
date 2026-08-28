# CI and deployment — Vanity or Vice Desk

## Scripts

| Script                   | Purpose                                                        |
| ------------------------ | -------------------------------------------------------------- |
| `bun run dev`            | Dev server on port 8080.                                       |
| `bun run lint`           | ESLint across the repo.                                        |
| `bun run typecheck`      | `tsc --noEmit`.                                                |
| `bun run build`          | Production client + SSR bundles.                               |
| `bun run test:e2e`       | Playwright, desktop (1280×1800) and mobile (Pixel 7) projects.   |
| `bun run test:e2e:ui`    | Interactive Playwright runner for local debugging.              |

Against an already-running server, set `E2E_BASE_URL=http://localhost:8080`; otherwise
`playwright.config.ts` starts `bun run dev` itself.

## Test coverage — live conditions flow

`e2e/desk-flow.spec.ts`, 13 tests × 2 devices:

1. Landing screen opens and reaches the Fast path.
2. All eight panel routes render with their own titles.
3. An empty desk shows the gap, not a score.
4. Naming the setting raises Place and never adds fail-closed signals.
5. Autosave survives a hard reload (score identical after restore).
6. Venue-text sample extracts proposals with source quotes.
7. A filled proposal carries through to the decision card.
8. Full evaluate stages open and accept practice detail.
9. Claim decoder flags patterns in marketing text.
10. Packet renders named fields, signal ledger and print controls.
11. PDF packet downloads.
12. Reference library renders.
13. Compare renders the current venue block.

The desk is a hydrated client app, so the specs wait for React to own an element
(`hydrated()`) before typing; a value filled pre-hydration sticks in the DOM but never
reaches desk state. Storage is cleared once per test, on the first document only, so
reload/restore assertions remain meaningful.

## CI

`.github/workflows/ci.yml` runs on pushes to `main`, pull requests, and manual dispatch:

- **verify** — install (frozen lockfile), lint, typecheck, build, upload build output.
- **e2e** — installs Chromium with system deps, runs the full Playwright suite, uploads
  `playwright-report` on success or failure.

CI mode enables one retry, two workers, and the GitHub + HTML reporters.

## Deploy

Deploys are driven from Vercel's Git integration on the linked project: pushes to
`main` publish production, other branches publish previews. The build is produced
by `bun run build`.
Nothing in the app requires server secrets or a database — the desk is client-only
with `localStorage` persistence, so the Vercel default TanStack Start adapter is
sufficient.

Live mapping for this app:

| Subdomain | Vercel project | GitHub repo |
|---|---|---|
| `spa.vanityvice.blog` | `spa-decoder` | `premise-decoder` |

For a canonical-repo deploy pipeline, gate merges on the `verify` and `e2e` jobs above
and deploy with the platform's TanStack Start / Vercel adapter. Do not add environment
variables for the desk itself; if analytics or a backend is introduced later, add the
secret to the deploy environment and document it here.
