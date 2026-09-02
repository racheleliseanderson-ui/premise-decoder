import { CLASS_REFERENCE, GLOSSARY, VERIFICATION_DESKS } from "@/lib/reference";
import type { Assessment, ServiceClass } from "@/lib/engine";
import { CREDENTIALS } from "@/lib/terms";
import type { Mode } from "@/lib/modes";
import { SectionHead } from "./ui";

/**
 * Reference library — the static half of the desk. Class-by-class identity
 * requirements, a language glossary, and where each answer is verified.
 */
export function ReferenceLibrary({
  a,
  openClass,
  onOpenClass,
  onGo,
}: {
  a: Assessment;
  openClass: ServiceClass;
  onOpenClass: (c: ServiceClass) => void;
  /** Same navigation mechanism the other panels use — the desk owns the route. */
  onGo: (mode: Mode) => void;
}) {
  const deskEmpty = a.posture.key === "empty";
  const open =
    openClass && openClass !== "unselected"
      ? openClass
      : a.input.serviceClass !== "unselected"
        ? a.input.serviceClass
        : CLASS_REFERENCE[0]!.id;
  const active = CLASS_REFERENCE.find((c) => c.id === open) ?? CLASS_REFERENCE[0]!;

  return (
    <div className="space-y-14">
      <div>
        <SectionHead eyebrow="Reference library" title="What each class has to name" />
        <p className="lede mt-4 max-w-2xl">
          The desk reads what you enter. This is the standard it reads against — class by class, in
          plain language, with the way to check each answer attached.
        </p>

        <div className="mt-9 grid gap-px border border-rule lg:grid-cols-[16rem_1fr]">
          <div className="flex flex-wrap lg:flex-col">
            {CLASS_REFERENCE.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => onOpenClass(c.id)}
                className={`flex-1 border-b border-r border-rule px-5 py-4 text-left transition-colors lg:flex-none ${
                  c.id === active.id
                    ? "bg-oxblood-deep text-parchment"
                    : "bg-parchment/60 hover:bg-oxblood-tint/25"
                }`}
              >
                <p
                  className={`font-mono text-[0.625rem] uppercase tracking-[0.15em] ${
                    c.id === active.id ? "text-bronze-lift" : "text-ink-soft"
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
                  <p className="label-mono">Phrases that name nothing</p>
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
        <SectionHead eyebrow="Credentials, expanded" title="A title is marketing" />
        <p className="lede mt-4 max-w-2xl">
          A license is checkable against the state board. These are the abbreviations the desk
          treats as credentials — not compliments.
        </p>
        <ul className="mt-8 grid gap-px border border-rule sm:grid-cols-2 lg:grid-cols-3">
          {CREDENTIALS.map((c) => (
            <li key={c.abbr} className="border-b border-r border-rule bg-parchment/60 px-5 py-4">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-oxblood">
                {c.abbr}
              </p>
              <p className="mt-1.5 font-display text-xl leading-tight text-ink">{c.expand}</p>
            </li>
          ))}
        </ul>
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
              <p className="num text-xs text-bronze-ink">{String(i + 1).padStart(2, "0")}</p>
              <p className="mt-3 font-display text-xl leading-tight text-ink">{d.label}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">{d.what}</p>
              <p className="mt-4 border-t border-rule pt-4 text-sm leading-relaxed text-ink">
                {d.how}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* The library is where the first-visit pointer sends people, and it used
          to end here — four screens of standard and no way back to the room. */}
      <div className="border border-rule bg-parchment/60 p-6 md:p-8">
        <p className="eyebrow">Back to the desk</p>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink">
          {deskEmpty
            ? "Reading the standard is not checking a room. Nothing is on the desk yet — the menu line, the setting, the person and the product are enough to start."
            : `Reading the standard is not checking a room. On the venue in front of you, ${a.failClosed.length} of ${a.signals.length} signals are still unnamed.`}
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => onGo(deskEmpty ? "fast" : "full")}
          >
            {deskEmpty ? "Start the four questions" : "Check this venue"}
          </button>
          <button type="button" className="btn-quiet" onClick={() => onGo("prep")}>
            Take the questions into the room
          </button>
        </div>
      </div>
    </div>
  );
}
