import { useEffect, useId, useMemo, useRef, useState } from "react";
import { NO_ANSWER, isNoAnswer } from "@/lib/engine";
import { ORIGIN_LABELS, type Evidence, type Origin } from "@/lib/session";
import { searchProducts, searchServices } from "@/lib/catalog";

/**
 * A single editable setting field with its provenance attached.
 *
 * Every value can be typed over, chosen from the catalog, or marked as asked
 * and unanswered. Where a value came from is shown, not hidden: a value read
 * out of pasted text says so and quotes the sentence, and typing over it is
 * recorded as an override rather than silently replacing the evidence.
 */
export function FieldEditor({
  label,
  value,
  onChange,
  evidence,
  placeholder,
  hint,
  note,
  area,
  rows = 4,
  catalog,
  id,
}: {
  label: string;
  value: string;
  onChange: (v: string, origin: Origin) => void;
  evidence?: Evidence | undefined;
  placeholder?: string;
  hint?: string;
  note?: string | undefined;
  area?: boolean;
  rows?: number;
  catalog?: "service" | "product";
  id?: string;
}) {
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState("");
  const refused = isNoAnswer(value);
  const pickerId = useId();
  const pickBtnRef = useRef<HTMLButtonElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Escape and an outside click both close the catalog, the same contract the
  // house menu keeps. Before this the picker opened, took focus into a search
  // box, and the only way out was to find the Close chip again.
  useEffect(() => {
    if (!picking) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPicking(false);
      pickBtnRef.current?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const node = e.target as Node | null;
      if (!node) return;
      if (pickerRef.current?.contains(node) || pickBtnRef.current?.contains(node)) return;
      setPicking(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [picking]);

  const hits = useMemo(() => {
    if (!catalog) return [];
    return catalog === "service"
      ? searchServices(q, 10).map((s) => ({
          id: s.id,
          name: s.name,
          meta: s.group,
          silent: s.silent,
        }))
      : searchProducts(q, 10).map((p) => ({
          id: p.id,
          name: p.name,
          meta: p.category,
          silent: p.silent,
        }));
  }, [catalog, q]);

  return (
    <div className="group/field">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3">
        <label className="min-w-0" htmlFor={id}>
          {/* Wraps rather than truncates: a clipped field label ("EXACT PRODUCT /
              DE…") tells the reader nothing about what to type. */}
          <span className="label-mono text-balance">{label}</span>
        </label>
        <div className="flex shrink-0 items-center gap-1.5 pb-1.5">
          {catalog ? (
            <button
              ref={pickBtnRef}
              type="button"
              className="chip touch-chip hover:border-oxblood/50"
              aria-expanded={picking}
              aria-controls={pickerId}
              onClick={() => setPicking((p) => !p)}
            >
              {picking ? "Close" : "Known names"}
              <span className="sr-only"> · {label}</span>
            </button>
          ) : null}
          <button
            type="button"
            className={
              refused ? "chip chip-fail touch-chip" : "chip touch-chip hover:border-oxblood/50"
            }
            aria-pressed={refused}
            title="Record that you asked and were not given an answer"
            onClick={() => onChange(refused ? "" : NO_ANSWER, refused ? "typed" : "no-answer")}
          >
            {refused ? "Asked · unanswered" : "Asked, no answer"}
          </button>
        </div>
      </div>

      {refused ? (
        <p className="border border-oxblood/40 bg-oxblood-tint/40 px-3 py-2.5 text-sm leading-relaxed text-ink">
          Asked, and no answer was given. Held open on the record — this scores lower than an
          omission, not higher.
        </p>
      ) : area ? (
        <textarea
          id={id}
          className="field resize-y font-sans leading-relaxed"
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value, "typed")}
        />
      ) : (
        <input
          id={id}
          className="field"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value, "typed")}
        />
      )}

      {picking && !refused ? (
        <div
          id={pickerId}
          ref={pickerRef}
          role="group"
          aria-label={catalog === "service" ? "Known service names" : "Known product names"}
          className="rise mt-2 border border-rule bg-bone/70 p-3"
        >
          <input
            className="field py-2 text-sm"
            value={q}
            autoFocus
            aria-label={
              catalog === "service"
                ? "Search known service names"
                : "Search known products and platforms"
            }
            placeholder={
              catalog === "service"
                ? "Search services — tox, laser, peel, IV…"
                : "Search products and platforms — Juvéderm, Sciton…"
            }
            onChange={(e) => setQ(e.target.value)}
          />
          <ul className="mt-2 max-h-64 space-y-px overflow-y-auto border border-rule">
            {hits.map((h) => (
              <li key={h.id} className="border-b border-rule bg-parchment/60 last:border-b-0">
                <button
                  type="button"
                  className="w-full px-3 py-2.5 text-left hover:bg-oxblood-tint/25"
                  onClick={() => {
                    onChange(h.name, "catalog");
                    setPicking(false);
                    setQ("");
                  }}
                >
                  <span className="block font-display text-lg leading-tight text-ink">
                    {h.name}
                  </span>
                  <span className="eyebrow mt-1 block">{h.meta}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-soft">
                    Silent on: {h.silent}
                  </span>
                </button>
              </li>
            ))}
            {hits.length === 0 ? (
              <li className="bg-parchment/60 px-3 py-3 text-xs italic text-ink-soft">
                Nothing in the known names matches that. Type it exactly as written on the menu
                instead.
              </li>
            ) : null}
          </ul>
        </div>
      ) : null}

      {evidence ? <ProvenanceLine e={evidence} /> : null}
      {note ? <p className="mt-1.5 text-xs leading-relaxed text-ink">{note}</p> : null}
      {hint ? <p className="mt-1.5 text-xs italic leading-relaxed text-ink-soft">{hint}</p> : null}
    </div>
  );
}

export function ProvenanceLine({ e, compact }: { e: Evidence; compact?: boolean }) {
  const tone =
    e.origin === "extracted"
      ? "chip chip-partial"
      : e.origin === "no-answer"
        ? "chip chip-fail"
        : e.origin === "catalog"
          ? "chip chip-known"
          : "chip";
  return (
    <div className={compact ? "" : "mt-2"}>
      <div className="flex flex-wrap items-center gap-2">
        <span className={tone}>{ORIGIN_LABELS[e.origin]}</span>
        {e.source ? <span className="eyebrow truncate">{e.source}</span> : null}
      </div>
      {e.quote ? (
        <blockquote className="mt-1.5 border-l-2 border-bronze pl-3 text-xs italic leading-relaxed text-ink-soft">
          “{e.quote}”
        </blockquote>
      ) : null}
    </div>
  );
}
