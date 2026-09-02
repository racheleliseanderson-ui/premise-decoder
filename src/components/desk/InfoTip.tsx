import { useEffect, useId, useRef, useState, type ReactNode } from "react";

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
  const btnRef = useRef<HTMLButtonElement>(null);

  // Escape closes it and hands focus back, the same contract as the house menu.
  // Without this the only way out of an opened definition is to find the button
  // again, which on a page of twenty definitions is not an exit.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      btnRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const btn =
    tone === "parchment"
      ? "border-bronze/40 text-bronze-soft hover:border-bronze"
      : "border-rule text-oxblood hover:border-oxblood";
  const note = tone === "parchment" ? "text-parchment/70" : "text-ink-soft";
  return (
    <span className={`inline-flex max-w-full flex-wrap items-center gap-1.5 ${className}`}>
      {label ? <span>{label}</span> : null}
      <button
        ref={btnRef}
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
        <span
          id={id}
          role="note"
          className={`basis-full text-xs font-normal normal-case leading-relaxed tracking-normal ${note}`}
        >
          {children}
        </span>
      ) : null}
    </span>
  );
}
