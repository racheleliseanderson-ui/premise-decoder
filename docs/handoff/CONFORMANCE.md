# Philosophy conformance (internal)

One row per core rule, with the place it is enforced in the frozen build. A
reviewer should be able to check each row without reading the whole desk. If a
port drops the right-hand column, it has dropped the rule.

| Rule | Enforced at |
| --- | --- |
| Education only — no diagnosis | `engine.ts` emits readings about what was named and nothing about the reader's body; `Packet.tsx` footer states it; hero subline and method section repeat it |
| No candidacy | No field, signal or output refers to suitability for a person. `assess` has no reader input at all |
| No provider ranking | `compare.ts` produces a signal-by-signal disclosure matrix with no aggregate winner, no ordering by score, no recommendation |
| No safety or outcome comparison | Claim rules decode language; none asserts an outcome. Burden measures verification work, not risk |
| Desire is allowed · the setting still has to answer | Hero framing and `PromiseVsPlace` keep the want intact and put the burden on the room |
| Before you book — try the setting, not just the promise | Hero H1; `PromiseVsPlace` sets promise density against setting resolution |
| Fail-closed states stay visible | `SignalState = "fail-closed"`; `StateChip` / `chip-fail`; live readouts; `Packet` signal ledger; `pipeline.ts` `blocked` stage state |
| A refusal is a decision, not an oversight | `Origin = "no-answer"`; `isNoAnswer`; `+7` burden per refusal in `burdenOf`; its own packet section, never counted as resolved |
| Unknowns stay on the desk | `Assessment.unknowns` from every fail-closed and partial signal; printed as its own packet block; the residual-unknowns section always renders, even when empty |
| Silence is distinguished from refusal | `Packet` splits resolved / refused / never-mentioned; the third list is printed explicitly |
| No invented claims | Every reading quotes or paraphrases the entered value. No output vocabulary describes results, safety, or effectiveness |
| Credentials and setting reality over facility brand | `performer` carries the highest signal weight (18); the "Reputation substitution" claim rule names brand-for-credential swaps |
| Provenance is recorded, never inferred | `Evidence.origin` is set at the point of entry; extraction attaches the source sentence; `EvidenceRail` shows the quote and jumps to the field |
| A higher figure means more was disclosed — nothing else | Stated in the packet boundaries footer and in the on-screen readout label ("Setting resolved") |
| Precise, honest, slightly dry voice | Copy throughout; no lifestyle framing, no reassurance, no soft close. Empty states say what is missing rather than encouraging |

## Fleet Shell Standard v1 conformance

| Rule | Enforced at |
| --- | --- |
| Deep ground navy `#101828`, deepest `#0B1220` | `:root` and `.dark` in `src/styles.css`; `bg-navy-deep` on hero and footer |
| Light ground pearl `#F4F1EA`, paper `#FBFAF7` | `:root` in `src/styles.css`; `--bone` and `--parchment` map to pearl/paper |
| Gold `#C8A34A` reserved for house mark and footer hairline only | `HouseBar.tsx` wordmark uses `text-gold`; `LabsFooter.tsx` hairline uses `bg-gold`; app CTA uses `btn-accent` (oxblood), never gold |
| App accent oxblood `#6E1F26` carries CTA and state | `--oxblood` token; `btn-accent`, active nav underline, active language/theme pills, fail-closed chips |
| Three display modes: dark, pearl, CVD | `theme.ts` defines `light`, `dark`, `cvd`; toggle in house bar; contrast verified in all three |
| House bar: one row, ≤6 nav items, compact mode pills | `HouseBar.tsx`; six nav buttons plus language and theme groups; no second row |
| Hero: full-bleed photograph, min 62vh desktop / 70vh mobile, headline ≤9 words, subline ≤20 words, one primary CTA, one secondary link | `Hero.tsx`; headline "See the room before you book it." (7 words); subline 15 words; CTA "Start with four questions"; secondary "See a real setting" |
| Working surface below the fold | `DeskLayout.tsx`: hero first, then `#desk` working section with form, tabs, venue bar, stage readout |
| Labs footer with gold hairline, three columns, correct registry | `LabsFooter.tsx`; columns The House / This publication / Across the fleet; fleet links from `fleet.ts` |
| Section budget ≤9 major sections, no run of 3 text-only bands | `DeskLayout.tsx`: hero, working surface, results, demos, chapter break, method, footer = 7 major sections; every third band carries imagery or saturated color |
| Real alt text, no empty alt | `Hero.tsx` alt describes the empty oxblood chair and lamp; `ChapterBreak` alt describes the consent paperwork |
| Mobile preserves concept, hero recomposed not cropped to strip | Hero uses `min-h-[70vh]` on mobile and text anchored to bottom; image `object-cover` with focal point |
| No internal production language on reader-facing page | Copy avoids repo, branch, workflow, schema, audit, staging, deployment vocabulary |

## What the visual work did not change

The fleet shell pass (house bar, hero, footer, chapter break, scroll rhythm)
changed composition, imagery and typography only. Signal weights, thresholds,
claim rules, refusal handling and the unknowns list are unchanged from the
evaluated engine. The live readouts are drawn from the same `Assessment` the
packet prints, so the opening frame cannot state more than the desk supports.
