import roomNight from "@/assets/room-night.jpg";

/**
 * Cinematic masthead. The image carries the atmosphere; the type carries the
 * position. Live readouts are drawn from the desk, so the opening frame never
 * states more than the desk can support.
 *
 * Progressive disclosure: one primary CTA on first load ("Try a demo").
 * Secondary paths and live score readouts appear once the desk has something to score.
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
  /** True once any field has been filled — unlocks secondary paths and score readout. */
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
          The room
          <span className="block pl-[8%] italic text-bronze-soft">answers first.</span>
          <span className="block">The promise waits.</span>
        </h1>

        {/* Plain-English three-step explainer — above the fold, before any scoring UI */}
        <ol className="mt-10 grid max-w-2xl gap-4 sm:grid-cols-3 sm:gap-6">
          {[
            ["1", "Tell us the service and setting."],
            ["2", "We show you what the spa hasn\u2019t told you."],
            ["3", "Print the packet and bring it to your consult."],
          ].map(([n, line]) => (
            <li key={n} className="flex gap-3 sm:block">
              <span className="num shrink-0 text-bronze-soft">{n}</span>
              <span className="text-sm leading-snug text-parchment/85">{line}</span>
            </li>
          ))}
        </ol>

        <div className="mt-10 grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-end">
          <p className="max-w-xl text-[1.02rem] leading-relaxed text-parchment/80">
            Menu identity, setting type, jurisdiction, who holds the needle and under which licence,
            the named product or device, sanitation practice, night cover, consent. Every unanswered
            line stays on the page as an unanswered line.
          </p>

          {hasInput ? (
            <dl className="grid grid-cols-2 gap-px border border-bronze/30 bg-bronze/20 sm:grid-cols-4 md:grid-cols-2">
              {[
                ["Resolved", `${place}%`],
                ["Burden", burden],
                ["Fail closed", String(failClosed)],
                ["On the desk", `${venues} venue${venues === 1 ? "" : "s"}`],
              ].map(([k, v]) => (
                <div key={k} className="bg-oxblood-deep/85 px-4 py-3">
                  <dt
                    className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-bronze-soft"
                    title={
                      k === "Resolved"
                        ? "Share of the setting that is named and checkable, not inferred."
                        : k === "Burden"
                          ? "How much verification this service class and setting type typically require."
                          : k === "Fail closed"
                            ? "Left open when identity is unnamed or vague — never filled in by assumption."
                            : "How many settings are loaded for side-by-side comparison."
                    }
                  >
                    {k}
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

        {/* Primary: Try a demo. Secondary paths unlock after input. */}
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
