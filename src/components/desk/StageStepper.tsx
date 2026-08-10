import { useState } from "react";
import { STAGE_TONE, STAGE_WORD, type StageStatus, type StageId } from "@/lib/pipeline";

/**
 * Pipeline stepper. Every stage is explicit, run on request, and reports what it
 * found — including that it found nothing. No stage invents a value, and the
 * open items it lists are the literal fields still unanswered on the desk.
 */
export function StageStepper({
  stages,
  running,
  log,
  onRun,
  onRunAll,
  onOpen,
  onReset,
  title,
  runAllLabel,
}: {
  stages: StageStatus[];
  running: StageId | null;
  log: { at: number; text: string }[];
  onRun: (id: StageId) => void;
  onRunAll: () => void;
  onOpen: (mode: string) => void;
  onReset: () => void;
  title: string;
  runAllLabel: string;
}) {
  const [openLog, setOpenLog] = useState(false);
  const blocked = stages.filter((s) => s.state === "blocked").length;
  const clear = stages.filter((s) => s.state === "clear").length;
  const pct = Math.round((clear / stages.length) * 100);

  return (
    <section className="no-print border border-rule bg-bone/70 grain" aria-label={title}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-rule bg-oxblood-deep px-4 py-3 text-parchment sm:px-5">
        <div className="min-w-0">
          <p className="font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-bronze-soft">
            {title} · six stages
          </p>
          <p className="mt-1 truncate text-sm text-parchment/85">
            {blocked
              ? `${blocked} stage${blocked > 1 ? "s" : ""} blocked by a question that was asked and not answered.`
              : `${clear} of ${stages.length} stages clear. Run them in order, or one at a time.`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            className="btn-lux"
            onClick={onRunAll}
            disabled={Boolean(running)}
            aria-label={runAllLabel}
          >
            {running ? "Running…" : runAllLabel}
          </button>
          {log.length ? (
            <button
              type="button"
              className="btn-lux-quiet"
              onClick={() => setOpenLog((v) => !v)}
              aria-expanded={openLog}
            >
              Log · {log.length}
            </button>
          ) : null}
        </div>
      </div>

      <div
        className="h-1 w-full bg-bronze-soft"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Stages resolved"
      >
        <div
          className="h-full bg-oxblood transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      <ol className="flex snap-x snap-mandatory overflow-x-auto">
        {stages.map((s) => {
          const isRunning = running === s.def.id;
          return (
            <li
              key={s.def.id}
              className={`relative min-w-[15rem] shrink-0 snap-start border-r border-rule p-4 last:border-r-0 sm:min-w-[16rem] ${
                isRunning ? "bg-bronze-soft/50" : "bg-transparent"
              }`}
              aria-current={isRunning ? "step" : undefined}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
                <span className="num text-xs text-oxblood">
                  {String(s.def.index + 1).padStart(2, "0")} / 06
                </span>
                <span className={STAGE_TONE[s.state]}>
                  {isRunning ? "Reading…" : STAGE_WORD[s.state]}
                </span>
              </div>

              <p className="mt-2.5 font-display text-2xl leading-tight text-ink">{s.def.name}</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-soft">{s.def.what}</p>
              <p className="mt-2.5 text-xs leading-relaxed text-ink" aria-live="polite">
                {s.line}
              </p>

              {s.open.length ? (
                <ul className="mt-3 flex flex-wrap gap-1">
                  {s.open.slice(0, 4).map((o) => (
                    <li key={o}>
                      <span className="chip chip-fail">{o}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="mt-3 flex flex-wrap gap-1.5">
                <button
                  type="button"
                  className="chip touch-chip hover:border-oxblood/50"
                  onClick={() => onRun(s.def.id)}
                  disabled={Boolean(running)}
                >
                  {s.state === "idle" ? "Run" : "Re-run"}
                </button>
                <button
                  type="button"
                  className="chip touch-chip hover:border-oxblood/50"
                  onClick={() => onOpen(s.def.mode)}
                >
                  Open stage
                </button>
              </div>
            </li>
          );
        })}
      </ol>

      {openLog && log.length ? (
        <div className="border-t border-rule px-4 py-3 sm:px-5">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
            <p className="eyebrow">Run log · newest first</p>
            <button
              type="button"
              className="chip touch-chip hover:border-oxblood/50"
              onClick={onReset}
            >
              Clear log
            </button>
          </div>
          <ul className="mt-2.5 space-y-1" aria-live="polite">
            {log.slice(0, 12).map((l, i) => (
              <li
                key={`${l.at}-${i}`}
                className="num text-[0.625rem] leading-relaxed tracking-[0.12em] text-ink-soft"
              >
                {new Date(l.at).toLocaleTimeString()} · {l.text.toUpperCase()}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
