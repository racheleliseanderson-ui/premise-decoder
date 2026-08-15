import { useState } from "react";
import roomNight from "@/assets/room-night.jpg";
import { TermTip } from "./TermTip";
import type { Mode } from "@/lib/modes";

/**
 * Compact opening. Three steps lead. The paste box lives here so it is the
 * first thing on the desk — not below the fold, not behind a tab.
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
  mode,
}: {
  onDemo: () => void;
  onFast: () => void;
  onFull: () => void;
  onPaste: (text?: string) => void;
  onPrep: () => void;
  place: number;
  burden: string;
  failClosed: number;
  venues: number;
  hasInput?: boolean;
  mode: Mode;
}) {
  const [draft, setDraft] = useState("");
  const showHeroPaste = mode === "fast";

  return (
    <section className="relative isolate overflow-hidden border-b border-rule bg-oxblood-deep">
      <img
        src={roomNight}
        alt="An empty reclining treatment chair in oxblood leather under a single hard lamp, instrument cart in shadow"
        width={1920}
        height={1088}
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-55"
      />
      <div className="scrim-oxblood absolute inset-0 -z-10" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-5 py-4 md:px-8 md:py-6">
        <p className="font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-bronze-soft">
          Vanity or Vice · Setting evaluation desk
        </p>

        <h1 className="mt-2 font-display text-[clamp(1.65rem,5.2vw,3rem)] font-semibold leading-[0.95] text-parchment">
          Three steps
          <span className="italic text-bronze-soft"> before you book.</span>
        </h1>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)] lg:items-start">
          {showHeroPaste ? (
            <div
              id="hero-paste-card"
              className="order-first border border-bronze/40 bg-parchment p-4 shadow-[0_18px_40px_-28px_rgba(40,12,10,0.55)] lg:order-2"
            >
              <label htmlFor="hero-paste" className="block">
                <span className="label-mono text-ink">Paste a menu, booking email, or ad</span>
                <textarea
                  id="hero-paste"
                  className="field mt-2 resize-y font-sans leading-relaxed text-ink"
                  rows={4}
                  value={draft}
                  placeholder="Paste what they sent you. The desk quotes the sentence behind every fill — it will not guess."
                  onChange={(e) => setDraft(e.target.value)}
                />
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onPaste(draft)}
                >
                  Read this text
                </button>
                <button type="button" className="btn-quiet" onClick={() => onPaste("sample")}>
                  Load a sample
                </button>
              </div>
            </div>
          ) : hasInput ? (
            <dl className="order-first grid grid-cols-2 gap-px border border-bronze/30 bg-bronze/20 lg:order-2">
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
            <p className="order-first max-w-sm text-sm leading-relaxed text-parchment/75 lg:order-2">
              The room answers first. The promise waits. Name what they told you — gaps stay
              gaps. Education only.
            </p>
          )}

          <div className="lg:order-1">
            <ol className="grid gap-2.5 sm:grid-cols-3 sm:gap-4">
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

            <div className="mt-5 flex flex-wrap items-center gap-2.5">
              <button type="button" className="btn-lux" onClick={onDemo}>
                Try a demo
              </button>
              <button
                type="button"
                className={mode === "intake" ? "btn-lux" : "btn-lux-quiet"}
                onClick={() => onPaste(draft)}
              >
                Paste a menu or ad
              </button>
              <button
                type="button"
                className={mode === "fast" ? "btn-lux-quiet" : "btn-lux-quiet"}
                onClick={onFast}
              >
                Four questions
              </button>
              {hasInput ? (
                <>
                  <button type="button" className="btn-lux-quiet" onClick={onFull}>
                    Full evaluate
                  </button>
                  <button type="button" className="btn-lux-quiet" onClick={onPrep}>
                    Consultation prep
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
