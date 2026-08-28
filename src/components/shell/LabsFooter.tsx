import { useInterfaceLang } from "@/lib/lang-context";
import {
  ACROSS_FLEET,
  HOUSE_NAME,
  HOUSE_URL,
  THIS_APP,
  VANITY,
  type FleetLink,
} from "@/lib/fleet";

/**
 * Northern Lantern House Labs footer (Fleet Shell Standard v1 §5).
 * Gold hairline opens the band. Structural labels localise; publication and
 * app names stay in English. The only place the fleet is enumerated.
 */
function Out({ link, current }: { link: FleetLink; current?: boolean }) {
  if (current) {
    return (
      <span className="block min-h-11 py-2.5 text-sm text-pearl/55">
        {link.name} <span className="text-gold-soft">· you are here</span>
      </span>
    );
  }
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener"
      className="block min-h-11 py-2.5 text-sm text-pearl/85 no-underline transition-colors hover:text-gold-soft"
    >
      {link.name}
    </a>
  );
}

export function LabsFooter() {
  const { t } = useInterfaceLang();

  return (
    <footer className="no-print bg-navy-deep">
      <div className="h-px w-full bg-gold" aria-hidden="true" />
      <div className="mx-auto max-w-6xl px-5 py-14 md:px-8 md:py-16">
        <p className="font-display text-2xl leading-none text-gold md:text-3xl">{HOUSE_NAME}</p>

        <div className="mt-10 grid gap-10 md:grid-cols-3 md:gap-8">
          <div>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-pearl/50">
              {t("foot.house")}
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-pearl/75">
              {t("foot.houseLine")}
            </p>
            <a
              href={HOUSE_URL}
              target="_blank"
              rel="noopener"
              className="mt-3 inline-flex min-h-11 items-center text-sm text-gold-soft no-underline hover:underline"
            >
              northernlanternhouse.com
            </a>
          </div>

          <div>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-pearl/50">
              {t("foot.pub")}
            </p>
            <div className="mt-3">
              <Out link={VANITY.publication} />
              {VANITY.apps.map((a) => (
                <Out key={a.url} link={a} current={a.name === THIS_APP} />
              ))}
            </div>
          </div>

          <div>
            <p className="font-mono text-[0.625rem] uppercase tracking-[0.2em] text-pearl/50">
              {t("foot.fleet")}
            </p>
            <div className="mt-3 space-y-4">
              {ACROSS_FLEET.map((g) => (
                <div key={g.publication.url}>
                  <Out link={g.publication} />
                  <div className="border-l border-pearl/15 pl-3">
                    {g.apps.map((a) => (
                      <Out key={a.url} link={a} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-pearl/15 pt-6">
          <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-pearl/55">
            {t("foot.rights")}
          </p>
          <a
            href={`${HOUSE_URL}/legal`}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-11 items-center font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-pearl/75 no-underline hover:text-gold-soft"
          >
            {t("foot.legal")}
          </a>
          <a
            href={`${HOUSE_URL}/support`}
            target="_blank"
            rel="noopener"
            className="inline-flex min-h-11 items-center font-mono text-[0.6875rem] uppercase tracking-[0.16em] text-pearl/75 no-underline hover:text-gold-soft"
          >
            {t("foot.support")}
          </a>
          <p className="ml-auto font-mono text-[0.625rem] uppercase tracking-[0.16em] text-pearl/60">
            {t("edu.only")}
          </p>
        </div>
      </div>
    </footer>
  );
}
