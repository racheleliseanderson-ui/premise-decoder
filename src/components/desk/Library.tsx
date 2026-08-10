import { useState } from "react";
import { CLASS_REFERENCE, GLOSSARY, VERIFICATION_DESKS } from "@/lib/reference";
import type { Assessment, ServiceClass } from "@/lib/engine";
import { SectionHead } from "./ui";

/**
 * Reference library — the static half of the desk. Class-by-class identity
 * requirements, a language glossary, and where each answer is verified.
 */
export function ReferenceLibrary({ a }: { a: Assessment }) {
  const [open, setOpen] = useState<ServiceClass>(a.input.serviceClass);
  const active = CLASS_REFERENCE.find((c) => c.id === open) ?? CLASS_REFERENCE[0]!;

  return (
    <div className="space-y-14">
      <div>
        <SectionHead
          eyebrow="Reference library"
          title="What each class has to name"
        />
        <p className="lede mt-4 max-w-2xl">
          The desk scores your inputs. This is the standard those inputs are scored against — per class,
          in plain language, with the verification path attached.
        </p>

        <div className="mt-9 grid gap-px border border-rule lg:grid-cols-[16rem_1fr]">
          <div className="flex flex-wrap lg:flex-col">
            {CLASS_REFERENCE.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setOpen(c.id)}
                className={`flex-1 border-b border-r border-rule px-5 py-4 text-left transition-colors lg:flex-none ${
                  c.id === active.id
                    ? "bg-oxblood-deep text-parchment"
                    : "bg-parchment/60 hover:bg-oxblood-tint/25"
                }`}
              >
                <p
                  className={`font-mono text-[0.625rem] uppercase tracking-[0.15em] ${
                    c.id === active.id ? "text-bronze" : "text-ink-soft"
                  }`}
                >
                  {c.burdenBand} burden
                </p>

                <p
                  className={`mt-1.5 font-display text-lg leading-tight ${
                    c.id === active.id ? "text-parchment" : "text-ink"
                  }`}
                >
                  {c.name}
                </p>
              </button>
            ))}
          </div>

          <div className="border-b border-r border-rule bg-bone/50 p-6 md:p-9">
            <p className="eyebrow">{active.name}</p>
            <p className="mt-4 font-display text-2xl leading-snug text-ink md:text-3xl">
              {active.whatItIs}
            </p>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <p className="label-mono">Must be named before booking</p>
                <ul className="space-y-2.5 text-sm leading-relaxed text-ink-soft">
                  {active.mustBeNamed.map((m) => (
                    <li key={m} className="flex gap-3">
                      <span aria-hidden="true" className="num text-bronze">
                        ·
                      </span>
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-6">
                <div>
                  <p className="label-mono">Phrases treated as unresolved</p>
                  <div className="flex flex-wrap gap-1.5">
                    {active.tierPhrases.map((p) => (
                      <span key={p} className="chip chip-fail">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="label-mono">Verification path</p>
                  <p className="text-sm leading-relaxed text-ink-soft">{active.verifyPath}</p>
                </div>
                <div>
                  <p className="label-mono">Jurisdiction variance</p>
                  <p className="text-sm leading-relaxed text-ink-soft">{active.variance}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div>
        <SectionHead eyebrow="Language glossary" title="Phrase in, question out" />
        <div className="mt-8 divide-y divide-rule border-y border-rule">
          {GLOSSARY.map((g) => (
            <div key={g.phrase} className="grid gap-4 py-6 md:grid-cols-[13rem_1fr_1fr]">
              <p className="font-display text-xl leading-tight text-oxblood">{g.phrase}</p>
              <div>
                <p className="label-mono">Reads as / hides</p>
                <p className="text-sm leading-relaxed text-ink-soft">
                  {g.reads} <span className="text-ink">{g.hides}</span>
                </p>
              </div>
              <div>
                <p className="label-mono">Say this instead</p>
                <p className="text-sm leading-relaxed text-ink">{g.replaceWith}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <SectionHead eyebrow="Verification map" title="Where each answer gets checked" />
        <div className="mt-8 grid gap-px border border-rule md:grid-cols-2 xl:grid-cols-3">
          {VERIFICATION_DESKS.map((d, i) => (
            <div key={d.label} className="border-b border-r border-rule bg-parchment/60 p-6">
              <p className="num text-xs text-bronze">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-3 font-display text-xl leading-tight text-ink">{d.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{d.what}</p>
              <p className="mt-4 border-t border-rule pt-4 text-sm leading-relaxed text-ink">{d.how}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
