import type { Assessment } from "@/lib/engine";
import { whatIfAll } from "@/lib/sensitivity";
import { StateChip } from "./ui";
import { ClaimLedger, RegisterNotes } from "./ClaimDecoder";
import { TermTip } from "./TermTip";

/**
 * Setting Decision Card — what is known, what is fail-closed, what is left
 * unknown, and the cleanest next verification steps. Printable as a packet.
 */
export function DecisionCard({ a, dense = false }: { a: Assessment; dense?: boolean }) {
  if (a.posture.key === "empty") return <EmptyCard />;

  const postureChip =
    a.posture.key === "resolved"
      ? "chip chip-known"
      : a.posture.key === "partial"
        ? "chip chip-partial"
        : "chip chip-fail";

  return (
    <article className="rise panel overflow-hidden rounded-xl">
      {/* masthead */}
      <header className="border-b border-rule bg-oxblood-tint/35 px-6 py-5 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow">Setting decision card</p>
            <h3 className="display-lg mt-2 text-ink">{a.posture.label}</h3>
          </div>
          <span className={postureChip}>
            {a.posture.key === "resolved" ? "Answerable" : "Open items"}
          </span>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{a.posture.line}</p>
        <p className="num mt-4 text-xs text-ink-soft">{a.identityLine}</p>
      </header>

      {/* metrics strip */}
      <div className="grid grid-cols-2 divide-x divide-rule border-b border-rule md:grid-cols-4">
        <Metric
          label={<TermTip id="place">Place</TermTip>}
          value={`${a.place}`}
          note="setting resolved"
          testId="metric-place"
        />
        <Metric
          label={<TermTip id="promise">Promise</TermTip>}
          value={`${a.promise}`}
          note="marketing pressure"
          testId="metric-promise"
        />
        <Metric
          label={<TermTip id="burden">Burden</TermTip>}
          value={a.burden.band}
          note={`${a.burden.score} index`}
          testId="metric-burden"
        />
        <Metric
          label={<TermTip id="failClosed">Unnamed</TermTip>}
          value={`${a.failClosed.length}`}
          note="unresolved signals"
          testId="metric-failclosed"
        />
      </div>

      <div className="grid gap-0 md:grid-cols-2 md:divide-x md:divide-rule">
        <Column title="What is known" tone="pine">
          {a.known.length === 0 ? (
            <p className="text-sm italic text-ink-soft">
              Nothing is established yet. That is itself the finding.
            </p>
          ) : (
            <ul className="space-y-4">
              {a.known.map((s) => (
                <li key={s.id}>
                  <p className="font-display text-lg leading-tight text-ink">{s.label}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.reading}</p>
                </li>
              ))}
            </ul>
          )}
        </Column>

        <Column title="Unnamed" tone="oxblood">
          {a.failClosed.length === 0 ? (
            <p className="text-sm italic text-ink-soft">
              No hard gaps. Remaining items are verification, not discovery.
            </p>
          ) : (
            <ul className="space-y-4">
              {a.failClosed.map((s) => (
                <li key={s.id} className="border-l-2 border-oxblood/50 pl-4">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-display text-lg leading-tight text-ink">{s.label}</p>
                    <StateChip state={s.state} />
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.reading}</p>
                </li>
              ))}
            </ul>
          )}
        </Column>
      </div>

      {/* burden */}
      <div className="border-t border-rule px-6 py-7 md:px-8">
        <p className="eyebrow">Burden — {a.burden.band.toLowerCase()}</p>
        <div className="mt-3 h-[3px] w-full bg-rule">
          <div className="meter-fill h-full bg-bronze" style={{ width: `${a.burden.score}%` }} />
        </div>
        <ul className="mt-4 space-y-2">
          {a.burden.drivers.map((d) => (
            <li key={d} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <span aria-hidden="true" className="num text-bronze">
                ·
              </span>
              {d}
            </li>
          ))}
        </ul>
      </div>

      {/* claims */}
      {(a.claims.length > 0 || a.register.length > 0) && !dense ? (
        <div className="border-t border-rule px-6 py-7 md:px-8">
          {a.register.length > 0 ? (
            <div className="mb-6">
              <RegisterNotes hits={a.register} />
            </div>
          ) : null}
          {a.claims.length > 0 ? (
            <>
              <p className="eyebrow">Claim decoder — {a.claims.length} caught</p>
              <div className="mt-4">
                <ClaimLedger claims={a.claims} />
              </div>
            </>
          ) : null}
        </div>
      ) : null}

      {/* residual unknowns */}
      <div className="border-t border-rule bg-bone/60 px-6 py-7 md:px-8">
        <p className="eyebrow">Residual unknowns — staying on the desk</p>
        {a.unknowns.length === 0 ? (
          <p className="mt-3 text-sm italic text-ink-soft">
            Nothing outstanding from these inputs.
          </p>
        ) : (
          <ol className="mt-4 space-y-3">
            {a.unknowns.map((u, i) => (
              <li key={u} className="flex gap-4 text-sm leading-relaxed text-ink-soft">
                <span className="num shrink-0 text-oxblood">{String(i + 1).padStart(2, "0")}</span>
                <span>{u}</span>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* next steps */}
      <div className="border-t border-rule px-6 py-7 md:px-8">
        <p className="eyebrow">Cleanest next verification steps</p>
        {a.nextSteps.length === 0 ? (
          <p className="mt-3 text-sm italic text-ink-soft">
            Nothing to chase. Read the consent form and keep a copy.
          </p>
        ) : (
          <ol className="mt-4 space-y-4">
            {a.nextSteps.map((q, i) => (
              <li key={q} className="border-l-2 border-bronze/60 pl-4">
                <p className="num text-[0.625rem] tracking-[0.16em] text-ink-soft">
                  STEP {String(i + 1).padStart(2, "0")}
                </p>
                <p className="mt-1 font-display text-xl leading-snug text-ink">“{q}”</p>
              </li>
            ))}
          </ol>
        )}
      </div>

      <WhatIfBlock a={a} />

      <footer className="border-t border-rule px-6 py-5 text-xs leading-relaxed text-ink-soft md:px-8">
        Education only. No diagnosis, candidacy, provider ranking, or clinical verdict. This card
        describes what the setting has and has not answered — nothing about outcomes, safety, or
        results.
      </footer>
    </article>
  );
}

function Metric({
  label,
  value,
  note,
  testId,
}: {
  label: React.ReactNode;
  value: string;
  note: string;
  testId?: string;
}) {
  return (
    <div className="px-5 py-5">
      <p className="eyebrow">{label}</p>
      <p className="num mt-2 text-2xl text-ink" data-testid={testId}>
        {value}
      </p>
      <p className="mt-1 text-xs text-ink-soft">{note}</p>
    </div>
  );
}

function Column({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "pine" | "oxblood";
  children: React.ReactNode;
}) {
  return (
    <div className="px-6 py-7 md:px-8">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className={`inline-block size-1.5 rounded-full ${tone === "pine" ? "bg-pine" : "bg-oxblood"}`}
        />
        <p className="eyebrow">{title}</p>
      </div>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function WhatIfBlock({ a }: { a: Assessment }) {
  const rows = whatIfAll(a.input, a);
  if (rows.length === 0) return null;
  return (
    <div className="border-t border-rule px-6 py-7 md:px-8" data-testid="what-if">
      <p className="eyebrow">What if this were named</p>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
        Example answers only. Each row shows how Place would move if one currently-open field were
        actually named. It is not a safer-room recommendation.
      </p>
      <ul className="mt-5 space-y-3">
        {rows.slice(0, 5).map((row) => (
          <li key={row.field} className="border-l-2 border-bronze/60 pl-4">
            <p className="font-display text-lg leading-tight text-ink">{row.label}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink-soft">{row.proposed}</p>
            <p className="num mt-2 text-[0.625rem] tracking-[0.14em] text-oxblood">
              Place {row.placeBefore} → {row.placeAfter}
              {row.delta > 0 ? ` · +${row.delta}` : row.delta < 0 ? ` · ${row.delta}` : ""}
              {row.closes ? " · would close" : ""}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmptyCard() {
  return (
    <div className="panel rounded-xl px-7 py-14 text-center md:px-10">
      <p className="eyebrow">Desk empty</p>
      <h3 className="display-lg mx-auto mt-4 max-w-md text-ink">
        No service on the desk <span className="italic text-oxblood">yet</span>
      </h3>
      <p className="lede mx-auto mt-4 max-w-md">
        Name the menu line, the setting, the person, and the product. Four questions produce a card.
        Extra fields and a deeper check exist for when four is not enough.
      </p>
      <div className="mx-auto mt-8 max-w-xs space-y-2 text-left">
        {["Menu identity", "Spa vs med-spa", "Who performs it", "Exact product / device"].map(
          (s) => (
            <div key={s} className="flex items-center justify-between border-b border-rule pb-2">
              <span className="text-sm text-ink-soft">{s}</span>
              <span className="chip chip-fail">Awaiting</span>
            </div>
          ),
        )}
      </div>
    </div>
  );
}
