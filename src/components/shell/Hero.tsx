import roomNight from "@/assets/room-night.jpg";

/**
 * Full-bleed hero — 70vh mobile / 62vh desktop minimum. First viewport holds
 * one headline, one subline, one primary CTA and one secondary link. Nothing
 * else: metrics, controls and the fast-path form all live below the fold.
 */
export function Hero({ onStart, onExamples }: { onStart: () => void; onExamples: () => void }) {
  return (
    <section className="relative isolate flex min-h-[70vh] items-end overflow-hidden bg-navy-deep md:min-h-[62vh]">
      <img
        src={roomNight}
        alt="An empty reclining treatment chair upholstered in oxblood leather, lit by a single hard lamp, with an instrument cart waiting in shadow"
        width={1920}
        height={1088}
        fetchPriority="high"
        decoding="async"
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[62%_center]"
      />
      <div className="scrim-hero absolute inset-0 -z-10" aria-hidden="true" />

      <div className="relative w-full px-5 pb-12 pt-24 md:px-8 md:pb-16 md:pt-28">
        <div className="mx-auto max-w-6xl">
          <h1 className="max-w-3xl font-display text-[clamp(2.6rem,7.4vw,5.2rem)] font-semibold leading-[0.92] tracking-[-0.028em] text-pearl">
            See the room
            <span className="block italic text-pearl/65">before you book it.</span>
          </h1>

          <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-pearl/85">
            Spa Intelligence names the service, the setting, the performer and the product — then
            prints what nobody told you.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4">
            <button type="button" className="btn-accent" onClick={onStart}>
              Start with four questions
            </button>
            <button
              type="button"
              onClick={onExamples}
              className="inline-flex min-h-11 items-center font-mono text-[0.6875rem] uppercase tracking-[0.18em] text-pearl underline decoration-pearl/45 decoration-1 underline-offset-[6px] transition-colors hover:text-pearl/70"
            >
              See a real setting
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
