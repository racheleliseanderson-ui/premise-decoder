# Spa Intelligence — Setting Evaluation Desk

**Vanity or Vice** · Northern Lantern House Labs · live at **[spa.vanityvice.blog](https://spa.vanityvice.blog/)**

> See the room before you book it.

Spa Intelligence names the service, the setting, the performer and the product —
then prints what nobody told you. It is a **setting-evaluation instrument**, not a
provider directory and not a clinical tool.

## What it does

| Path | For | Produces |
| --- | --- | --- |
| **Fast path** | Four fields, one minute | A *Before You Book* card |
| **Add venue text** | Pasted menu / marketing copy | Extracted claims and gaps |
| **Full evaluate** | The whole picture | A scored setting read with evidence |
| **Compare venues** | Two or more options | A side-by-side of what each has answered |
| **Claim decoder** | One marketing sentence | What it says, and what it conspicuously omits |
| **Consult prep** | Before the phone call | The questions still worth asking |
| **Decision packet** | After | A printable record of what is known and what is not |

## The contract (do not break)

- **Education only** — no diagnosis, candidacy, provider ranking, or clinical verdict.
- **Desire is allowed** — the setting still has to answer.
- **Fail-closed states stay visible.** An unknown is displayed as an unknown, never
  rounded up into a "probably".
- **Unknowns stay on the desk.** The desk would rather end with *here are the five
  things still to confirm* than pretend it knows them.
- **Credentials and setting reality** outrank facility brand and marketing glow.
- **Nothing is transmitted.** All work is held in the visitor's browser — no
  account, no server-side session, no analytics on the reader's inputs.

## Stack

TanStack Start (React 19, TanStack Router) · Vite 8 · Tailwind 4 · Nitro 3 ·
`vite-plugin-pwa` for the installable local-first desk.

The build config lives entirely in [`vite.config.ts`](./vite.config.ts) and depends
only on first-party TanStack / Vite / Tailwind packages. **This project no longer
uses Lovable** — no editor wrapper, no private package registry, no editor
telemetry hooks. Do not reintroduce them.

## Development

Requires [Bun](https://bun.sh) 1.2+ (CI pins 1.2.21). `npm` also works.

```sh
bun install
bun run dev        # http://localhost:8080
```

| Script | What it does |
| --- | --- |
| `bun run dev` | Dev server |
| `bun run build` | Production build → `.output/` |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run lint` | ESLint + Prettier (must be clean; CI gates on it) |
| `bun run format` | Prettier write |
| `bun run test:e2e` | Playwright |

### Build output

Nitro emits the server bundle to `.output/server` and the **client bundle to
`.output/public`** — not `dist/`. The PWA plugin is pointed at `.output/public`
for that reason; moving it back to `dist/` silently produces a service worker
that precaches nothing and is never served.

## Appearance

One control, lower right. Light / Dark / System, plus two independent
accessibility switches: high contrast, and a colour-blind-safe status palette
that moves the known / partial / fail-closed states off the green–red axis.
Settings persist per browser; there is no second appearance control anywhere.

## Cross-app handoffs

`src/lib/handoff.ts` is both halves of the bridge with
[Skincare Intelligence](https://skincare.vanityvice.blog), and the receiving
half of the one with [Makeup Intelligence](https://makeup.vanityvice.blog).

**Two senders, two spellings.** Skincare names itself with `from=skincare` and
stamps `hv=1`. Makeup's handoff cards name themselves with `via=makeup` and
carry no version at all. Both are read. A version that is *present* and is not
ours is still refused; an absent one is not an error. Each sender's concern
vocabulary is checked against that sender's own closed list, so a skincare
pathway id arriving from makeup is dropped exactly like any other unrecognised
token.

A makeup arrival is deliberately thinner than a skincare one: that desk never
looked at a routine, so this one must not report on one. The arrival notice
says so in as many words rather than printing "no leave-on actives were
detected", which would be a finding about an examination that never happened.

**Inbound.** That desk sends a short, versioned, human-readable payload —
primary job, tolerance state, detected leave-on active families, reassessment
window. Three rules govern what happens to it:

1. Every token is checked against a closed list. Anything unrecognised is
   dropped rather than echoed back, because a query string is user-editable and
   a desk that prints whatever is in the address bar is a defacement vector.
2. **An arrival never fills in a venue fact.** It writes *questions* onto the
   consult-prep sheet. The one exception is the Claim Decoder's marketing line,
   which is a sentence the reader chose to carry across, and it is labelled
   `Carried from Skincare Intelligence` in the provenance rail like any other
   non-typed value.
3. What arrived is printed in full, in words, before it is used — and the
   payload is stripped from the URL afterwards so a refresh or a shared link
   cannot replay someone else's session onto this desk.

**Outbound.** The decision card and the consult sheet offer a return leg
carrying the service class and whether it is a medical class. No venue name, no
price, no pasted text, no notes.

`src/lib/handoff.test.ts` asserts all of the above, including that every
generated line is a question for the provider rather than an instruction about
a product.

## Repository map

```
src/lib/engine.ts      the scoring and fail-closed rules
src/lib/catalog.ts     service / setting / jurisdiction reference data
src/lib/extract.ts     claim extraction from pasted venue text
src/lib/session.ts     browser-local session and venue state
src/lib/packet-pdf.ts  the printable decision packet
src/lib/handoff.ts     the fleet bridge, both directions
src/routes/            one route per desk path
docs/BRIEF.md          the standing product brief
```

## Voice

Precise, honest, slightly dry. No wellness fluff, no soft marketing language, no
false certainty. The desk should read like a sharp setting analyst who respects
real constraints and keeps the unknowns where you can see them.
