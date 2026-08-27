import { Chip, Meter, Why } from "@/components/bits";
import type { Evaluation } from "@/lib/engine/types";
import { EDITORIAL } from "@/lib/data/editorial";

export function ResultCard({ evaluation, compact = false }: { evaluation: Evaluation; compact?: boolean }) {
  const { posture, place, promise, gap, burden, nextSteps, weakest, identityLine, costHorizon } = evaluation;
  return (
    <article className="panel overflow-hidden" aria-labelledby="result-answer">
      <div className="border-b border-(--rule) bg-(--bone) px-5 py-4 md:px-6">
        <p className="eyebrow">
          {posture.key === "empty" ? "Awaiting" : posture.key === "resolved" ? "Decision" : "Decision"}
        </p>
        <h2 id="result-answer" className="mt-2 font-display text-3xl leading-[1.05] tracking-[-0.03em] md:text-4xl">
          {posture.label}
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-(--ink-soft)">{posture.line}</p>
      </div>

      <div className="grid gap-px bg-(--rule) md:grid-cols-3">
        <div className="bg-(--parchment) p-5">
          <p className="eyebrow">The answer</p>
          <p className="mt-2 text-sm leading-relaxed">{identityLine}</p>
        </div>
        <div className="bg-(--parchment) p-5">
          <p className="eyebrow">The caveat</p>
          <p className="mt-2 text-sm leading-relaxed">
            {weakest
              ? `${weakest.label}: ${weakest.reading}`
              : "No single field is carrying the uncertainty. Verification remains."}
          </p>
        </div>
        <div className="bg-(--parchment) p-5">
          <p className="eyebrow">The next action</p>
          <p className="mt-2 text-sm leading-relaxed">{posture.next}</p>
        </div>
      </div>

      <div className="grid gap-6 p-5 md:grid-cols-3 md:p-6">
        <Meter value={place} label="Place · how much is named" />
        <Meter value={promise} label="Promise · marketing pressure" />
        <Meter value={Math.max(0, gap)} label="Gap · promise minus place" />
      </div>

      <div className="flex flex-wrap items-center gap-2 px-5 pb-4 md:px-6">
        <Chip state={posture.key === "resolved" ? "known" : posture.key === "empty" ? "info" : "fail-closed"}>
          {burden.band} burden
        </Chip>
        <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-(--ink-soft)">
          {evaluation.failClosed.length} fail-closed · {evaluation.known.length} known · {evaluation.claims.length} claims
        </span>
      </div>

      {!compact ? (
        <div className="space-y-4 border-t border-(--rule) px-5 py-5 md:px-6">
          <div>
            <p className="eyebrow">Why this reading</p>
            <ul className="mt-3 space-y-2">
              {nextSteps.slice(0, 4).map((step) => (
                <li key={step} className="flex gap-2.5 text-sm leading-relaxed">
                  <span className="num shrink-0 text-(--oxblood)">·</span>
                  {step}
                </li>
              ))}
            </ul>
          </div>
          <p className="text-sm leading-relaxed text-(--ink-soft)">
            {costHorizon.stated}
            {costHorizon.annualHint ? ` ${costHorizon.annualHint}` : ""}{" "}
            <span>{costHorizon.reading}</span>
          </p>
          <Why title="Why Place, Promise, and Gap — not a ranking">
            <p>
              Place is how much of the setting is actually named and checkable. Promise is how much marketing pressure is in the
              text as written. Gap is Promise minus Place. None of these is a quality score, a safety score, or a
              recommendation.{" "}
              <a className="underline decoration-(--oxblood)/40 underline-offset-2" href={EDITORIAL.spa} target="_blank" rel="noopener">
                Method on Vanity or Vice
              </a>
              .
            </p>
          </Why>
        </div>
      ) : null}
    </article>
  );
}

export function MiniResult({ evaluation, kicker }: { evaluation: Evaluation; kicker: string }) {
  return (
    <article className="panel h-full p-5">
      <p className="eyebrow">{kicker}</p>
      <h3 className="mt-2 font-display text-2xl leading-tight">{evaluation.posture.label}</h3>
      <p className="mt-2 text-sm leading-relaxed text-(--ink-soft)">{evaluation.identityLine}</p>
      <div className="mt-4">
        <Meter value={evaluation.place} label="Place" />
      </div>
      <p className="mt-4 text-sm leading-relaxed">{evaluation.posture.next}</p>
    </article>
  );
}
