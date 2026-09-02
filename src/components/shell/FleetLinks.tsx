import { useId, useState } from "react";
import {
  ACROSS_FLEET,
  HOUSE_LEGAL_URL,
  HOUSE_NAME,
  HOUSE_SUPPORT_URL,
  HOUSE_URL,
  THIS_APP,
  THIS_PUBLICATION,
  type FleetLink,
} from "@/lib/fleet";

/**
 * The fleet footer fleet.ts was written for. Until now the registry called
 * itself the single source of truth for cross-app links and twelve of its
 * fifteen exports rendered nowhere.
 *
 * Registry drift, flagged rather than fixed: fleet.ts lists this app's sibling
 * at skincare.vanityvice.blog as "Skincare Desk". The product ships as
 * "Skincare Intelligence", and since fleet.ts is meant to be byte-identical in
 * every repo, the wrong name would print in every footer in the house. The
 * correction is applied here, at render, keyed by URL. Fix the registry in
 * every repo in one pass and delete this map — do not let it grow.
 */
const NAME_DRIFT: Record<string, string> = {
  "https://skincare.vanityvice.blog": "Skincare Intelligence",
};

const shown = (link: FleetLink) => NAME_DRIFT[link.url] ?? link.name;

const ITEM =
  "inline-flex min-h-11 items-center text-sm text-pearl/80 no-underline transition-colors hover:text-gold-soft";
const COLUMN_HEAD = "font-mono text-[0.625rem] uppercase tracking-[0.2em] text-pearl/50";

function Out({ href, children }: { href: string; children: string }) {
  return (
    <a href={href} target="_blank" rel="noopener" className={ITEM}>
      {children}
    </a>
  );
}

export function FleetLinks() {
  const [open, setOpen] = useState(false);
  const fleetId = useId();

  return (
    <section className="mt-12 border-t border-pearl/15 pt-10">
      <p className="font-mono text-[0.625rem] uppercase tracking-[0.28em] text-gold">The House</p>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-pearl/70">
        Independent publications and the decision guides built for them.
      </p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2">
        <nav aria-label="This publication">
          <p className={COLUMN_HEAD}>This publication</p>
          <ul className="mt-2 flex flex-col">
            <li>
              <Out href={THIS_PUBLICATION.publication.url}>{THIS_PUBLICATION.publication.name}</Out>
            </li>
            {THIS_PUBLICATION.apps.map((app) =>
              app.name === THIS_APP ? (
                <li key={app.url}>
                  <span
                    aria-current="page"
                    className="inline-flex min-h-11 items-center gap-2 text-sm text-pearl"
                  >
                    {shown(app)}
                    <span className="font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-gold-soft">
                      You are here
                    </span>
                  </span>
                </li>
              ) : (
                <li key={app.url}>
                  <Out href={app.url}>{shown(app)}</Out>
                </li>
              ),
            )}
          </ul>
        </nav>

        <nav aria-label="Northern Lantern House">
          <p className={COLUMN_HEAD}>The House</p>
          <ul className="mt-2 flex flex-col">
            <li>
              <Out href={HOUSE_URL}>{HOUSE_NAME}</Out>
            </li>
            <li>
              <Out href={HOUSE_LEGAL_URL}>Legal &amp; accessibility</Out>
            </li>
            <li>
              <Out href={HOUSE_SUPPORT_URL}>Support</Out>
            </li>
          </ul>
        </nav>
      </div>

      <div className="mt-8">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={fleetId}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-11 items-center gap-2 border border-pearl/25 px-4 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-pearl/75 transition-colors hover:border-gold-soft hover:text-gold-soft"
        >
          <span aria-hidden="true">{open ? "–" : "+"}</span>
          Across the fleet
        </button>

        {open ? (
          <div id={fleetId} className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {ACROSS_FLEET.map((group) => (
              <nav key={group.publication.url} aria-label={group.publication.name}>
                <p className={COLUMN_HEAD}>
                  <a
                    href={group.publication.url}
                    target="_blank"
                    rel="noopener"
                    className="inline-flex min-h-11 items-center text-pearl/70 no-underline transition-colors hover:text-gold-soft"
                  >
                    {group.publication.name}
                  </a>
                </p>
                <ul className="flex flex-col">
                  {group.apps.map((app) => (
                    <li key={app.url}>
                      <Out href={app.url}>{shown(app)}</Out>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
