import { Link } from "@tanstack/react-router";
import { useInterfaceLang } from "@/lib/lang-context";
import { MODES } from "@/lib/modes";

/**
 * In-app footer — same-origin links only.
 * Gold hairline is the house mark. Identity and disclaimer stay text.
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
