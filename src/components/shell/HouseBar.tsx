import { LANGS } from "@/lib/i18n";
import { useInterfaceLang } from "@/lib/lang-context";
import { THEMES, useTheme } from "@/lib/theme";
import { HOUSE_NAME, HOUSE_URL, VANITY } from "@/lib/fleet";
import type { Mode } from "@/lib/modes";

/**
 * House bar — one row, six nav items maximum (Fleet Shell Standard v1 §3.1).
 * Language and display-mode controls live here as compact pills so nothing
 * sits above or over the hero. Gold is house level only: the Labs wordmark.
 */
const NAV: { id: Mode; key: string }[] = [
  { id: "fast", key: "mode.fast" },
  { id: "intake", key: "mode.intake" },
  { id: "full", key: "mode.full" },
  { id: "compare", key: "mode.compare" },
  { id: "decode", key: "mode.decode" },
  { id: "library", key: "mode.library" },
];

export function HouseBar({ mode, onNavigate }: { mode: Mode; onNavigate: (m: Mode) => void }) {
  const { lang, setLang, t } = useInterfaceLang();
  const { theme, setTheme } = useTheme();

  return (
    <header className="no-print sticky top-0 z-30 border-b border-rule bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-nowrap items-center gap-2.5 overflow-x-auto px-4 py-2.5 md:gap-4 md:px-8">
        <a
          href={HOUSE_URL}
          target="_blank"
          rel="noopener"
          className="shrink-0 font-mono text-[0.5625rem] uppercase leading-tight tracking-[0.12em] text-gold no-underline hover:underline sm:tracking-[0.2em]"
        >
          Northern Lantern House Labs
        </a>

        <span aria-hidden="true" className="hidden h-4 w-px shrink-0 bg-rule lg:block" />

        <a
          href={VANITY.publication.url}
          target="_blank"
          rel="noopener"
          className="hidden shrink-0 font-mono text-[0.5625rem] uppercase tracking-[0.2em] text-ink-soft no-underline hover:text-oxblood lg:inline"
        >
          Vanity or Vice
        </a>

        <nav aria-label={t("nav.label")} className="ml-auto flex shrink-0 items-center gap-1">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              aria-current={mode === n.id ? "page" : undefined}
              onClick={() => onNavigate(n.id)}
              className={
                mode === n.id
                  ? "whitespace-nowrap border-b-2 border-oxblood px-1.5 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-oxblood"
                  : "whitespace-nowrap border-b-2 border-transparent px-1.5 py-1 font-mono text-[0.5625rem] uppercase tracking-[0.12em] text-ink-soft transition-colors hover:text-ink"
              }
            >
              {t(n.key)}
            </button>
          ))}
        </nav>

        <div
          role="group"
          aria-label={t("lang.label")}
          className="flex shrink-0 items-center border border-rule"
        >
          {LANGS.map((l) => (
            <button
              key={l.id}
              type="button"
              aria-pressed={lang === l.id}
              title={l.label}
              onClick={() => setLang(l.id)}
              className={
                lang === l.id
                  ? "bg-oxblood px-2 py-1 font-mono text-[0.5625rem] tracking-[0.14em] text-pearl dark:bg-oxblood/30 dark:text-ink"
                  : "px-2 py-1 font-mono text-[0.5625rem] tracking-[0.14em] text-ink-soft hover:text-ink"
              }
            >
              {l.short}
            </button>
          ))}
        </div>

        <div
          role="group"
          aria-label={t("theme.label")}
          className="flex shrink-0 items-center border border-rule"
        >
          {THEMES.map((m) => (
            <button
              key={m.id}
              type="button"
              aria-pressed={theme === m.id}
              title={t(m.labelKey)}
              onClick={() => setTheme(m.id)}
              className={
                theme === m.id
                  ? "bg-oxblood px-2 py-1 font-mono text-[0.625rem] leading-none text-pearl dark:bg-oxblood/30 dark:text-ink"
                  : "px-2 py-1 font-mono text-[0.625rem] leading-none text-ink-soft hover:text-ink"
              }
            >
              <span aria-hidden="true">{m.short}</span>
              <span className="sr-only">{t(m.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>
      <p className="mx-auto max-w-6xl px-4 pb-1.5 font-mono text-[0.5625rem] uppercase tracking-[0.14em] text-ink-soft md:hidden">
        On a phone · swipe the house bar
      </p>
    </header>
  );
}
