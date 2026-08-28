import { useId, useState, type ReactNode } from "react";
import type { SignalState } from "@/lib/engine";

export function StateChip({
  state,
  refused,
  tone = "ink",
}: {
  state: SignalState;
  refused?: boolean | undefined;
  tone?: "ink" | "parchment";
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  if (refused) {
    const tip = "You asked and were not given an answer. Held open on the record — not inferred.";
    return (
      <span className="relative inline-flex">
        <button
          type="button"
          className="chip chip-fail"
          aria-expanded={open}
          aria-controls={panelId}
          title={tip}
          onClick={() => setOpen((v) => !v)}
        >
          <span aria-hidden="true" className="text-[0.7em]">
            ◇
          </span>
          Asked · unanswered
        </button>
        {open ? <ChipNote id={panelId}>{tip}</ChipNote> : null}
      </span>
    );
  }
  const cls =
    state === "known"
      ? "chip chip-known"
      : state === "partial"
        ? "chip chip-partial"
        : "chip chip-fail";
  const label = state === "known" ? "Known" : state === "partial" ? "Partial" : "Unnamed";
  const tip =
    state === "known"
      ? "Named and checkable from what is on the desk."
      : state === "partial"
        ? "Partly named — enough to talk about, not enough to close."
        : "Left open when identity is unnamed or vague — never filled in by assumption.";
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        className={cls}
        aria-expanded={open}
        aria-controls={panelId}
        title={tip}
        onClick={() => setOpen((v) => !v)}
      >
        <span aria-hidden="true" className="text-[0.7em]">
          {state === "known" ? "●" : state === "partial" ? "◐" : "○"}
        </span>
        {label}
      </button>
      {open ? <ChipNote id={panelId}>{tip}</ChipNote> : null}
    </span>
  );
}

function ChipNote({ id, children }: { id: string; children: ReactNode }) {
  return (
    <span
      id={id}
      role="note"
      className="absolute right-0 top-full z-20 mt-1.5 w-[min(16rem,70vw)] border border-rule bg-parchment px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-ink shadow-sm"
    >
      {children}
    </span>
  );
}

export function Meter({
  value,
  tone = "ink",
  label,
}: {
  value: number;
  tone?: "ink" | "oxblood" | "bronze" | "pine";
  label?: string;
}) {
  const fill =
    tone === "oxblood"
      ? "bg-oxblood"
      : tone === "bronze"
        ? "bg-bronze"
        : tone === "pine"
          ? "bg-pine"
          : "bg-ink";
  return (
    <div>
      <div className="h-[3px] w-full bg-rule/80">
        <div
          className={`meter-fill h-full ${fill}`}
          style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
        />
      </div>
      {label ? <p className="eyebrow mt-2">{label}</p> : null}
    </div>
  );
}

export function SectionHead({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="max-w-2xl">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="display-lg mt-3 text-ink">{title}</h2>
      {children ? <p className="lede mt-4">{children}</p> : null}
    </div>
  );
}

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  area,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  area?: boolean;
  rows?: number;
}) {
  return (
    <label className="block">
      <span className="label-mono">{label}</span>
      {area ? (
        <textarea
          className="field resize-y font-sans leading-relaxed"
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          className="field"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {hint ? (
        <span className="mt-1.5 block text-xs italic text-muted-foreground">{hint}</span>
      ) : null}
    </label>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
}) {
  return (
    <label className="block">
      <span className="label-mono">{label}</span>
      <select className="field" value={value} onChange={(e) => onChange(e.target.value as T)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
