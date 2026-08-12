# Behavior contract (internal)

The parts a port must not change silently. Changing any number here changes what
the desk tells a reader, so each change needs an editorial decision, not a
refactor.

## Setting resolution — 0 to 100

Weighted over the signal set. Weight is a claim about consequence, not about how
hard a field is to fill.

| Signal | Weight | Depth |
| --- | --- | --- |
| Who performs it + license | 18 | fast |
| Exact product / device | 16 | fast |
| Menu identity | 14 | fast |
| Setting type + oversight implied | 14 | fast |
| After-hours ownership | 14 | full |
| Oversight on site | 14 medical classes · 8 otherwise | full |
| Sanitation signals | 12 | full |
| Written consent + record | 10 | full |
| Jurisdiction named | 8 | fast |

Scoring:

```text
earned = sum(known -> weight, partial -> weight * 0.45, fail-closed -> 0)
resolved = round(earned / sum(weight) * 100)
```

Partial credit is `0.45` — deliberately under half, so a hedged answer can never
read as an answer. Fail-closed earns nothing; it does not earn a floor.

The denominator is the live signal set, so the supervision weight shift between
medical and non-medical classes rescales the whole reading. Do not freeze the
denominator to make scores comparable across classes; they are not meant to be.

## Fail-closed rules that are not "missing field" checks

- Tier language in the product field (`medical grade`, `our own blend`, and the
  rest of `VAGUE_PRODUCT`) is fail-closed, not partial. A brand tier is not a
  product.
- An after-hours route that lands in a queue — voicemail, email, front desk,
  business hours, DM — is fail-closed, not partial. A queue does not own a night.
- A medical class in a setting whose name implies no oversight is partial with an
  explicit class/setting reading, never silently known.

## Posture thresholds

| Posture | Condition |
| --- | --- |
| Desk empty | no menu line, product, performer, marketing text, and both setting and jurisdiction unnamed |
| Setting largely resolved | zero fail-closed **and** resolved ≥ 78 |
| Partly resolved | one or two fail-closed |
| Setting unresolved — fail closed | three or more fail-closed |

Zero fail-closed is a hard requirement for the top posture. A high percentage
with an open fail-closed signal must not present as resolved.

## Burden index

Verification work owed before booking — not risk, not quality.

Class base: injectable 62 · iv 58 · device 55 · chemical 48 · other 30 ·
facial 18 · bodywork 14.

Additions: setting profile burden as defined per setting type; `+14` for a
medical class in a setting with no or unknown implied oversight; `+8` jurisdiction
unnamed; `+7` per refusal; `+4` per fail-closed signal; `+8` for a stated series
or maintenance commitment containing a number; `+6` membership or prepay
structure; `+6` permanence language. Clamped 0–100.

Bands: `High` ≥ 70 · `Moderate` ≥ 45 · `Contained` ≥ 25 · `Low` below 25.

A refusal costs more than a fail-closed omission (`7` against `4`). That ordering
is the point and must survive the port.

## Claim decoder

29 rules across three severities: 6 `hard`, 15 `flag`, 6 `note`. Each rule
returns the matched phrase, what it hides, and the question to ask instead. Rules
decode language only; none of them scores the service.

Severity feeds two places: the ledger's chip, and `nextSteps`, where every `hard`
claim's question is promoted ahead of partial-signal questions.

`nextSteps` composition, in order, deduped, capped at 6: up to 4 fail-closed
asks, then every hard-claim ask, then up to 2 partial asks.

## Promise minus place

`gap = promise density - setting resolution`, clamped -100..100. A positive gap
is the headline reading of the whole instrument: the marketing is ahead of the
disclosure. Never present the gap as a verdict, and never suppress a negative one.

## Pipeline stages

Six stages: intake · identify · agency · practice · decode · score. Stage state
is derived from the current input, never stored: `idle`, `running`, `clear`,
`gaps`, `blocked`. A stage reports `blocked` on the fields it names, and those
field ids drive the blocked-field chips and the jump-to-field behavior. Stages
are a view of the same `Assessment`, so a port must not let a stage cache a
result the score no longer agrees with.

## Session model

Up to 5 venue blocks. Each block: id, reader-facing name, one `EvalInput`, and a
`Record<fieldKey, Evidence>` where evidence carries origin, optional source
quote, optional source label, and a timestamp. Absent evidence means untouched —
which is not the same as refused, and not the same as empty-but-asked.

Autosave debounce ~450ms. Saved sets are named snapshots of all blocks.

## Print and PDF

The screen packet and the PDF packet must print the same field set, the same
refusal section, and the same boundaries footer. If they diverge, the printed
artifact becomes a claim the desk cannot support. Page-break behavior lives in
the `@media print` block (`.packet-block` breaks between venues) and must be
re-verified in the canonical stack, not assumed.
