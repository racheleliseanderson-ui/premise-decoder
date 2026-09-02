import { Link } from "@tanstack/react-router";
import { useInterfaceLang } from "@/lib/lang-context";
import { MODES } from "@/lib/modes";
import {
  HOUSE_LEGAL_URL,
  HOUSE_NAME,
  HOUSE_SUPPORT_URL,
  HOUSE_URL,
  THIS_APP,
  THIS_PUBLICATION,
} from "@/lib/fleet";

/**
 * In-app footer.
 *
 * The same-origin-only rule left this desk as the one instrument in the fleet
 * with no way back out: someone who arrived from Skincare or Makeup — or from a
 * search result — could reach the publication only through the desktop house bar,
 * which is hidden below `lg`. The Vanity or Vice row below is a way out, not a
 * handoff: no session state travels with it, and every destination is named.
 *
 * Links come from the shared fleet registry so they cannot drift from the rest
 * of the house. Gold hairline is the house mark. Identity and disclaimer stay text.
 */
export function LabsFooter() {
  const { t } = useInterfaceLang();

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
            {MODES.map((mode) => (
              <li key={mode.id}>
                <Link
                  to={mode.path}
                  className="inline-flex min-h-11 items-center text-sm text-pearl/85 no-underline transition-colors hover:text-gold-soft"
                >
                  {t(`mode.${mode.id}`)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Vanity or Vice" className="mt-10">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-pearl/50">
            Vanity or Vice
          </p>
          <ul className="mt-3 flex flex-wrap gap-x-5">
            <li>
              <a
                href={THIS_PUBLICATION.publication.url}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 items-center text-sm text-pearl/85 no-underline transition-colors hover:text-gold-soft"
              >
                {THIS_PUBLICATION.publication.name}
                <span aria-hidden="true" className="ml-1">
                  ↗
                </span>
              </a>
            </li>
            {THIS_PUBLICATION.apps
              .filter((app) => app.name !== THIS_APP)
              .map((app) => (
                <li key={app.url}>
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex min-h-11 items-center text-sm text-pearl/85 no-underline transition-colors hover:text-gold-soft"
                  >
                    {app.name}
                    <span aria-hidden="true" className="ml-1">
                      ↗
                    </span>
                  </a>
                </li>
              ))}
          </ul>
        </nav>

        <nav aria-label={HOUSE_NAME} className="mt-8">
          <ul className="flex flex-wrap gap-x-5">
            <li>
              <a
                href={HOUSE_URL}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 items-center font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-pearl/60 no-underline transition-colors hover:text-gold-soft"
              >
                {HOUSE_NAME}
              </a>
            </li>
            <li>
              <a
                href={HOUSE_LEGAL_URL}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 items-center font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-pearl/60 no-underline transition-colors hover:text-gold-soft"
              >
                Legal &amp; accessibility
              </a>
            </li>
            <li>
              <a
                href={HOUSE_SUPPORT_URL}
                target="_blank"
                rel="noopener"
                className="inline-flex min-h-11 items-center font-mono text-[0.6875rem] uppercase tracking-[0.14em] text-pearl/60 no-underline transition-colors hover:text-gold-soft"
              >
                Support
              </a>
            </li>
          </ul>
        </nav>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-pearl/15 pt-6">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-pearl/55">
            {t("foot.rights")}
          </p>
          <p className="ml-auto font-mono text-[0.625rem] uppercase tracking-[0.16em] text-pearl/60">
            {t("edu.only")}
          </p>
        </div>
      </div>
    </footer>
  );
}
