import { useCallback, useEffect, useState } from "react";

import { NEVER_CARRIED } from "@/lib/vanity-context.ts";
import {
  carryRows,
  carrySummary,
  clearCarry,
  emptyCarry,
  forgetCarryField,
  loadCarry,
  saveCarry,
  type CarriedContext,
  type CarryKey,
} from "@/lib/vanity-carry.ts";

/**
 * What travels with you.
 *
 * The three desks can be connected without being creepy, and this panel is
 * where that claim is either true or it is not. Everything the fleet holds
 * about this session is listed in words, attributed to the desk that said it,
 * dated, and removable one line at a time. Below it, in the same type, is what
 * never travels at all — the more useful half, because a reader's question is
 * rarely "what do you have" and almost always "what else do you have".
 *
 * It belongs on this panel in particular. This is the desk that asks a person
 * to write down what a clinic told them; it owes them the same accounting in
 * the other direction.
 */
export function CarryPanel() {
  const [carry, setCarry] = useState<CarriedContext>(() => emptyCarry());
  const [now, setNow] = useState(0);

  useEffect(() => {
    setCarry(loadCarry());
    setNow(Date.now());
  }, []);

  const forget = useCallback((key: CarryKey) => {
    setCarry((current) => {
      const next = forgetCarryField(current, key);
      saveCarry(next);
      return next;
    });
  }, []);

  const rows = now ? carryRows(carry, now) : [];

  return (
    <section className="border border-rule bg-parchment" aria-labelledby="carry-heading">
      <div className="border-b border-rule px-5 py-5 md:px-6">
        <p className="eyebrow">The Vanity context</p>
        <h3 id="carry-heading" className="mt-2 font-display text-2xl leading-snug text-ink">
          What travels with you
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">
          {now ? carrySummary(carry, now) : "Reading what this browser holds…"}
        </p>
      </div>

      {rows.length ? (
        <ul>
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-rule px-5 py-4 md:px-6"
            >
              <div className="min-w-0">
                <p className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-ink-soft">
                  {row.label}
                </p>
                <p className="mt-1 text-base leading-snug text-ink">{row.value}</p>
                <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                  {row.fromLabel} · {row.ageLabel}
                  {row.stale ? (
                    <span className="text-oxblood">
                      {" "}
                      · old enough that a desk should ask again rather than assume
                    </span>
                  ) : null}
                </p>
              </div>
              <button
                type="button"
                onClick={() => forget(row.key)}
                className="inline-flex min-h-11 shrink-0 items-center font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-soft underline decoration-dotted underline-offset-4 hover:text-ink"
              >
                Forget this
                <span className="sr-only"> — {row.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="border-b border-rule px-5 py-6 text-sm leading-relaxed text-ink-soft md:px-6">
          Nothing has crossed into this browser yet. Name a service class here, or arrive from
          another desk, and this fills itself.
        </p>
      )}

      <div className="px-5 py-5 md:px-6">
        <p className="eyebrow">What never travels</p>
        <ul className="mt-3 space-y-2">
          {NEVER_CARRIED.map((line) => (
            <li key={line} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <span aria-hidden="true" className="num text-bronze">
                ·
              </span>
              {line}
            </li>
          ))}
        </ul>
        {rows.length ? (
          <button
            type="button"
            className="btn-quiet mt-6"
            onClick={() => {
              clearCarry();
              setCarry(emptyCarry());
            }}
          >
            Forget all of it
          </button>
        ) : null}
      </div>
    </section>
  );
}
