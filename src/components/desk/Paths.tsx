import { useState } from "react";
import {
  SERVICE_LABELS,
  VENUE_LABELS,
  VENUE_PROFILES,
  REGIONS,
  regionOf,
  prepSheet,
  type Assessment,
  type EvalInput,
  type ServiceClass,
  type Venue,
} from "@/lib/engine";
import { SelectField, TextField, SectionHead, StateChip } from "./ui";
import { FieldEditor } from "./Field";
import { fieldDomId } from "@/lib/fields";
import { CREDENTIAL_HINT } from "@/lib/terms";
import type { Evidence, Origin, PrepState } from "@/lib/session";
import { DecisionCard } from "./DecisionCard";
import { ClaimLedger } from "./ClaimDecoder";
import sanitationImg from "@/assets/sanitation.jpg";
import deviceImg from "@/assets/device.jpg";

type Patch = (patch: Partial<EvalInput>) => void;
export type SetField = (field: keyof EvalInput, value: string, origin?: Origin) => void;
type Ev = Record<string, Evidence>;

const serviceOptions = (Object.keys(SERVICE_LABELS) as ServiceClass[]).map((v) => ({
  value: v,
  label: SERVICE_LABELS[v],
}));
const venueOptions = (Object.keys(VENUE_LABELS) as Venue[]).map((v) => ({
  value: v,
  label: VENUE_LABELS[v],
}));
const regionOptions = REGIONS.map((r) => ({ value: r.id, label: r.label }));

/** Education-only note on what the named setting and jurisdiction imply. */
function SettingNote({ input }: { input: EvalInput }) {
  const vp = VENUE_PROFILES[input.venue];
  const region = regionOf(input.region);
  return (
    <div className="border-l-2 border-bronze bg-bronze-soft/25 px-4 py-3">
      <p className="label-mono mb-1">
        {vp.short} · {region.label}
      </p>
      <p className="text-xs leading-relaxed text-ink-soft">{vp.note}</p>
      <p className="mt-2 text-xs leading-relaxed text-ink">{region.note}</p>
    </div>
  );
}

/** Which scored signal a field feeds, for showing the reference note inline. */
const SIGNAL_OF_FIELD: Partial<Record<keyof EvalInput, string>> = {
  menuLine: "menu",
  product: "product",
  performer: "performer",
  license: "performer",
  supervision: "supervision",
  sanitation: "sanitation",
  afterHours: "afterhours",
  consent: "consent",
};

/* -------------------------------------------------------------- fast path */

export function FastPath({
  input,
  patch,
  setField,
  evidence,
  a,
  onDeepen,
}: {
  input: EvalInput;
  patch: Patch;
  setField: SetField;
  evidence: Ev;
  a: Assessment;
  onDeepen: () => void;
}) {
  const [extras, setExtras] = useState(false);
  const ed = (field: keyof EvalInput) => ({
    id: fieldDomId(field),
    value: input[field] as string,
    evidence: evidence[field],
    onChange: (v: string, origin: Origin) => setField(field, v, origin),
    note: a.signals.find((s) => SIGNAL_OF_FIELD[field] === s.id)?.note,
  });
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
      <div>
<<<<<<< Updated upstream
        <SectionHead eyebrow="Four questions" title="What are you considering?">
=======
        <SectionHead
          eyebrow="Quick read before you book · one minute"
          title="What are you considering?"
        >
>>>>>>> Stashed changes
          Four answers produce a Before You Book card. Class, jurisdiction, price, and license stay
          optional until you need them.
        </SectionHead>

        <div className="mt-8 space-y-5">
          <FieldEditor
            {...ed("menuLine")}
            label="1 · Service name / menu line"
            catalog="service"
            placeholder="e.g. Hyaluronic acid filler, 1 syringe, nasolabial folds"
<<<<<<< Updated upstream
            hint="Quote the menu, not the mood. Known names cover the common lines across spa, med-spa, clinic and studio menus."
=======
            hint="Quote the menu, not the mood. The built-in list holds the common lines across spa, med-spa, clinic and studio menus."
>>>>>>> Stashed changes
          />
          <SelectField
            label="2 · Setting type"
            value={input.venue}
            onChange={(v) => patch({ venue: v })}
            options={venueOptions}
          />
          <FieldEditor
            {...ed("performer")}
            label="3 · Who performs it"
            placeholder="e.g. RN (registered nurse) injector · licensed esthetician"
          />
          <FieldEditor
            {...ed("product")}
            label="4 · Exact product / device"
            catalog="product"
            placeholder="Brand name on the box or device panel"
            hint="“Medical-grade” is a tier word, not a product — it reads as not stated."
          />

          <button
            type="button"
            className="btn-quiet"
            aria-expanded={extras}
            onClick={() => setExtras((v) => !v)}
          >
            {extras ? "Hide extra fields" : "More about this room"}
          </button>

          {extras ? (
            <div className="space-y-5 border border-rule bg-parchment/40 p-4">
              <p className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-soft">
                Optional extras · not required for a first reading
              </p>
              <SelectField
                label="Service class"
                value={input.serviceClass}
                onChange={(v) => patch({ serviceClass: v })}
                options={serviceOptions}
              />
              <SelectField
                label="Where (jurisdiction)"
                value={input.region}
                onChange={(v) => patch({ region: v })}
                options={regionOptions}
              />
              <SettingNote input={input} />
              <div className="grid gap-5 sm:grid-cols-2">
                <FieldEditor {...ed("price")} label="Quoted price" placeholder="$" />
                <FieldEditor
                  {...ed("license")}
                  label="License stated"
                  placeholder="Type / number, if given"
                  hint={CREDENTIAL_HINT}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={onDeepen}>
            Dig deeper → the whole picture
          </button>
        </div>

        <figure className="mt-12 overflow-hidden rounded-lg border border-rule">
          <img
            src={deviceImg}
            alt="An unmarked device handpiece resting on linen under a single hard light"
            loading="lazy"
            width={1408}
            height={912}
            className="h-52 w-full object-cover"
          />
          <figcaption className="border-t border-rule bg-parchment/70 px-4 py-3 text-xs leading-relaxed text-ink-soft">
            An unnamed handpiece is an unnamed handpiece, however well it is lit.
          </figcaption>
        </figure>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <DecisionCard a={a} dense />
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- full evaluate */

const STAGES = [
  { id: 0, name: "Identity", note: "The service and the room" },
  { id: 1, name: "The person", note: "Who performs, under what license" },
  { id: 2, name: "Practice", note: "Sanitation, oversight, night cover" },
  { id: 3, name: "Pressure", note: "Marketing text and commitment" },
] as const;

export function FullEvaluate({
  input,
  patch,
  setField,
  evidence,
  a,
}: {
  input: EvalInput;
  patch: Patch;
  setField: SetField;
  evidence: Ev;
  a: Assessment;
}) {
  const [stage, setStage] = useState(0);
  const ed = (field: keyof EvalInput) => ({
    id: fieldDomId(field),
    value: input[field] as string,
    evidence: evidence[field],
    onChange: (v: string, origin: Origin) => setField(field, v, origin),
    note: a.signals.find((s) => SIGNAL_OF_FIELD[field] === s.id)?.note,
  });

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-16">
      <div>
<<<<<<< Updated upstream
        <SectionHead eyebrow="Check this venue · one stage at a time" title="One stage at a time">
=======
        <SectionHead eyebrow="Check the setting · the whole picture" title="One stage at a time">
>>>>>>> Stashed changes
          Four stages, opened in order. Nothing is required — an unanswered stage simply stays
          visible as a gap rather than being smoothed over.
        </SectionHead>

        <ol className="mt-8 space-y-px border border-rule">
          {STAGES.map((s) => {
            const open = stage === s.id;
            const stageSignals = signalsForStage(a, s.id);
            const gaps = stageSignals.filter((x) => x.state !== "known").length;
            const status =
              s.id === 3
                ? a.claims.length > 0
                  ? `${a.claims.length} flagged`
                  : input.marketing.trim()
                    ? "Read, clean"
                    : "No text yet"
                : gaps === 0
                  ? "All named"
                  : `${gaps} open`;
            const statusTone =
              s.id === 3
                ? a.claims.length > 0
                  ? "chip chip-fail"
                  : input.marketing.trim()
                    ? "chip chip-known"
                    : "chip"
                : gaps === 0
                  ? "chip chip-known"
                  : "chip chip-partial";

            return (
              <li key={s.id} className="border-b border-rule bg-parchment/60 last:border-b-0">
                <button
                  type="button"
                  onClick={() => setStage(open ? -1 : s.id)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="flex items-baseline gap-4">
                    <span className="num text-xs text-oxblood">
                      {String(s.id + 1).padStart(2, "0")}
                    </span>
                    <span>
                      <span className="block font-display text-xl leading-none text-ink">
                        {s.name}
                      </span>
                      <span className="mt-1 block text-xs text-ink-soft">{s.note}</span>
                    </span>
                  </span>
                  <span className={statusTone}>{status}</span>
                </button>

                {open ? (
                  <div className="rise space-y-5 border-t border-rule px-5 py-6">
                    {s.id === 0 && (
                      <>
                        <SelectField
                          label="Service class"
                          value={input.serviceClass}
                          onChange={(v) => patch({ serviceClass: v })}
                          options={serviceOptions}
                        />
                        <SelectField
                          label="Setting as marketed"
                          value={input.venue}
                          onChange={(v) => patch({ venue: v })}
                          options={venueOptions}
                        />
                        <SelectField
                          label="Jurisdiction"
                          value={input.region}
                          onChange={(v) => patch({ region: v })}
                          options={regionOptions}
                        />
                        <SettingNote input={input} />

                        <FieldEditor
                          {...ed("menuLine")}
                          label="Exact menu line"
                          catalog="service"
                          placeholder="Copy it from the menu, word for word"
                        />
                        <FieldEditor
                          {...ed("product")}
                          label="Product / device named"
                          catalog="product"
                          placeholder="Manufacturer and product name"
                        />
                      </>
                    )}
                    {s.id === 1 && (
                      <>
                        <FieldEditor
                          {...ed("performer")}
                          label="Who performs the service"
                          placeholder="Role as stated to you"
                        />
                        <FieldEditor
                          {...ed("license")}
                          label="License type / number stated"
                          placeholder="RN (registered nurse), LME (licensed medical esthetician), MD…"
                          hint={CREDENTIAL_HINT}
                        />
                        <FieldEditor
                          {...ed("price")}
                          label="Quoted price"
                          placeholder="Per session, per unit, per package"
                        />
                      </>
                    )}
                    {s.id === 2 && (
                      <>
                        <FieldEditor
                          {...ed("supervision")}
                          label="Oversight described"
                          placeholder="On site, remote, by chart review…"
                        />
                        <FieldEditor
                          {...ed("sanitation")}
                          label="Sanitation practice described"
                          area
                          rows={3}
                          placeholder="Single-use, sealed packaging opened in front of you, autoclave, sharps log…"
                        />
                        <FieldEditor
                          {...ed("afterHours")}
                          label="After-hours ownership"
                          placeholder="Who do you reach at 9pm, and how?"
                          hint="A voicemail box or a DM inbox counts as not stated — no named person owns it."
                        />
                        <FieldEditor
                          {...ed("consent")}
                          label="Consent and record"
                          placeholder="Written form in advance? Copy kept? Photos charted?"
                        />
                      </>
                    )}
                    {s.id === 3 && (
                      <>
                        <FieldEditor
                          {...ed("marketing")}
                          label="Marketing text as written"
                          area
                          rows={6}
                          placeholder="Paste the ad, the menu blurb, the DM, the sign at the desk."
                          hint="The Claim Decoder reads this text as you type."
                        />
                        <FieldEditor
                          {...ed("seriesPressure")}
                          label="Series / commitment stated"
                          placeholder="e.g. 6 sessions then annual touch-ups; monthly membership"
                        />
                      </>
                    )}

                    <div className="hairline" />
                    <ul className="space-y-3">
                      {stageSignals.map((sig) => (
                        <li key={sig.id} className="flex items-start justify-between gap-4">
                          <p className="max-w-[34ch] text-sm leading-relaxed text-ink-soft">
                            <span className="font-medium text-ink">{sig.label}. </span>
                            {sig.reading}
                          </p>
                          <StateChip state={sig.state} refused={sig.refused} />
                        </li>
                      ))}
                    </ul>

                    {s.id < 3 ? (
                      <button
                        type="button"
                        className="btn-quiet"
                        onClick={() => setStage(s.id + 1)}
                      >
                        Next stage → {STAGES[s.id + 1]?.name}
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>

        <figure className="mt-12 overflow-hidden rounded-lg border border-rule">
          <img
            src={sanitationImg}
            alt="A gloved hand tearing open a sealed sterile pouch above a dark lacquered surface"
            loading="lazy"
            width={1200}
            height={1504}
            className="h-64 w-full object-cover object-center"
          />
          <figcaption className="border-t border-rule bg-parchment/70 px-4 py-3 text-xs leading-relaxed text-ink-soft">
            Sanitation is a sequence of steps someone can describe. A clean-looking room is decor.
          </figcaption>
        </figure>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <DecisionCard a={a} />
      </div>
    </div>
  );
}

function signalsForStage(a: Assessment, stage: number) {
  const map: Record<number, string[]> = {
    0: ["menu", "venue", "region", "product"],
    1: ["performer"],
    2: ["supervision", "sanitation", "afterhours", "consent"],
    3: [],
  };
  if (stage === 3) return [];
  return a.signals.filter((s) => map[stage]?.includes(s.id));
}

/* ------------------------------------------------------------ consult prep */

export function ConsultPrep({
  a,
  prep,
  setPrep,
}: {
  a: Assessment;
  prep: PrepState;
  setPrep: (next: PrepState) => void;
}) {
  const sheet = prepSheet(a);
  const checked = prep.checked;
  const answers = prep.answers;
  const done = sheet.filter((q) => checked[q.id]).length;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead eyebrow="Consultation prep" title="Take this into the room">
          A question sheet built from your own gaps first, then the standing set. Tick what was
          answered and write what they actually said — that record is the receipt. It stays on this
<<<<<<< Updated upstream
          venue block and prints with the decision card.
=======
          venue and prints on your Before You Book page.
>>>>>>> Stashed changes
        </SectionHead>
        <div className="text-right">
          <p className="num text-3xl text-ink">
            {done}
            <span className="text-ink-soft">/{sheet.length}</span>
          </p>
          <p className="eyebrow mt-1">Answered on record</p>
        </div>
      </div>

      <ol className="space-y-px border border-rule">
        {sheet.map((q, i) => (
          <li
            key={q.id}
            className={`border-b border-rule px-5 py-5 last:border-b-0 ${
              checked[q.id] ? "bg-pine-tint/40" : "bg-parchment/60"
            }`}
          >
            <div className="flex items-start gap-4">
              <button
                type="button"
                aria-pressed={!!checked[q.id]}
                onClick={() =>
                  setPrep({
                    ...prep,
                    checked: { ...checked, [q.id]: !checked[q.id] },
                  })
                }
                className={`mt-1 size-4 shrink-0 border ${
                  checked[q.id] ? "border-pine bg-pine" : "border-rule bg-parchment"
                }`}
              >
                <span className="sr-only">Mark answered</span>
              </button>
              <div className="min-w-0 flex-1">
                <p className="eyebrow">
                  {String(i + 1).padStart(2, "0")} · {q.group}
                </p>
                <p className="mt-2 font-display text-xl leading-snug text-ink">“{q.text}”</p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">{q.why}</p>
                <input
                  className="field mt-3"
                  placeholder="What they said, in their words"
                  value={answers[q.id] ?? ""}
                  onChange={(e) =>
                    setPrep({
                      ...prep,
                      answers: { ...answers, [q.id]: e.target.value },
                    })
                  }
                />
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="max-w-2xl text-xs leading-relaxed text-ink-soft">
        Education only. This sheet records what was said; it does not assess candidacy, rank
        providers, or clear you for any service.
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- decoder */

export function DecoderPanel({
  input,
  patch,
  a,
}: {
  input: EvalInput;
  patch: Patch;
  a: Assessment;
}) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
      <div>
        <SectionHead eyebrow="Optional · one sentence at a time" title="Decode one sentence">
          For when a single marketing sentence is the whole problem. The decoder does not judge the
          service — it names what the sentence left out.
        </SectionHead>
        <div className="mt-8">
          <TextField
            label="Marketing sentence or paragraph"
            value={input.marketing}
            onChange={(v) => patch({ marketing: v })}
            area
            rows={9}
            placeholder="Paste it exactly as written."
          />
        </div>
        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          The decoder is optional and is not the product. It cannot tell you whether a service is
          appropriate for you.
        </p>
      </div>
      <div>
        {input.marketing.trim().length < 3 ? (
          <div className="panel rounded-xl px-7 py-14 text-center">
            <p className="eyebrow">Nothing pasted yet</p>
            <h3 className="display-lg mx-auto mt-4 max-w-sm text-ink">
              Nothing to <span className="italic text-oxblood">pull apart</span>
            </h3>
            <p className="lede mx-auto mt-4 max-w-sm">
              Paste one sentence. Certainty language, permanence, tier words, time pressure, and
              commitment structures come apart first.
            </p>
          </div>
        ) : (
          <div className="rise space-y-5">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <p className="eyebrow">{a.claims.length} pattern(s) caught</p>
              <p className="num text-sm text-ink-soft">Promise pressure {a.promise}</p>
            </div>
            <ClaimLedger claims={a.claims} />
          </div>
        )}
      </div>
    </div>
  );
}
