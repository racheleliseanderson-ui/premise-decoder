import { Link } from "@tanstack/react-router";
import type { MODES } from "@/lib/modes";
import { EDITORIAL } from "@/lib/seo";
import { FleetLinks } from "./FleetLinks";

/**
 * In-app footer. Same-origin panel links first, then the house and the rest of
 * the fleet. Gold hairline is the house mark. Identity and disclaimer stay text.
 *
 * `panels` comes from the shell so the footer, the tab strip and the house nav
 * cannot drift apart on what a panel is called.
 */
export function LabsFooter({ panels }: { panels: typeof MODES }) {
  return (
    <footer className="no-print bg-navy-deep">
      <div className="h-px w-full bg-gold" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <p className="font-mono text-[0.625rem] uppercase tracking-[0.28em] text-gold">
          Northern Lantern House Labs
        </p>
        <h2 className="mt-3 font-display text-2xl leading-none text-pearl md:text-3xl">
          Spa Intelligence
        </h2>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-pearl/75">
          Four questions before you book. Gaps stay gaps. Education only.
        </p>

        <nav aria-label="In this site" className="mt-10">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-pearl/50">
            In this site
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5">
            {panels.map((panel) => (
              <li key={panel.id}>
                <Link
                  to={panel.path}
                  className="inline-flex min-h-11 items-center text-sm text-pearl/85 no-underline transition-colors hover:text-gold-soft"
                >
                  {panel.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/*
          * Who wrote this.
          *
          * The desk asked readers to weigh a room's disclosure while disclosing
          * nothing about itself: no name anywhere in the application, an author
          * meta of "Vanity or Vice", and the editorial-standards constant
          * exported in seo.ts and rendered on no page. For a product about
          * medical aesthetics that is the loudest omission there is, and the
          * honest version is also the stronger one — a licence held and not
          * practised, plus a decade of paying for this, beats an unnamed LLC.
          */}
        <section className="mt-12 border-t border-pearl/15 pt-8" aria-labelledby="who-wrote-this">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-pearl/50">
            Who is behind this desk
          </p>
          <h2 id="who-wrote-this" className="mt-3 font-display text-xl leading-tight text-pearl">
            Rachel Anderson
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pearl/75">
            She researches, writes and builds Vanity or Vice on her own. She holds a medical
            aesthetics licence and does not practise, so what sits behind these pages is formal
            training plus about a decade of paying for this as a customer — the treatments, the
            receipts, and a few decisions she would take back. No industry money and no affiliate
            links, and no chair to fill, which is the part that matters when something is telling
            you what to book.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pearl/60">
            She is not your provider, and this desk has never seen your face.{" "}
            <a
              href={EDITORIAL}
              target="_blank"
              rel="noopener"
              className="underline underline-offset-4 hover:text-gold-soft"
            >
              How the evidence is judged
            </a>
            .
          </p>
        </section>

        <FleetLinks />

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-pearl/15 pt-6">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-pearl/55">
            © 2026 Northern Lantern House
          </p>
          <p className="ml-auto font-mono text-[0.625rem] uppercase tracking-[0.16em] text-pearl/60">
            Education only · no diagnosis · no ranking · no candidacy
          </p>
        </div>
      </div>
    </footer>
  );
}
