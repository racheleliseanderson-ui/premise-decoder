import { useId, useState, type ReactNode } from "react";

/** Tappable definition — `title` tooltips do not fire on touch. */
export function InfoTip({
  label,
  children,
  tone = "ink",
  className = "",
}: {
  label?: ReactNode;
  children: ReactNode;
  tone?: "ink" | "parchment";
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const btn =
    tone === "parchment"
      ? "border-bronze/40 text-bronze-soft hover:border-bronze"
      : "border-rule text-oxblood hover:border-oxblood";
  const note = tone === "parchment" ? "text-parchment/70" : "text-ink-soft";
  return (
    <span className={`inline-flex max-w-full flex-wrap items-center gap-1.5 ${className}`}>
      {label ? <span>{label}</span> : null}
      <button
        type="button"
        className={`inline-flex size-11 shrink-0 items-center justify-center border font-mono text-[11px] leading-none ${btn}`}
        aria-expanded={open}
        aria-controls={id}
        aria-label={open ? "Hide definition" : "Show definition"}
        onClick={() => setOpen((v) => !v)}
      >
        i
      </button>
      {open ? (
        <span id={id} role="note" className={`basis-full text-xs leading-relaxed ${note}`}>
          {children}
        </span>
      ) : null}
    </span>
  );
}
