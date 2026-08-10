import roomNight from "@/assets/room-night.jpg";

/**
 * Cinematic masthead. The image carries the atmosphere; the type carries the
 * position. Live readouts are drawn from the desk, so the opening frame never
 * states more than the desk can support.
 */
export function Masthead({
  onFast,
  onFull,
  onPaste,
  onPrep,
  place,
  burden,
  failClosed,
  venues,
}: {
  onFast: () => void;
  onFull: () => void;
  onPaste: () => void;
  onPrep: () => void;
  place: number;
  burden: string;
  failClosed: number;
  venues: number;
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

        <div className="mt-10 grid gap-8 md:grid-cols-[1.05fr_0.95fr] md:items-end">
          <p className="max-w-xl text-[1.02rem] leading-relaxed text-parchment/80">
            Menu identity, setting type, jurisdiction, who holds the needle and under which licence,
            the named product or device, sanitation practice, night cover, consent. Every unanswered
            line stays on the page as an unanswered line.
          </p>

          <dl className="grid grid-cols-2 gap-px border border-bronze/30 bg-bronze/20 sm:grid-cols-4 md:grid-cols-2">
            {[
              ["Resolved", `${place}%`],
              ["Burden", burden],
              ["Fail closed", String(failClosed)],
              ["On the desk", `${venues} venue${venues === 1 ? "" : "s"}`],
            ].map(([k, v]) => (
              <div key={k} className="bg-oxblood-deep/85 px-4 py-3">
                <dt className="font-mono text-[0.5625rem] uppercase tracking-[0.18em] text-bronze-soft">
                  {k}
                </dt>
                <dd className="num mt-1.5 truncate text-lg text-parchment">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-10 flex flex-wrap gap-2.5">
          <button type="button" className="btn-lux" onClick={onFast}>
            Start fast path
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
        </div>

        <p className="num mt-9 max-w-2xl border-t border-bronze/25 pt-5 text-[0.625rem] leading-relaxed tracking-[0.14em] text-parchment/60">
          EDUCATION ONLY · NO DIAGNOSIS · NO CANDIDACY · NO PROVIDER RANKING · UNKNOWNS STAY VISIBLE
        </p>
      </div>
    </section>
  );
}
