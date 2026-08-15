import roomNight from "@/assets/room-night.jpg";
import { TermTip } from "./TermTip";

/**
 * Compact opening. Three steps lead. CTAs must change what is already on screen.
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

      <div className="relative mx-auto max-w-6xl px-5 py-8 md:px-8 md:py-10">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-bronze-soft">
          Vanity or Vice · Setting evaluation desk
        </p>

        <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] lg:items-end">
          <div>
            <h1 className="font-display text-[clamp(2.1rem,5vw,3.6rem)] font-semibold leading-[0.95] text-parchment">
              Three steps
              <span className="italic text-bronze-soft"> before you book.</span>
            </h1>
            <ol className="mt-6 grid gap-3 sm:grid-cols-3 sm:gap-5">
              {[
                ["1", "Tell us the service and setting."],
                ["2", "We show you what the spa hasn’t told you."],
                ["3", "Print the packet and bring it to your consult."],
              ].map(([n, line]) => (
                <li key={n} className="flex gap-3">
                  <span className="num shrink-0 text-bronze-soft">{n}</span>
                  <span className="text-sm leading-snug text-parchment/85">{line}</span>
                </li>
              ))}
            </ol>
          </div>

          {hasInput ? (
            <dl className="grid grid-cols-2 gap-px border border-bronze/30 bg-bronze/20">
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
            <p className="max-w-sm text-sm leading-relaxed text-parchment/75">
              The room answers first. The promise waits. Name what they told you — gaps stay
              gaps. Education only.
            </p>
          )}
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-2.5">
          <button type="button" className="btn-lux" onClick={onDemo}>
            Try a demo
          </button>
          <button type="button" className="btn-lux-quiet" onClick={onFast}>
            Start with four questions
          </button>
          {hasInput ? (
            <>
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
          ) : null}
        </div>
      </div>
    </section>
  );
}
