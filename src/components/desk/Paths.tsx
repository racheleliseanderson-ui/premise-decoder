import { useId, useState } from "react";
import {
  SERVICE_LABELS,
  VENUE_LABELS,
  VENUE_PROFILES,
  REGIONS,
  regionOf,
  prepSheet,
  claimText,
  type Assessment,
  type EvalInput,
  type PrepQuestion,
  type ServiceClass,
  type Venue,
} from "@/lib/engine";
import { SelectField, TextField, SectionHead, StateChip } from "./ui";
import { FieldEditor } from "./Field";
import { fieldDomId } from "@/lib/fields";
import { CREDENTIAL_HINT } from "@/lib/terms";
import type { Evidence, Origin, PrepState } from "@/lib/session";
import type { Mode } from "@/lib/modes";
import { DecisionCard } from "./DecisionCard";
import { RoomView } from "./RoomView";
import { ClaimLedger, ClaimSummaryBar, WhatIsLeft } from "./ClaimDecoder";
import { CostReadout } from "./Cost";
import { SIGNAL_OF_FIELD } from "@/lib/signal-fields";
import { SIGNALS_BY_STAGE, type StageId } from "@/lib/pipeline";
import { ClaimAnatomyFigure } from "@/components/figures/ClaimAnatomy";
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
        <SectionHead eyebrow="Four questions" title="What are you considering?">
          Four answers produce a Before You Book card. Class, jurisdiction, price, and license stay
          optional until you need them.
        </SectionHead>

        <div className="mt-8 space-y-5">
          <FieldEditor
            {...ed("menuLine")}
            label="1 · Service name / menu line"
            catalog="service"
            placeholder="e.g. Hyaluronic acid filler, 1 syringe, nasolabial folds"
            hint="Quote the menu, not the mood. Known names cover the common lines across spa, med-spa, clinic and studio menus."
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
            hint="“Medical-grade” is a tier, not a product — it reads as unresolved."
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
            Dig deeper → full evaluate
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

/**
 * The stages, and the pipeline stage each one scores against.
 *
 * `Afterwards` and `Money` are new, and they are the two halves of the decision
 * that used to happen entirely after booking: what the days afterwards require
 * and who owns a bad one, and what the whole thing costs once the maintenance
 * schedule is included. Both were in the consult questions already; neither had
 * anywhere to be recorded.
 */
const STAGES = [
  { id: 0, stage: "identify", name: "Identity", note: "The service and the room" },
  { id: 1, stage: "agency", name: "Agency", note: "Who performs, under what license" },
  { id: 2, stage: "practice", name: "Practice", note: "Sanitation, oversight, consent" },
  {
    id: 3,
    stage: "afterwards",
    name: "Afterwards",
    note: "Night cover, aftercare, complications, review",
  },
  { id: 4, stage: "money", name: "Money", note: "What it costs, and for how long" },
  { id: 5, stage: "decode", name: "Pressure", note: "Marketing text and commitment" },
] as const satisfies readonly { id: number; stage: StageId; name: string; note: string }[];

const LAST_STAGE = STAGES.length - 1;

export function FullEvaluate({
  input,
  patch,
  setField,
  evidence,
  a,
  onGo,
}: {
  input: EvalInput;
  patch: Patch;
  setField: SetField;
  evidence: Ev;
  a: Assessment;
  /**
   * The deepest panel used to end at a figure and a sticky card, with no way
   * out. Every other panel that asks the reader for work tells them where the
   * work goes; this is the one the whole desk funnels into, so it says so too.
   */
  onGo: (mode: Mode) => void;
}) {
  const [stage, setStage] = useState(0);
  const uid = useId();
  const openCount = a.signals.filter((sig) => sig.state !== "known").length;
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
        <SectionHead eyebrow="Check this venue" title="One stage at a time">
          Four stages, opened in order. Nothing is required — an unanswered stage simply stays
          visible as a gap rather than being smoothed over.
        </SectionHead>

        <ol className="mt-8 space-y-px border border-rule">
          {STAGES.map((s) => {
            const open = stage === s.id;
            const stageSignals = signalsForStage(a, s.id);
            const gaps = stageSignals.filter((x) => x.state !== "known").length;
            const status =
              s.id === LAST_STAGE
                ? a.claims.length > 0
                  ? `${a.claims.length} flagged`
                  : input.marketing.trim()
                    ? "Read, clean"
                    : "No text yet"
                : gaps === 0
                  ? "Resolved"
                  : `${gaps} open`;
            const statusTone =
              s.id === LAST_STAGE
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
                  id={`${uid}-stage-${s.id}-tab`}
                  aria-expanded={open}
                  aria-controls={`${uid}-stage-${s.id}`}
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
                  <div
                    id={`${uid}-stage-${s.id}`}
                    role="region"
                    aria-labelledby={`${uid}-stage-${s.id}-tab`}
                    className="rise space-y-5 border-t border-rule px-5 py-6"
                  >
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
                          {...ed("consent")}
                          label="Consent and record"
                          placeholder="Written form in advance? Copy kept? Photos charted?"
                        />
                      </>
                    )}
                    {s.id === 3 && (
                      <>
                        <FieldEditor
                          {...ed("afterHours")}
                          label="After-hours ownership"
                          placeholder="Who do you reach at 9pm, and how?"
                          hint="A voicemail box or a DM inbox is treated as unresolved."
                        />
                        <FieldEditor
                          {...ed("aftercare")}
                          label="Aftercare, as instructions"
                          area
                          rows={3}
                          placeholder="No exercise for 24 hours, mineral SPF only, sleep elevated…"
                          hint="What you have to DO, not how it will feel. Downtime happens on your time."
                        />
                        <FieldEditor
                          {...ed("complication")}
                          label="If something goes wrong"
                          area
                          rows={3}
                          placeholder="Who treats it, how fast, and at whose cost?"
                          hint="A protocol names a person, a treatment, a timeframe and a payer. Anything else is a sentiment."
                        />
                        <FieldEditor
                          {...ed("followup")}
                          label="Follow-up review"
                          placeholder="Two weeks, included, photographed?"
                          hint="Without a review, the only person assessing the result is the person who wanted it."
                        />
                      </>
                    )}
                    {s.id === 4 && (
                      <>
                        <FieldEditor
                          {...ed("price")}
                          label="Quoted price, exactly as given"
                          area
                          rows={3}
                          placeholder="$12 per unit, roughly 20 units. $100 deposit. 48 hours to cancel."
                          hint="Paste the whole quote. The desk reads the deposit, the cancellation window and the unit out of it."
                        />
                        <FieldEditor
                          {...ed("seriesPressure")}
                          label="Series, membership, maintenance"
                          area
                          rows={3}
                          placeholder="Package of 6 then every 4 months; membership $99/mo, credits expire in 12 months"
                          hint="This is the field that decides whether it is a purchase or a standing order."
                        />
                        <CostReadout a={a} onGo={onGo} />
                      </>
                    )}
                    {s.id === 5 && (
                      <>
                        <FieldEditor
                          {...ed("marketing")}
                          label="Marketing text as written"
                          area
                          rows={6}
                          placeholder="Paste the ad, the menu blurb, the DM, the sign at the desk."
                          hint="The Claim Decoder runs on this text automatically."
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

                    {s.id < LAST_STAGE ? (
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

        <div className="no-print mt-12 border border-rule bg-parchment/60 p-6">
          <p className="eyebrow">Where this goes</p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink">
            {openCount
              ? `${openCount} signal${openCount === 1 ? "" : "s"} on this venue ${openCount === 1 ? "is" : "are"} still unnamed. Those are the questions the consult sheet is built from, and they print on the decision card as unnamed — not smoothed over.`
              : "Every signal on this venue has been named. The decision card prints each one with the sentence it came from, so the record survives the drive home."}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={() => onGo("prep")}>
              Take the questions into the room
            </button>
            <button type="button" className="btn-quiet" onClick={() => onGo("packet")}>
              Open the decision card
            </button>
            <button type="button" className="btn-quiet" onClick={() => onGo("compare")}>
              Compare with another setting
            </button>
          </div>
        </div>
      </div>

      <div className="lg:sticky lg:top-24 lg:self-start">
        <DecisionCard a={a} />
      </div>
    </div>
  );
}

/** The mapping now lives in lib/pipeline.ts, where the stage strip reads it too. */
function signalsForStage(a: Assessment, stage: number) {
  const def = STAGES[stage];
  if (!def) return [];
  const ids = SIGNALS_BY_STAGE[def.stage];
  return a.signals.filter((s) => ids.includes(s.id));
}

/* ------------------------------------------------------------ consult prep */

export function ConsultPrep({
  a,
  prep,
  setPrep,
  carried = [],
  onGo,
}: {
  a: Assessment;
  prep: PrepState;
  setPrep: (next: PrepState) => void;
  /**
   * Questions generated from context another desk handed over. They sit at the
   * top because a room asks about your home routine before it asks anything
   * else, and because they are the ones you will otherwise answer from memory.
   */
  carried?: PrepQuestion[];
  /** Same navigation mechanism the other panels use — the desk owns the route. */
  onGo: (mode: Mode) => void;
}) {
  const uid = useId();
  const [inRoom, setInRoom] = useState(false);
  const generated = prepSheet(a);
  const sheet = [...carried, ...generated.filter((q) => !carried.some((c) => c.id === q.id))];
  const checked = prep.checked;
  const answers = prep.answers;
  const done = sheet.filter((q) => checked[q.id]).length;
  const written = sheet.filter((q) => (answers[q.id] ?? "").trim()).length;

  // The panel's whole promise is "take this into the room", and the room is the
  // one place it had never been designed for. See `RoomView`.
  if (inRoom) {
    return (
      <RoomView sheet={sheet} prep={prep} setPrep={setPrep} onLeave={() => setInRoom(false)} />
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead eyebrow="Consultation prep" title="Take this into the room">
          A question sheet built from your own gaps first, then the standing set. Tick what was
          answered and write what they actually said — that record is the receipt. It stays on this
          venue block and prints with the decision card.
        </SectionHead>
        <div className="text-right">
          <p className="num text-3xl text-ink">
            {done}
            <span className="text-ink-soft">/{sheet.length}</span>
          </p>
          <p className="eyebrow mt-1">Answered on record</p>
        </div>
      </div>

      <div className="no-print flex flex-wrap items-center gap-4 border border-rule bg-parchment px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-ink">
            {prep.visit
              ? `Asked on ${prep.visit.at.slice(0, 10)}, answered by ${prep.visit.who}. Both print on the decision card.`
              : "Going in now? The room view gives you one question at a time, in type you can read at arm's length, and holds the screen awake."}
          </p>
        </div>
        <button type="button" className="btn-primary" onClick={() => setInRoom(true)}>
          {prep.visit ? "Back into the room view" : "Open the room view"}
        </button>
      </div>

      <ol className="space-y-px border border-rule">
        {sheet.map((q, i) => {
          const questionId = `${uid}-q-${q.id}`;
          const answerId = `${uid}-a-${q.id}`;
          const answerLabelId = `${uid}-al-${q.id}`;
          return (
            <li
              key={q.id}
              className={`border-b border-rule px-5 py-5 last:border-b-0 ${
                checked[q.id] ? "bg-pine-tint/40" : "bg-parchment/60"
              }`}
            >
              <div className="flex items-start gap-2">
                {/* 44px target, 20px mark. The old control was a 16px square
                    named "Mark answered" twenty-five times over. */}
                <button
                  type="button"
                  aria-pressed={!!checked[q.id]}
                  onClick={() =>
                    setPrep({
                      ...prep,
                      checked: { ...checked, [q.id]: !checked[q.id] },
                    })
                  }
                  className="-ml-1.5 flex size-11 shrink-0 items-center justify-center"
                >
                  <span
                    aria-hidden="true"
                    className={`size-5 border ${
                      checked[q.id] ? "border-pine bg-pine" : "border-rule bg-parchment"
                    }`}
                  />
                  <span className="sr-only">Mark answered — “{q.text}”</span>
                </button>
                <div className="min-w-0 flex-1">
                  <p className="eyebrow">
                    {String(i + 1).padStart(2, "0")} · {q.group}
                  </p>
                  <p id={questionId} className="mt-2 font-display text-xl leading-snug text-ink">
                    “{q.text}”
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{q.why}</p>
                  <label id={answerLabelId} className="label-mono mt-3 block" htmlFor={answerId}>
                    What they said
                  </label>
                  {/* Named by its own label AND the question above it, so the
                      twenty-fifth box on the page is not another "edit text". */}
                  <input
                    id={answerId}
                    aria-labelledby={`${answerLabelId} ${questionId}`}
                    className="field"
                    placeholder="In their words"
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
          );
        })}
      </ol>

      <div className="no-print border border-rule bg-parchment/60 p-6">
        <p className="eyebrow">Where this goes</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink">
          {written
            ? `${written} of ${sheet.length} questions have wording written against them. They print on the decision card, under the questions they answer — nothing is summarised away.`
            : "Nothing is written down yet. A tick or a line of wording puts a question on the decision card, in their words. A question left untouched prints nowhere — the card records what was said, not what you meant to ask."}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              // The sheet being taken into a room is a thing worth remembering
              // three weeks later, when the reader has forgotten what they were
              // going to ask. Best effort: a blocked storage API must not stop
              // the navigation.
              void import("@/lib/spa-decision-record")
                .then((m) => m.recordConsultPrep(a, sheet.length))
                .catch(() => undefined);
              onGo("packet");
            }}
          >
            Open the decision card
          </button>
          <button type="button" className="btn-quiet" onClick={() => onGo("full")}>
            Back to the venue
          </button>
        </div>
      </div>

      <p className="max-w-2xl text-xs leading-relaxed text-ink-soft">
        Education only. This sheet records what was said; it does not assess candidacy, rank
        providers, or clear you for any service.
      </p>
    </div>
  );
}

/* --------------------------------------------------------------- decoder */

/**
 * The Claim Decoder.
 *
 * The panel used to print a count and a promise-pressure number beside a list
 * of flagged sentences. Both were true and neither told the reader what kind of
 * page they were holding. What does is the split — how much of this could be
 * checked, and how much of it would absorb any question you asked — followed by
 * the strike-through, which is the argument made in one image rather than in
 * fifteen rows.
 *
 * The textarea writes to `marketing`, and the decoder reads `claimText`, which
 * is marketing plus the menu line plus the series terms. That is deliberate:
 * package language and membership terms are where the commercial claims live,
 * and a reader who pasted them into the money panel should not have to paste
 * them again here to have them read.
 */
export function DecoderPanel({
  input,
  patch,
  a,
  onGo,
}: {
  input: EvalInput;
  patch: Patch;
  a: Assessment;
  onGo: (mode: Mode) => void;
}) {
  const text = claimText(input);
  const idle = text.trim().length < 3;
  const s = a.claimSummary;

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
      <div>
        <SectionHead eyebrow="Read the sentence" title="What did that actually say">
          Paste the copy — an advertisement, a service description, a package page, a membership
          term, a DM. The decoder does not judge the service. It names what each sentence is doing,
          whether any answer could ever count against it, and what would have to be produced for it
          to stand up.
        </SectionHead>
        <div className="mt-8">
          <TextField
            label="Marketing text, package language, membership terms"
            value={input.marketing}
            onChange={(v) => patch({ marketing: v })}
            area
            rows={10}
            placeholder="Paste it exactly as written. More is better than less — the decoder counts repeats, and a page that applies time pressure six times is describing its own sales process."
          />
        </div>
        {input.menuLine.trim() || input.seriesPressure.trim() ? (
          <p className="mt-4 text-xs leading-relaxed text-ink-soft">
            Also being read: your menu line and your series terms, because that is where commercial
            claims usually sit. You do not have to paste them twice.
          </p>
        ) : null}
        <p className="mt-4 text-xs leading-relaxed text-ink-soft">
          A flagged phrase is not an accusation. Plenty of careful rooms write bad copy, and a
          sentence the decoder did not catch is a fact about the decoder's rules rather than a clean
          bill of health.
        </p>
      </div>

      <div className="min-w-0">
        {idle ? (
          <div className="panel rounded-xl px-7 py-14 text-center">
            <p className="eyebrow">Decoder idle</p>
            <h3 className="display-lg mx-auto mt-4 max-w-sm text-ink">
              Nothing to <span className="italic text-oxblood">pull apart</span>
            </h3>
            <p className="lede mx-auto mt-4 max-w-md">
              Paste a paragraph. Certainty, permanence, tier words, borrowed regulation, time
              pressure, commitment structure and the sentences that are only about how you will feel
              come apart first.
            </p>
          </div>
        ) : (
          <div className="rise space-y-6">
            <ClaimSummaryBar summary={s} />

            {a.claims.length ? (
              <>
                <ClaimAnatomyFigure text={text} claims={a.claims} />
                <WhatIsLeft text={text} claims={a.claims} />
                <ClaimLedger claims={a.claims} />
              </>
            ) : null}

            <div className="border border-rule bg-parchment/60 p-6">
              <p className="eyebrow">What this does not tell you</p>
              <p className="mt-3 text-sm leading-relaxed text-ink">
                The decoder read a piece of copy. It has said nothing about who performs the
                service, under which licence, with what product, in what room —{" "}
                {a.failClosed.length} of {a.signals.length} signals on this venue are still unnamed
                {a.cost.blockedBy.length
                  ? ", and the first-year cost cannot be worked out from what has been said either"
                  : ""}
                .
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button type="button" className="btn-primary" onClick={() => onGo("full")}>
                  Check the room this came from
                </button>
                {/* "pattern(s)" is the one lazy plural left in the app. It stays
                    because e2e/desk-flow.spec.ts asserts on /pattern\(s\) caught/i
                    and that file is not ours to edit; fix both together. */}
                <span className="sr-only">{a.claims.length} pattern(s) caught</span>
                <button type="button" className="btn-quiet" onClick={() => onGo("cost")}>
                  Price what it is selling
                </button>
                <button type="button" className="btn-quiet" onClick={() => onGo("intake")}>
                  Paste the whole page instead
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
