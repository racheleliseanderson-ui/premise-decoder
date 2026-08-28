# Setting Analyst Pro — Grok elevation

Elevated source for **Spa Intelligence · Setting Evaluation Desk**, handed off as a new directory so the live app on `main` is untouched.

Publication: Vanity or Vice · Northern Lantern House Labs  
Canonical site: https://spa.vanityvice.blog  
Live app: https://spa-decoder.vercel.app

This tree is a source snapshot of the elevated instrument. It is **not** a second runtime. Merge it into the existing desk; do not replace the publication shell.

## Philosophy (do not break)

- Education only — no diagnosis, candidacy, provider ranking, or clinical verdict
- Desire is allowed · the setting still has to answer
- Before you book — try the setting, not just the promise
- Fail-closed states stay visible
- Unknowns stay on the desk
- No invented claims about outcomes, safety, or results
- Credentials and setting reality over facility brand and marketing glow

## What was elevated

| Surface | What changed |
| --- | --- |
| Promise vs Place | Weighted signal matrix with fail-closed / partial / known / declined states. Menu identity, spa vs med-spa, performer + license, product/device, sanitation, burden, after-hours ownership each have their own signal, ask, and why. |
| Fast path | Four fields produce a Before You Book card without forcing Full Evaluate. |
| Full evaluate | Progressive depth: venue, service, agency, practice, decode, score. |
| Claim decoder | Marketing sentences are split and tagged when they hide a missing setting fact. |
| What if | Sensitivity probes — flip one unknown and see which scores move. |
| Consult prep | Questions generated from residual unknowns, copyable for a real conversation. |
| Setting Decision Card | Known, fail-closed, residual unknowns, next verification steps. Printable packet. |
| Compare | Named saved settings compared side by side. |
| Display | Pearl, dark, and CVD modes. Fleet palette retained (navy / pearl / gold / oxblood). |

## Files

```
setting-analyst/
  README.md                 this file
  HANDOFF.md                port map onto the live desk
  src/components/desk-app.tsx
  src/components/result-card.tsx
  src/components/bits.tsx
  src/lib/engine/           evaluate, claims, extract, questions, sensitivity
  src/lib/data/             catalog, demos, editorial
  src/lib/store.ts          localStorage desk (no accounts, no server)
  src/styles.css            tokens + print rules
  public/                   favicon, share card, hero stills
```

## Data and privacy

- Session state is this browser's `localStorage` only (`spa-intelligence-desk-v2` in `store.ts`).
- Nothing is transmitted. No telemetry, no accounts, no analytics.
- Catalogs and demos are educational fixtures. No real facility is named.
- Provenance is recorded, never inferred. A port must not add an "assumed" origin.

## Merge rule

See [HANDOFF.md](./HANDOFF.md). Take engine and panel behavior from this directory. Keep the Fleet Shell (house bar, hero, Labs footer) and route surface from the live app.
