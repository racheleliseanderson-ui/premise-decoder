import { useState } from "react";
import {
  SERVICE_LABELS,
  VENUE_LABELS,
  prepSheet,
  type Assessment,
  type EvalInput,
  type ServiceClass,
  type Venue,
} from "@/lib/engine";
import { SelectField, TextField, SectionHead, StateChip } from "./ui";
import { DecisionCard } from "./DecisionCard";
import { ClaimLedger } from "./ClaimDecoder";
import sanitationImg from "@/assets/sanitation.jpg";
import deviceImg from "@/assets/device.jpg";

type Patch = (patch: Partial<EvalInput>) => void;

const serviceOptions = (Object.keys(SERVICE_LABELS) as ServiceClass[]).map((v) => ({
  value: v,
  label: SERVICE_LABELS[v],
}));
const venueOptions = (Object.keys(VENUE_LABELS) as Venue[]).map((v) => ({
  value: v,
  label: VENUE_LABELS[v],
}));

/* -------------------------------------------------------------- fast path */

export function FastPath({
  input,
  patch,
  a,
  onDeepen,
}: {
  input: EvalInput;
  patch: Patch;
  a: Assessment;
  onDeepen: () => void;
}) {
  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)] lg:gap-16">
      <div>
        <SectionHead eyebrow="Fast path · four fields" title="What are you considering?">
          Four answers produce a Before You Book card. Go deeper only when four is not enough.
        </SectionHead>

        <div className="mt-8 space-y-5">
          <SelectField
            label="Service class"
            value={input.serviceClass}
            onChange={(v) => patch({ serviceClass: v })}
            options={serviceOptions}
          />
          <SelectField
            label="Where"
            value={input.venue}
            onChange={(v) => patch({ venue: v })}
            options={venueOptions}
          />
          <TextField
            label="Service name / menu line"
            value={input.menuLine}
            onChange={(v) => patch({ menuLine: v })}
            placeholder="e.g. Hyaluronic acid filler, 1 syringe, nasolabial folds"
            hint="Quote the menu, not the mood."
          />
          <TextField
            label="Product / device (if known)"
            value={input.product}
            onChange={(v) => patch({ product: v })}
            placeholder="Brand name on the box or device panel"
            hint="“Medical-grade” is a tier, not a product — it reads as unresolved."
          />
          <TextField
            label="Who performs it"
            value={input.performer}
            onChange={(v) => patch({ performer: v })}
            placeholder="e.g. RN injector · licensed esthetician"
          />
          <div className="grid gap-5 sm:grid-cols-2">
            <TextField
              label="Quoted price"
              value={input.price}
              onChange={(v) => patch({ price: v })}
              placeholder="$"
            />
            <TextField
              label="License stated"
              value={input.license}
              onChange={(v) => patch({ license: v })}
              placeholder="Type / number, if given"
            />
          </div>
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

const STAGES = [
  { id: 0, name: "Identity", note: "The service and the room" },
  { id: 1, name: "Agency", note: "Who performs, under what license" },
  { id: 2, name: "Practice", note: "Sanitation, oversight, night cover" },
  { id: 3, name: "Pressure", note: "Marketing text and commitment" },
] as const;

export function FullEvaluate({
  input,
  patch,
  a,
}: {
  input: EvalInput;
  patch: Patch;
  a: Assessment;
}) {
  const [stage, setStage] = useState(0);

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,30rem)_minmax(0,1fr)] lg:gap-16">
      <div>
        <SectionHead eyebrow="Full evaluate · progressive depth" title="One stage at a time">
          Four stages, opened in order. Nothing is required — an unanswered stage simply stays visible
          as a gap rather than being smoothed over.
        </SectionHead>

        <ol className="mt-8 space-y-px border border-rule">
          {STAGES.map((s) => {
            const open = stage === s.id;
            const stageSignals = signalsForStage(a, s.id);
            const gaps = stageSignals.filter((x) => x.state !== "known").length;
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
                      <span className="block font-display text-xl leading-none text-ink">{s.name}</span>
                      <span className="mt-1 block text-xs text-ink-soft">{s.note}</span>
                    </span>
                  </span>
                  <span className={gaps === 0 ? "chip chip-known" : "chip chip-partial"}>
                    {gaps === 0 ? "Resolved" : `${gaps} open`}
                  </span>
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
                        <TextField
                          label="Exact menu line"
                          value={input.menuLine}
                          onChange={(v) => patch({ menuLine: v })}
                          placeholder="Copy it from the menu, word for word"
                        />
                        <TextField
                          label="Product / device named"
                          value={input.product}
                          onChange={(v) => patch({ product: v })}
                          placeholder="Manufacturer and product name"
                        />
                      </>
                    )}
                    {s.id === 1 && (
                      <>
                        <TextField
                          label="Who performs the service"
                          value={input.performer}
                          onChange={(v) => patch({ performer: v })}
                          placeholder="Role as stated to you"
                        />
                        <TextField
                          label="License type / number stated"
                          value={input.license}
                          onChange={(v) => patch({ license: v })}
                          placeholder="RN, LME, MD, license number…"
                          hint="A title is marketing. A license is checkable against the state board."
                        />
                        <TextField
                          label="Quoted price"
                          value={input.price}
                          onChange={(v) => patch({ price: v })}
                          placeholder="Per session, per unit, per package"
                        />
                      </>
                    )}
                    {s.id === 2 && (
                      <>
                        <TextField
                          label="Oversight described"
                          value={input.supervision}
                          onChange={(v) => patch({ supervision: v })}
                          placeholder="On site, remote, by chart review…"
                        />
                        <TextField
                          label="Sanitation practice described"
                          value={input.sanitation}
                          onChange={(v) => patch({ sanitation: v })}
                          area
                          rows={3}
                          placeholder="Single-use, sealed packaging opened in front of you, autoclave, sharps log…"
                        />
                        <TextField
                          label="After-hours ownership"
                          value={input.afterHours}
                          onChange={(v) => patch({ afterHours: v })}
                          placeholder="Who do you reach at 9pm, and how?"
                          hint="A voicemail box or a DM inbox is treated as unresolved."
                        />
                        <TextField
                          label="Consent and record"
                          value={input.consent}
                          onChange={(v) => patch({ consent: v })}
                          placeholder="Written form in advance? Copy kept? Photos charted?"
                        />
                      </>
                    )}
                    {s.id === 3 && (
                      <>
                        <TextField
                          label="Marketing text as written"
                          value={input.marketing}
                          onChange={(v) => patch({ marketing: v })}
                          area
                          rows={6}
                          placeholder="Paste the ad, the menu blurb, the DM, the sign at the desk."
                          hint="The Claim Decoder runs on this text automatically."
                        />
                        <TextField
                          label="Series / commitment stated"
                          value={input.seriesPressure}
                          onChange={(v) => patch({ seriesPressure: v })}
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
                          <StateChip state={sig.state} />
                        </li>
                      ))}
                    </ul>

                    {s.id < 3 ? (
                      <button type="button" className="btn-quiet" onClick={() => setStage(s.id + 1)}>
                        Next stage → {STAGES[s.id + 1].name}
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
    0: ["menu", "venue", "product"],
    1: ["performer"],
    2: ["supervision", "sanitation", "afterhours", "consent"],
    3: [],
  };
  if (stage === 3) return [];
  return a.signals.filter((s) => map[stage]?.includes(s.id));
}

/* ------------------------------------------------------------ consult prep */

export function ConsultPrep({ a }: { a: Assessment }) {
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const sheet = prepSheet(a);
  const done = sheet.filter((q) => checked[q.id]).length;

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHead eyebrow="Consultation prep" title="Take this into the room">
          A question sheet built from your own gaps first, then the standing set. Tick what was answered
          and write what they actually said — that record is the receipt.
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
                onClick={() => setChecked((c) => ({ ...c, [q.id]: !c[q.id] }))}
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
                  onChange={(e) => setAnswers((s) => ({ ...s, [q.id]: e.target.value }))}
                />
              </div>
            </div>
          </li>
        ))}
      </ol>

      <p className="max-w-2xl text-xs leading-relaxed text-ink-soft">
        Education only. This sheet records what was said; it does not assess candidacy, rank providers,
        or clear you for any service.
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
        <SectionHead eyebrow="Optional tool" title="Decode one sentence">
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
            <p className="eyebrow">Decoder idle</p>
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
