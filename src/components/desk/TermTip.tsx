import { useId, useState, type ReactNode } from "react";
import { TERMS, type TermId } from "@/lib/terms";

/**
 * Desk jargon, defined at the point of use. A tap or click opens the meaning;
 * a hover title covers pointer users. Nothing here is clinical advice.
 */
export function TermTip({
  id,
  children,
  tone = "ink",
}: {
  id: TermId;
  children?: ReactNode;
  tone?: "ink" | "parchment";
}) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const t = TERMS[id];
  const link =
    tone === "parchment"
      ? "text-parchment underline decoration-dotted decoration-parchment/50 underline-offset-2"
      : "text-ink underline decoration-dotted decoration-oxblood/50 underline-offset-2";

  return (
    <span className="relative inline">
      <button
        type="button"
        className={`term-tip ${link}`}
        aria-expanded={open}
        aria-controls={panelId}
        title={t.meaning}
        onClick={() => setOpen((v) => !v)}
      >
        {children ?? t.word}
      </button>
      {open ? (
        <span
          id={panelId}
          role="note"
          className="term-tip-panel absolute left-0 top-full z-20 mt-1.5 w-[min(18rem,70vw)] border border-rule bg-parchment px-3 py-2 text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-ink shadow-sm"
        >
          <span className="block font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-oxblood">
            {t.word}
          </span>
          <span className="mt-1 block">{t.meaning}</span>
        </span>
      ) : null}
    </span>
  );
}
