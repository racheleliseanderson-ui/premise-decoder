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
            Whose desk this is
          </p>
          <h2 id="who-wrote-this" className="mt-3 font-display text-xl leading-tight text-pearl">
            Rachel Anderson
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pearl/75">
            I research, write and build Vanity or Vice on my own. I hold a medical aesthetics
            licence and I do not practise, so what sits behind these pages is formal training plus
            about a decade of paying for this as a customer — the treatments, the receipts, and the
            times I fell for a result I wanted and handed over the card before asking a single
            useful question. Trained in it, and I still did that.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pearl/75">
            No industry money, no affiliate links, and no chair to fill — that last one is worth
            checking on anyone telling you what to book, including me.
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-pearl/60">
            I am not your provider, and this desk has never seen your face.{" "}
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
