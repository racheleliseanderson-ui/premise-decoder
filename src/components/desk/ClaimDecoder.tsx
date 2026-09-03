import type { DecodedClaim } from "@/lib/engine";
import { REGISTER_METHOD, REGISTER_SOURCE, type RegisterHit } from "@/lib/register";

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

/**
 * Where the pasted copy makes a claim the publication has already adjudicated.
 *
 * This is the one thing this desk can say that nothing else can, so it is not
 * a footnote: it sits above the pattern ledger, because "somebody checked this
 * and here is what they found" outranks "this sentence has the shape of a
 * marketing claim".
 *
 * Renders nothing when nothing matched, which is most of the time. An empty
 * state here would be a paragraph explaining that no verdict exists, and a
 * reader who is mid-decision does not need that told to them.
 */
export function RegisterNotes({ hits }: { hits: RegisterHit[] }) {
  if (hits.length === 0) return null;
  return (
    <section className="border border-rule bg-parchment/70">
      <div className="border-b border-rule px-5 py-4">
        <p className="eyebrow">
          On the Register — {hits.length} {hits.length === 1 ? "claim" : "claims"} already examined
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          These are not this desk&rsquo;s opinion of the copy. They are published records of what
          the evidence for that claim actually looked like on the date somebody last went and
          checked.
        </p>
      </div>
      <ul className="divide-y divide-rule">
        {hits.map((hit) => (
          <li key={hit.entry.slug} className="grid gap-5 p-5 md:grid-cols-[1.1fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="chip chip-partial">{hit.entry.position}</span>
                {hit.entry.absence ? <span className="eyebrow">{hit.entry.absence}</span> : null}
              </div>
              <p className="mt-3 font-display text-xl italic leading-snug text-ink">
                &ldquo;{hit.matched}&rdquo;
              </p>
            </div>
            <div className="border-l-0 border-rule md:border-l md:pl-5">
              <p className="eyebrow">The published verdict</p>
              <p className="mt-2 text-sm leading-relaxed text-ink">{hit.entry.verdict}</p>
              <p className="mt-3 text-xs text-ink-soft">
                Last searched {hit.entry.lastSearched}.{" "}
                <a className="underline" href={hit.entry.url} rel="noopener" target="_blank">
                  Read the entry
                </a>
                .
              </p>
            </div>
          </li>
        ))}
      </ul>
      <div className="border-t border-rule px-5 py-4 text-xs text-ink-soft">
        <a className="underline" href={REGISTER_SOURCE} rel="noopener" target="_blank">
          The Register
        </a>{" "}
        &middot;{" "}
        <a className="underline" href={REGISTER_METHOD} rel="noopener" target="_blank">
          what the positions mean
        </a>
        . A position is a statement about published evidence, not about this venue.
      </div>
    </section>
  );
}
