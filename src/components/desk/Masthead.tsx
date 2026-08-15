import roomNight from "@/assets/room-night.jpg";
import { TermTip } from "./TermTip";

/**
 * Cinematic masthead. The three-step pitch leads. The poem is atmosphere,
 * not the first thing a first-time reader has to decode.
 */
export function Masthead({
  onDemo,
  onFast,
  onFull,
  onPaste,
  onPrep,
  place,
  burden,
  failClosed,
  venues,
  hasInput = false,
}: {
  onDemo: () => void;
  onFast: () => void;
  onFull: () => void;
  onPaste: () => void;
  onPrep: () => void;
  place: number;
  burden: string;
  failClosed: number;
  venues: number;
  hasInput?: boolean;
}) {
  return (
    <section className="relative isolate overflow-hidden border-b border-rule bg-oxblood-deep">
      <img
        src={roomNight}
        alt="An empty reclining treatment chair in oxblood leather under a single hard lamp, instrument cart in shadow"
        width={1920}
        height={1088}
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-70"
      />
      <div className="scrim-oxblood absolute inset-0 -z-10" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-5 pb-10 pt-16 md:px-8 md:pb-16 md:pt-28">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-bronze-soft">
          Vanity or Vice · Setting evaluation desk
        </p>

        <h1 className="display-2xl mt-7 max-w-4xl text-parchment">
          Three steps
          <span className="block italic text-bronze-soft">before you book.</span>
        </h1>

        <ol className="mt-10 grid max-w-3xl gap-4 sm:grid-cols-3 sm:gap-6">
          {[
            ["1", "Tell us the service and setting."],
            ["2", "We show you what the spa hasn’t told you."],
            ["3", "Print the packet and bring it to your consult."],
          ].map(([n, line]) => (
            <li key={n} className="flex gap-3 sm:block">
              <span className="num shrink-0 text-bronze-soft">{n}</span>
              <span className="text-sm leading-snug text-parchment/85 sm:mt-2 sm:block">{line}</span>
            </li>
          ))}
        </ol>

        <p className="mt-10 max-w-xl font-display text-2xl leading-tight text-parchment/70 md:text-3xl">
          The room answers first.
          <span className="italic text-bronze-soft"> The promise waits.</span>
        </p>

        <div className="mt-10 grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-end">
          <p className="max-w-xl text-[1.02rem] leading-relaxed text-parchment/80">
            Menu identity, setting type, jurisdiction, who holds the needle and under which licence,
            the named product or device, sanitation practice, night cover, consent. Every unanswered
            line stays on the page as an unanswered line.
          </p>

          {hasInput ? (
            <dl className="grid grid-cols-2 gap-px border border-bronze/30 bg-bronze/20 sm:grid-cols-4 md:grid-cols-2">
              {(
                [
                  ["Resolved", `${place}%`, "place"],
                  ["Burden", burden, "burden"],
                  ["Fail closed", String(failClosed), "failClosed"],
                  ["On the desk", `${venues} venue${venues === 1 ? "" : "s"}`, null],
                ] as const
              ).map(([k, v, term]) => (
                <div key={k} className="bg-oxblood-deep/85 px-4 py-3">
                  <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-bronze-soft">
                    {term ? (
                      <TermTip id={term} tone="parchment">
                        {k}
                      </TermTip>
                    ) : (
                      k
                    )}
                  </dt>
                  <dd className="num mt-1.5 truncate text-lg text-parchment">{v}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <div className="border border-bronze/25 bg-oxblood-deep/70 px-5 py-4">
              <p className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-bronze-soft">
                Desk empty
              </p>
              <p className="mt-2 text-sm leading-relaxed text-parchment/70">
                Scores appear after you name the service. Nothing is inferred on an empty desk.
              </p>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-2.5">
          <button type="button" className="btn-lux" onClick={onDemo}>
            Try a demo
          </button>
          {hasInput ? (
            <>
              <button type="button" className="btn-lux-quiet" onClick={onFast}>
                Four questions
              </button>
              <button type="button" className="btn-lux-quiet" onClick={onFull}>
                Full evaluate
              </button>
              <button type="button" className="btn-lux-quiet" onClick={onPaste}>
                Paste venue text
              </button>
              <button type="button" className="btn-lux-quiet" onClick={onPrep}>
                Consultation prep
              </button>
            </>
          ) : (
            <button type="button" className="btn-lux-quiet" onClick={onFast}>
              Or start with four questions
            </button>
          )}
        </div>

        <p className="num mt-9 max-w-2xl border-t border-bronze/25 pt-5 text-[0.625rem] leading-relaxed tracking-[0.14em] text-parchment/60">
          EDUCATION ONLY · NO DIAGNOSIS · NO CANDIDACY · NO PROVIDER RANKING · UNKNOWNS STAY VISIBLE
        </p>
      </div>
    </section>
  );
}
