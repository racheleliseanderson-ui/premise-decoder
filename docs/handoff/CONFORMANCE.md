# Philosophy conformance (internal)

One row per core rule, with the place it is enforced in the frozen build. A
reviewer should be able to check each row without reading the whole desk. If a
port drops the right-hand column, it has dropped the rule.

| Rule | Enforced at |
| --- | --- |
| Education only — no diagnosis | `engine.ts` emits readings about what was named and nothing about the reader's body; `Packet.tsx` footer states it; masthead standfirst repeats it |
| No candidacy | No field, signal or output refers to suitability for a person. `assess` has no reader input at all |
| No provider ranking | `compare.ts` produces a signal-by-signal disclosure matrix with no aggregate winner, no ordering by score, no recommendation |
| No safety or outcome comparison | Claim rules decode language; none asserts an outcome. Burden measures verification work, not risk |
| Desire is allowed · the setting still has to answer | Masthead eyebrow and `PromiseVsPlace` framing keep the want intact and put the burden on the room |
| Before you book — try the setting, not just the promise | Masthead H1; `PromiseVsPlace` sets promise density against setting resolution |
| Fail-closed states stay visible | `SignalState = "fail-closed"`; `StateChip` / `chip-fail`; masthead live counter; `Packet` signal ledger; `pipeline.ts` `blocked` stage state |
| A refusal is a decision, not an oversight | `Origin = "no-answer"`; `isNoAnswer`; `+7` burden per refusal in `burdenOf`; its own packet section, never counted as resolved |
| Unknowns stay on the desk | `Assessment.unknowns` from every fail-closed and partial signal; printed as its own packet block; the residual-unknowns section always renders, even when empty |
| Silence is distinguished from refusal | `Packet` splits resolved / refused / never-mentioned; the third list is printed explicitly |
| No invented claims | Every reading quotes or paraphrases the entered value. No output vocabulary describes results, safety, or effectiveness |
| Credentials and setting reality over facility brand | `performer` carries the highest signal weight (18); the "Reputation substitution" claim rule names brand-for-credential swaps |
| Provenance is recorded, never inferred | `Evidence.origin` is set at the point of entry; extraction attaches the source sentence; `EvidenceRail` shows the quote and jumps to the field |
| A higher figure means more was disclosed — nothing else | Stated in the packet boundaries footer and in the on-screen readout label ("Setting resolved") |
| Precise, honest, slightly dry voice | Copy throughout; no lifestyle framing, no reassurance, no soft close. Empty states say what is missing rather than encouraging |

## What the visual work did not change

The cinematic pass (masthead, chapter break, stepper, packet) changed
composition, imagery and typography only. Signal weights, thresholds, claim
rules, refusal handling and the unknowns list are unchanged from the evaluated
engine. The live readouts in the masthead are drawn from the same `Assessment`
the packet prints, so the opening frame cannot state more than the desk supports.
