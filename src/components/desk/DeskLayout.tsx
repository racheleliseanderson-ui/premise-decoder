import type { ReactNode } from "react";
import consentImg from "@/assets/consent-paper.jpg";

import { MODES } from "@/lib/modes";
import { AppearanceControl } from "@/components/shell/AppearanceControl";
import { HouseBar } from "@/components/shell/HouseBar";
import { LabsFooter } from "@/components/shell/LabsFooter";

/**
 * Fleet shell, and nothing else.
 *
 * It used to render the whole application: hero, working panel, results,
 * demos, chapter break, method — with `children` discarded and the panel
 * chosen from a mode in context. Ten routes therefore rendered one page. This
 * now does what a layout does: house bar at the top, the routed page in the
 * middle, footer and the one floating control at the bottom.
 */
export function DeskLayout({ children }: { children?: ReactNode }) {
  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <HouseBar panels={MODES} />
      <main id="main">{children}</main>
      <LabsFooter panels={MODES} />
      <AppearanceControl />
    </div>
  );
}

/**
 * The chapter break. Front page only, and `no-print` like the rest of the
 * front matter — a decision card sent to a printer used to carry the hero
 * photograph, eleven demo cards and this, because none of the marketing
 * furniture had ever been marked.
 */
export function ChapterBreak() {
  return (
    <section className="no-print relative isolate overflow-hidden bg-navy-deep">
      <img
        src={consentImg}
        alt="Macro view of cream consent paperwork with a blank signature line and an unticked box, brass pen resting across it"
        width={1920}
        height={912}
        loading="lazy"
        className="absolute inset-0 -z-10 h-full w-full object-cover opacity-45"
      />
      <div className="scrim-hero absolute inset-0 -z-10" aria-hidden="true" />
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        <p className="chapter-mark text-pearl/60">Chapter · the unsigned line</p>
        <h2 className="display-lg mt-6 max-w-3xl text-pearl">
          A blank box is not consent.
          <span className="block italic text-pearl/70">It is a question nobody asked.</span>
        </h2>
        <p className="mt-6 max-w-xl text-sm leading-relaxed text-pearl/80">
          The desk records a declined answer differently from silence. Both stay open. Neither is
          smoothed into a result.
        </p>
      </div>
    </section>
  );
}

/** Method, boundaries and the standing limits — the rigor, kept below the fold. */
export function Method() {
  return (
    <section className="no-print border-t border-rule bg-parchment">
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="eyebrow">This guide</p>
            <h2 className="display-lg mt-3 text-ink">What the desk does</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink-soft">
              {[
                "Scores how much of the setting is actually named before you book",
                "Separates day spa, hotel spa, suite rental, mobile, med-spa, dental-adjacent, and clinic questions",
                "Holds performer, license, product, device, sanitation, and jurisdiction to the same standard",
                "Compares up to five settings on disclosure, and prints the residual unknowns",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden="true" className="num text-bronze">
                    ·
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="eyebrow">Boundaries</p>
            <h2 className="display-lg mt-3 text-ink">What it will not pretend</h2>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed text-ink-soft">
              {[
                "No diagnosis, candidacy, or clinical clearance",
                "No provider ranking and no outcome promises",
                "Comparison measures disclosure, never safety or quality",
                "Unnamed identity stays unresolved — we do not guess",
              ].map((t) => (
                <li key={t} className="flex gap-3">
                  <span aria-hidden="true" className="num text-oxblood">
                    ·
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 grid gap-px border border-rule bg-rule sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Education only", "No diagnosis, candidacy, provider ranking, or clinical verdict."],
            ["Unknowns stay", "Gaps are printed, not smoothed over or filled in by inference."],
            [
              "Unnamed stays open",
              "Tier language and voicemail queues count as unresolved. We do not guess.",
            ],
            ["This browser only", "The desk autosaves locally. Nothing is transmitted anywhere."],
          ].map(([t, d]) => (
            <div key={t} className="bg-bone px-4 py-4">
              <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-oxblood">
                {t}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
