import { useId, useState } from "react";
import {
  KIND_LABEL,
  KIND_NOTE,
  MEASURABILITY_LABEL,
  type ClaimKind,
  type ClaimSummary,
  type DecodedClaim,
  type Measurability,
} from "@/lib/engine";

/**
 * The claim ledger.
 *
 * One row per finding, and each row answers four questions in a fixed order:
 * what was said, what job the sentence is doing, what would have to exist for
 * it to stand up, and what to ask instead. The order is deliberate — the
 * substantiation list is the part a reader can act on, and it used to not be
 * there at all.
 */

const SEVERITY_CHIP: Record<DecodedClaim["severity"], string> = {
  hard: "chip chip-fail",
  flag: "chip chip-partial",
  note: "chip",
};

const SEVERITY_WORD: Record<DecodedClaim["severity"], string> = {
  hard: "Hard flag",
  flag: "Flag",
  note: "Note",
};

/**
 * The measurability glyph.
 *
 * Shape as well as colour, because this is the axis a reader is most likely to
 * scan for and the palette has no spare hue for it. A filled square is a claim
 * you can chase; a hollow one is a sentence that will absorb any question you
 * put to it.
 */
const MEASURE_GLYPH: Record<Measurability, string> = {
  measurable: "■",
  vague: "◪",
  unfalsifiable: "□",
};

export function ClaimLedger({ claims }: { claims: DecodedClaim[] }) {
  if (claims.length === 0) {
    return (
      <p className="text-sm italic text-ink-soft">
        No marketing patterns caught in this text. Absence of flags is not endorsement — it only
        means this sentence is not the problem.
      </p>
    );
  }
  return (
    <ul className="space-y-px border border-rule">
      {claims.map((c, i) => (
        <ClaimRow key={`${c.category}-${c.at}-${i}`} c={c} />
      ))}
    </ul>
  );
}

function ClaimRow({ c }: { c: DecodedClaim }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();

  return (
    <li className="border-b border-rule bg-parchment/70 last:border-b-0">
      <div className="grid gap-5 p-5 md:grid-cols-[1.1fr_1fr]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={SEVERITY_CHIP[c.severity]}>{SEVERITY_WORD[c.severity]}</span>
            <span className="eyebrow">{c.category}</span>
          </div>
          <p className="mt-3 font-display text-xl italic leading-snug text-ink">“{c.phrase}”</p>

          <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-soft">
            <span title={KIND_NOTE[c.kind]}>{KIND_LABEL[c.kind]}</span>
            <span aria-hidden="true" className="text-rule">
              ·
            </span>
            <span>
              <span aria-hidden="true" className="mr-1 tracking-normal">
                {MEASURE_GLYPH[c.measurability]}
              </span>
              {MEASURABILITY_LABEL[c.measurability]}
            </span>
            {c.count > 1 ? (
              <>
                <span aria-hidden="true" className="text-rule">
                  ·
                </span>
                <span className="text-oxblood">{c.count}× on this page</span>
              </>
            ) : null}
          </p>

          {c.emotionalWork ? (
            <p className="mt-3 text-xs leading-relaxed text-ink-soft">
              <span className="label-mono">Doing the persuading:</span>{" "}
              <span className="italic text-ink">{c.emotionalWork}</span>
            </p>
          ) : null}
        </div>

        <div className="min-w-0 border-l-0 border-rule md:border-l md:pl-5">
          <p className="eyebrow">What it leaves out</p>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.hides}</p>
          <p className="eyebrow mt-4">Ask instead</p>
          <p className="mt-2 text-sm leading-relaxed text-ink">“{c.ask}”</p>

          <button
            type="button"
            className="mt-4 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-oxblood underline underline-offset-4"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide" : "What would settle it"}
          </button>
          {open ? (
            <div id={panelId} className="mt-3 border-l-2 border-bronze-soft pl-4">
              <ul className="space-y-2">
                {c.substantiation.map((line) => (
                  <li key={line} className="text-xs leading-relaxed text-ink">
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------- summary */

/**
 * What the passage adds up to.
 *
 * The old decoder printed a count and a promise-pressure number, which told a
 * reader how much was caught and nothing about what kind of page they were
 * holding. The useful reading is the split: how much of this could be checked,
 * and how much of it would absorb any question you asked.
 */
export function ClaimSummaryBar({ summary }: { summary: ClaimSummary }) {
  const { byMeasurability: m, total } = summary;
  if (!total) {
    return (
      <div className="border border-rule bg-parchment/60 px-5 py-4">
        <p className="text-sm leading-relaxed text-ink">{summary.line}</p>
      </div>
    );
  }

  const segs: { key: Measurability; n: number; cls: string }[] = [
    { key: "measurable", n: m.measurable, cls: "bg-pine" },
    { key: "vague", n: m.vague, cls: "bg-bronze" },
    { key: "unfalsifiable", n: m.unfalsifiable, cls: "bg-oxblood" },
  ];

  return (
    <div className="border border-rule bg-parchment/60">
      <div className="px-5 pt-5">
        <p className="eyebrow">
          {total} finding{total === 1 ? "" : "s"} · {summary.patterns} pattern
          {summary.patterns === 1 ? "" : "s"}
        </p>
        <p className="mt-3 text-sm leading-relaxed text-ink">{summary.line}</p>
      </div>

      <div className="mt-5 px-5">
        <div
          className="flex h-2 w-full overflow-hidden bg-rule/60"
          role="img"
          aria-label={`${m.measurable} measurable, ${m.vague} vague, ${m.unfalsifiable} unfalsifiable`}
        >
          {segs.map((s) =>
            s.n ? (
              <span
                key={s.key}
                className={s.cls}
                style={{ width: `${(s.n / total) * 100}%` }}
                aria-hidden="true"
              />
            ) : null,
          )}
        </div>
        <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-soft">
          {segs.map((s) => (
            <li key={s.key}>
              <span aria-hidden="true" className="mr-1 tracking-normal">
                {MEASURE_GLYPH[s.key]}
              </span>
              {s.n} {MEASURABILITY_LABEL[s.key].toLowerCase()}
            </li>
          ))}
        </ul>
      </div>

      {summary.byKind.length ? (
        <div className="mt-5 border-t border-rule px-5 py-4">
          <p className="eyebrow">What the sentences are doing</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {summary.byKind.map(({ kind, n }) => (
              <li key={kind}>
                <span className="chip" title={KIND_NOTE[kind as ClaimKind]}>
                  {KIND_LABEL[kind as ClaimKind]}
                  <span className="num ml-1.5 text-[0.9em] text-oxblood">{n}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The passage with its unfalsifiable sentences struck out.
 *
 * This is the decoder's sharpest single move and it takes no reasoning at all:
 * cross out every sentence no answer could count against, and read what is
 * left. Usually it is a service name, a price, and nothing else. A reader who
 * sees that once reads the next advertisement differently.
 */
export function WhatIsLeft({ text, claims }: { text: string; claims: DecodedClaim[] }) {
  const struck = claims
    .filter((c) => c.measurability === "unfalsifiable")
    .map((c) => c.phrase.replace(/…$/, "").trim())
    .filter((p) => p.length > 12);

  if (!struck.length) return null;

  const sentences = text
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const isStruck = (s: string) => struck.some((p) => s.includes(p) || p.includes(s));
  const remaining = sentences.filter((s) => !isStruck(s));

  return (
    <div className="border border-rule bg-parchment/60 p-6">
      <p className="eyebrow">Read it again without the unfalsifiable sentences</p>
      <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-soft">
        Nothing here is an accusation. These are the sentences where no possible answer would count
        as failing — asking about them politely tends to produce more of the same sentence. What
        survives the strike-through is the part of the page that is actually about the treatment.
      </p>
      <p className="mt-5 max-w-prose font-display text-lg leading-relaxed text-ink">
        {sentences.map((s, i) => (
          <span key={`${i}-${s.slice(0, 12)}`}>
            {isStruck(s) ? (
              <s className="text-ink-soft/50 decoration-oxblood/60">{s}</s>
            ) : (
              <span>{s}</span>
            )}{" "}
          </span>
        ))}
      </p>
      <p className="mt-5 border-t border-rule pt-4 text-xs leading-relaxed text-ink-soft">
        {remaining.length === 0
          ? "Nothing survived. Every sentence in this passage is one no answer could contradict, which means the page has told you how to feel and not what is done."
          : `${remaining.length} of ${sentences.length} sentence${sentences.length === 1 ? "" : "s"} survived. That is the part worth taking into the room.`}
      </p>
    </div>
  );
}
