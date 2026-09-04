import type { DecodedClaim } from "@/lib/engine";

export function ClaimLedger({ claims }: { claims: DecodedClaim[] }) {
  if (claims.length === 0) {
    return (
      <p className="text-sm italic text-ink-soft">
        No marketing patterns caught in this text. Absence of flags is not endorsement — it only
        means this sentence is not the problem.
      </p>
    );
  }
  return (
    <ul className="space-y-px border border-rule">
      {claims.map((c, i) => (
        <li
          key={`${c.category}-${i}`}
          className="border-b border-rule bg-parchment/70 last:border-b-0"
        >
          <div className="grid gap-5 p-5 md:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={
                    c.severity === "hard"
                      ? "chip chip-fail"
                      : c.severity === "flag"
                        ? "chip chip-partial"
                        : "chip"
                  }
                >
                  {c.severity === "hard" ? "Hard flag" : c.severity === "flag" ? "Flag" : "Note"}
                </span>
                <span className="eyebrow">{c.category}</span>
              </div>
              <p className="mt-3 font-display text-xl italic leading-snug text-ink">“{c.phrase}”</p>
            </div>
            <div className="border-l-0 border-rule md:border-l md:pl-5">
              <p className="eyebrow">What it hides</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.hides}</p>
              <p className="eyebrow mt-4">Ask instead</p>
              <p className="mt-2 text-sm leading-relaxed text-ink">“{c.ask}”</p>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
