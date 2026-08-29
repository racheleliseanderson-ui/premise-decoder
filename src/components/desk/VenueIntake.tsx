import { useEffect, useMemo, useState } from "react";
import { extractFromText, type ExtractResult, type Proposal } from "@/lib/extract";
import type { Assessment, EvalInput, ServiceClass, Venue } from "@/lib/engine";
import { SectionHead } from "./ui";
import { ClaimLedger } from "./ClaimDecoder";

import type { Evidence } from "@/lib/session";

type Patch = (patch: Partial<EvalInput>, meta?: Record<string, Evidence>) => void;

const SAMPLE = `Signature Medical-Grade Glow Facial — $189, or a package of 6 for $899.
Performed by our esthetician at our medical spa in the design district.
We use a proprietary custom blend and our HydraFacial device.
Consent form and health history are completed at intake.
All tools are single-use or autoclave sterilized.
Questions after your appointment go to our answering service, returned the next business day.`;

export const PASTE_SAMPLE = SAMPLE;

export function VenueIntake({
  input,
  patch,
  a,
  evidence,
  draft,
  onDraft,
  onEvaluate,
}: {
  input: EvalInput;
  patch: Patch;
  a: Assessment;
  evidence: Record<string, Evidence>;
  draft: string;
  onDraft: (text: string) => void;
  onEvaluate: () => void;
}) {
  const [text, setText] = useState(draft);
  const [result, setResult] = useState<ExtractResult | null>(null);
  const [chosen, setChosen] = useState<Record<string, boolean>>({});
  const [applied, setApplied] = useState(0);

  useEffect(() => {
    setText(draft);
    if (draft.trim().length >= 8) run(draft);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft]);

  const setDraft = (next: string) => {
    setText(next);
    onDraft(next);
  };

  const run = (source: string) => {
    const r = extractFromText(source, input);
    setResult(r);
    setChosen(
      Object.fromEntries(r.proposals.map((p) => [p.field, !p.conflict])) as Record<string, boolean>,
    );
    setApplied(0);
  };

  const selected = useMemo(
    () => (result?.proposals ?? []).filter((p) => chosen[p.field]),
    [result, chosen],
  );

  const apply = () => {
    if (!selected.length) return;
    const next: Partial<EvalInput> = {};
    for (const p of selected) {
      if (p.field === "serviceClass") next.serviceClass = p.value as ServiceClass;
      else if (p.field === "venue") next.venue = p.value as Venue;
      else (next as Record<string, string>)[p.field] = p.value;
    }
    const meta: Record<string, Evidence> = {};
    const at = Date.now();
    for (const p of selected) {
      meta[p.field] = { origin: "extracted", at, quote: p.evidence, source: "Pasted venue text" };
    }
    if (!input.marketing.trim()) {
      next.marketing = text.trim();
      meta["marketing"] = { origin: "extracted", at, source: "Pasted venue text" };
    }
    patch(next, meta);
    setApplied(selected.length);
    setResult(null);
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[minmax(0,32rem)_minmax(0,1fr)] lg:gap-16">
      <div>
        <SectionHead
          eyebrow="Add venue text · read it back to you"
          title="Paste what they told you."
        >
          A menu page, a booking confirmation, a DM reply, a consult email. The desk reads it,
          proposes only what the text literally names, and quotes the sentence behind every
          proposal. Anything it cannot find stays unfilled — silence is a finding, not a blank to
          guess at.
        </SectionHead>

        <div className="mt-8">
          <label className="block">
            <span className="label-mono">Venue text</span>
            <textarea
              id="venue-paste"
              className="field resize-y font-sans leading-relaxed"
              rows={12}
              value={text}
              placeholder="Paste the menu line, the pricing, the reply about who performs it…"
              onChange={(e) => setDraft(e.target.value)}
            />
          </label>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="btn-primary"
              disabled={text.trim().length < 8}
              onClick={() => run(text)}
            >
              Read this text
            </button>
            <button
              type="button"
              className="btn-quiet"
              onClick={() => {
                setDraft(SAMPLE);
                run(SAMPLE);
              }}
            >
              Load an example page
            </button>
            {text ? (
              <button
                type="button"
                className="btn-quiet"
                onClick={() => {
                  setDraft("");
                  setResult(null);
                }}
              >
                Clear
              </button>
            ) : null}
          </div>
          <p className="num mt-6 text-[0.625rem] tracking-[0.14em] text-ink-soft">
            NOTHING LEAVES THIS BROWSER · NO INFERENCE · EDUCATION ONLY
          </p>
        </div>
      </div>

      <div className="space-y-8">
        {applied > 0 ? (
          <div className="border border-rule bg-pine/8 p-6">
            <p className="eyebrow">Applied</p>
            <p className="mt-3 font-display text-2xl leading-tight text-ink">
              {applied} field{applied === 1 ? "" : "s"} filled from the pasted text.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
<<<<<<< Updated upstream
              Setting resolved is now {a.place}% · {a.failClosed.length} items remain unnamed.
              Paste more text to close them, or open the full evaluate to answer them yourself.
=======
              {a.place}% of the setting is now named · {a.failClosed.length} things the spa still
              has not stated. Paste more text to close them, or open the whole picture and answer
              them yourself.
>>>>>>> Stashed changes
            </p>
            <button type="button" className="btn-quiet mt-5" onClick={onEvaluate}>
              Open the whole picture
            </button>
          </div>
        ) : null}

        {result ? (
          <>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Ready to fill in</p>
                <p className="mt-2 font-display text-3xl leading-none text-ink">
                  {result.proposals.length}
                  <span className="ml-2 text-base italic text-ink-soft">
                    from {result.sentences} sentence{result.sentences === 1 ? "" : "s"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                className="btn-primary"
                disabled={!selected.length}
                onClick={apply}
              >
                Fill {selected.length} field{selected.length === 1 ? "" : "s"} on the desk
              </button>
            </div>

            {result.proposals.length === 0 ? (
              <p className="border border-rule bg-parchment/70 p-5 text-sm italic leading-relaxed text-ink-soft">
                The text names nothing the desk can fill. That is itself the reading: this material
                sells the promise without resolving the setting.
              </p>
            ) : (
              <ul className="space-y-px border border-rule">
                {result.proposals.map((p) => (
                  <ProposalRow
                    key={p.field}
                    p={p}
                    on={Boolean(chosen[p.field])}
                    toggle={() => setChosen((c) => ({ ...c, [p.field]: !c[p.field] }))}
                  />
                ))}
              </ul>
            )}

            {result.silent.length ? (
              <div className="border border-rule border-dashed p-5">
                <p className="eyebrow">The text stayed silent on</p>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {result.silent.map((s) => s.label).join(" · ")}
                </p>
                <p className="mt-3 text-xs italic leading-relaxed text-ink-soft">
<<<<<<< Updated upstream
                  These remain unnamed. Ask for them in writing rather than assuming the
                  omission is benign.
=======
                  These stay unanswered. Ask for them in writing rather than assuming the silence is
                  benign.
>>>>>>> Stashed changes
                </p>
              </div>
            ) : null}
          </>
        ) : null}

        {a.claims.length ? (
          <div>
            <p className="eyebrow">Patterns caught in the same text</p>
            <div className="mt-4">
              <ClaimLedger claims={a.claims} />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ProposalRow({ p, on, toggle }: { p: Proposal; on: boolean; toggle: () => void }) {
  return (
    <li
      className={`border-b border-rule last:border-b-0 ${on ? "bg-oxblood-tint/25" : "bg-parchment/60"}`}
    >
      <button type="button" onClick={toggle} className="w-full p-5 text-left" aria-pressed={on}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={on ? "chip chip-known" : "chip"}>
            <span aria-hidden="true" className="text-[0.7em]">
              {on ? "●" : "○"}
            </span>
            {on ? "Will fill" : "Left out"}
          </span>
          <span className="eyebrow">{p.label}</span>
          {p.conflict ? <span className="chip chip-partial">Overwrites current entry</span> : null}
        </div>
        <p className="mt-3 font-display text-xl leading-snug text-ink">{p.display}</p>
        <p className="mt-2 text-xs italic leading-relaxed text-ink-soft">From: “{p.evidence}”</p>
      </button>
    </li>
  );
}
