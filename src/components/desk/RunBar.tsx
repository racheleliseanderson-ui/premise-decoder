import { STAGE_TONE, STAGE_WORD, type StageStatus, type StageId } from "@/lib/pipeline";

/**
 * Pipeline run controls. The reader triggers each stage explicitly and watches
 * it report. Running a stage never invents a value — it re-reads what is on the
 * desk and states what it found, including that it found nothing.
 */
export function RunBar({
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
  const blocked = stages.filter((s) => s.state === "blocked").length;

  return (
    <section className="no-print border border-rule bg-bone/60" aria-label={title}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-rule px-4 py-3">
        <div className="min-w-0">
          <p className="eyebrow">{title}</p>
          <p className="mt-1 truncate text-sm text-ink">
            {blocked
              ? `${blocked} stage${blocked > 1 ? "s" : ""} blocked by an unanswered question.`
              : "Six stages. Run them in order, or one at a time."}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            className="chip touch-chip hover:border-oxblood/50"
            onClick={onRunAll}
            disabled={Boolean(running)}
          >
            {running ? "Running…" : runAllLabel}
          </button>
          {log.length ? (
            <button
              type="button"
              className="chip touch-chip hover:border-oxblood/50"
              onClick={onReset}
            >
              Clear log
            </button>
          ) : null}
        </div>
      </div>

      <ol className="flex snap-x overflow-x-auto">
        {stages.map((s) => (
          <li
            key={s.def.id}
            className={`min-w-[12.5rem] shrink-0 snap-start border-r border-rule p-4 last:border-r-0 ${
              running === s.def.id ? "bg-bronze-soft/40" : "bg-transparent"
            }`}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
              <span className="num text-xs text-oxblood">
                {String(s.def.index + 1).padStart(2, "0")}
              </span>
              <span className={STAGE_TONE[s.state]}>{STAGE_WORD[s.state]}</span>
            </div>
            <p className="mt-2 font-display text-xl leading-tight text-ink">{s.def.name}</p>
            <p className="mt-1 text-xs leading-relaxed text-ink-soft">{s.def.what}</p>
            <p className="mt-2 text-xs leading-relaxed text-ink" aria-live="polite">
              {s.line}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <button
                type="button"
                className="chip touch-chip hover:border-oxblood/50"
                onClick={() => onRun(s.def.id)}
                disabled={Boolean(running)}
              >
                Run
              </button>
              <button
                type="button"
                className="chip touch-chip hover:border-oxblood/50"
                onClick={() => onOpen(s.def.mode)}
              >
                Open
              </button>
            </div>
          </li>
        ))}
      </ol>

      {log.length ? (
        <div className="border-t border-rule px-4 py-3">
          <p className="eyebrow">Run log</p>
          <ul className="mt-2 space-y-1" aria-live="polite">
            {log.slice(0, 6).map((l, i) => (
              <li
                key={`${l.at}-${i}`}
                className="num text-[0.625rem] tracking-[0.12em] text-ink-soft"
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
