import { useEffect, useRef, useState } from "react";

import type { PrepQuestion } from "@/lib/engine";
import type { PrepState } from "@/lib/session";

/**
 * The sheet, in the room.
 *
 * Consult prep generates the right questions and then renders them as a web
 * form — sixteen point type, a page of surrounding furniture, and a phone that
 * goes dark ninety seconds into the conversation. The whole promise of the
 * panel is "take this into the room", and the room is the one place the panel
 * had never been designed for.
 *
 * What changes in a consultation: you are holding the phone at arm's length,
 * one-handed, while somebody is talking; you have thirty seconds between
 * questions, not thirty minutes; and the expensive mistake is not asking a
 * question badly, it is forgetting to ask it at all. So: one question at a
 * time, in type you can read across a desk, with the tick and the answer field
 * the only two things on screen.
 *
 * WHO ANSWERED IS A FIELD. "The person at the desk said" and "the practitioner
 * said" are not the same answer to the same question, and six weeks later
 * nobody remembers which it was. It is asked once, at the start, and it prints
 * on the card.
 *
 * THE SCREEN STAYS AWAKE, where the browser allows it. A phone that sleeps
 * mid-consultation is the actual failure mode of a sheet like this, and the
 * Wake Lock API costs one call. Where it is refused — and it often is — the
 * view says so rather than pretending.
 */
export function RoomView({
  sheet,
  prep,
  setPrep,
  onLeave,
}: {
  sheet: PrepQuestion[];
  prep: PrepState;
  setPrep: (next: PrepState) => void;
  onLeave: () => void;
}) {
  const [i, setI] = useState(0);
  const [who, setWho] = useState(prep.visit?.who ?? "");
  const [awake, setAwake] = useState<"on" | "off" | "refused">("off");
  const answerRef = useRef<HTMLTextAreaElement>(null);

  const started = Boolean(prep.visit);
  const question = sheet[i];
  const answered = sheet.filter((q) => prep.checked[q.id]).length;

  useEffect(() => {
    if (!started) return;
    let released: (() => void) | null = null;
    let cancelled = false;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (t: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    if (!nav.wakeLock) {
      setAwake("refused");
      return;
    }
    nav.wakeLock
      .request("screen")
      .then((lock) => {
        if (cancelled) {
          void lock.release();
          return;
        }
        setAwake("on");
        released = () => void lock.release();
      })
      .catch(() => setAwake("refused"));
    return () => {
      cancelled = true;
      released?.();
    };
  }, [started]);

  if (!started) {
    return (
      <section className="room-view" aria-label="Before the consultation">
        <p className="eyebrow">Before you go in</p>
        <h2 className="mt-3 font-display text-3xl leading-tight text-ink">
          Who is going to be answering?
        </h2>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-ink-soft">
          Not their name — their role. Six weeks from now, “the receptionist said the nurse does
          them” and “the nurse said she does them” are the same sentence in your memory and two
          completely different answers on paper.
        </p>
        <form
          className="mt-6"
          onSubmit={(e) => {
            e.preventDefault();
            setPrep({
              ...prep,
              visit: { at: new Date().toISOString(), who: who.trim().slice(0, 80) || "not stated" },
            });
          }}
        >
          <label htmlFor="room-who" className="sr-only">
            Who is answering
          </label>
          <input
            id="room-who"
            value={who}
            onChange={(e) => setWho(e.target.value)}
            placeholder="The practitioner · the receptionist · a consultant"
            className="w-full border border-rule bg-bone px-4 py-3 text-lg text-ink"
          />
          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" className="btn-primary">
              Start · {sheet.length} questions
            </button>
            <button type="button" className="btn-quiet" onClick={onLeave}>
              Back to the sheet
            </button>
          </div>
        </form>
      </section>
    );
  }

  if (!question) {
    return (
      <section className="room-view" aria-label="Consultation finished">
        <p className="eyebrow">That is the sheet</p>
        <h2 className="mt-3 font-display text-3xl leading-tight text-ink">
          {answered} of {sheet.length} answered
        </h2>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-ink-soft">
          Everything unticked is still open, and staying open is a finding rather than a failure —
          it is the list of things to ask before any money moves. It all prints on the decision
          card, with the date and who was answering.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" className="btn-primary" onClick={onLeave}>
            Leave the room view
          </button>
          <button type="button" className="btn-quiet" onClick={() => setI(0)}>
            Go back through them
          </button>
        </div>
      </section>
    );
  }

  const isChecked = Boolean(prep.checked[question.id]);
  const said = prep.answers[question.id] ?? "";

  const go = (next: number) => {
    setI(Math.max(0, Math.min(sheet.length, next)));
    window.setTimeout(() => answerRef.current?.blur(), 0);
  };

  return (
    <section className="room-view" aria-label="In the room">
      <div className="flex items-baseline justify-between gap-4">
        <p className="eyebrow">
          {String(i + 1).padStart(2, "0")} of {sheet.length} · {question.group}
        </p>
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-soft">
          {answered} ticked
        </p>
      </div>

      <p className="mt-4 font-display text-[clamp(1.6rem,5.5vw,2.4rem)] leading-tight text-ink">
        {question.text}
      </p>
      {question.why ? (
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-soft">{question.why}</p>
      ) : null}

      <button
        type="button"
        aria-pressed={isChecked}
        onClick={() =>
          setPrep({ ...prep, checked: { ...prep.checked, [question.id]: !isChecked } })
        }
        className={`mt-6 flex w-full items-center gap-4 border px-5 py-4 text-left text-lg ${
          isChecked ? "border-pine bg-pine-tint/50 text-ink" : "border-rule bg-parchment text-ink"
        }`}
      >
        <span
          aria-hidden="true"
          className={`size-7 shrink-0 border ${isChecked ? "border-pine bg-pine" : "border-rule bg-bone"}`}
        />
        {isChecked ? "They answered this" : "Mark it answered"}
      </button>

      <label htmlFor="room-answer" className="eyebrow mt-6 block">
        What they actually said
      </label>
      <textarea
        id="room-answer"
        ref={answerRef}
        value={said}
        onChange={(e) =>
          setPrep({ ...prep, answers: { ...prep.answers, [question.id]: e.target.value } })
        }
        rows={3}
        className="mt-2 w-full border border-rule bg-bone px-4 py-3 text-lg leading-relaxed text-ink"
        placeholder="Their words, not your summary of them."
      />

      <div className="mt-6 flex items-center justify-between gap-3">
        <button type="button" className="btn-quiet" onClick={() => go(i - 1)} disabled={i === 0}>
          Back
        </button>
        <button type="button" className="btn-primary" onClick={() => go(i + 1)}>
          {i === sheet.length - 1 ? "Finish" : "Next question"}
        </button>
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
        <p className="font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-soft">
          {awake === "on"
            ? "Screen held awake"
            : awake === "refused"
              ? "This browser will not hold the screen awake — set your lock screen longer"
              : ""}
        </p>
        <button
          type="button"
          className="inline-flex min-h-11 items-center font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-soft underline decoration-dotted underline-offset-4 hover:text-ink"
          onClick={onLeave}
        >
          Leave the room view
        </button>
      </div>
    </section>
  );
}
