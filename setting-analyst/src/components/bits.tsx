import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { SignalState } from "@/lib/engine/types";

export function Chip({ state, children }: { state: SignalState | "info"; children?: ReactNode }) {
  const cls =
    state === "known"
      ? "chip chip-known"
      : state === "partial"
        ? "chip chip-partial"
        : state === "declined" || state === "fail-closed"
          ? "chip chip-closed"
          : "chip";
  const label =
    state === "known"
      ? "Known"
      : state === "partial"
        ? "Partial"
        : state === "declined"
          ? "Declined"
          : state === "fail-closed"
            ? "Unnamed"
            : "Note";
  return (
    <span className={cls}>
      {label}
      {children ? <span className="normal-case tracking-normal"> · {children}</span> : null}
    </span>
  );
}

export function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="eyebrow">{label}</p>
        <p className="font-mono text-sm tabular-nums text-ink">{Math.round(value)}</p>
      </div>
      <div className="meter" aria-hidden="true">
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1.5 text-xs leading-relaxed text-(--ink-soft)">{hint}</p> : null}
    </div>
  );
}

export function Why({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group border-t border-(--rule) pt-3">
      <summary className="cursor-pointer font-mono text-[0.625rem] uppercase tracking-[0.14em] text-(--oxblood)">
        {title}
      </summary>
      <div className="mt-2 text-sm leading-relaxed text-(--ink-soft)">{children}</div>
    </details>
  );
}

export function EmptyDesk({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="panel p-6 md:p-8">
      <p className="eyebrow">Nothing on the desk</p>
      <h2 className="display-lg mt-3">{title}</h2>
      <p className="mt-4 max-w-xl text-sm leading-relaxed text-(--ink-soft)">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Term({ word, meaning }: { word: string; meaning: string }) {
  return (
    <abbr title={meaning} className="cursor-help decoration-dotted underline decoration-(--oxblood)/50 underline-offset-2">
      {word}
    </abbr>
  );
}

export function SectionHead({ kicker, title, lede }: { kicker: string; title: string; lede?: string }) {
  return (
    <header className="mb-6">
      <p className="eyebrow">{kicker}</p>
      <h2 className="display-lg mt-2">{title}</h2>
      {lede ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--ink-soft)">{lede}</p> : null}
    </header>
  );
}

export function cnField(...i: Parameters<typeof cn>) {
  return cn(...i);
}
