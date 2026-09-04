import { useEffect, useMemo, useState } from "react";
import {
  loadDecisionRecord,
  type DecisionEntry,
  type DecisionHistoryEntry,
  type VanityDecisionRecord,
} from "@/lib/decision-record";
import { listSets, relativeTime, type SavedSet } from "@/lib/session";
import type { Mode } from "@/lib/modes";
import { SectionHead } from "./ui";

/**
 * What you have decided.
 *
 * The desk has been writing a dated record for a while — every position it took
 * on a setting, every question sheet built, every packet exported — and then
 * showing the reader none of it. The only place that record surfaced was a
 * single line on an arriving handoff card saying how many entries it held.
 *
 * That is the wrong way round for this particular desk. Booking decisions are
 * slow. Someone reads a menu in March, asks two questions, decides to wait,
 * and comes back in May having forgotten which two questions they asked and
 * what the answer was. This screen is for that person.
 *
 * It reads. It never writes. Nothing is fetched: the record is in this browser
 * and nowhere else, which the page says out loud rather than assuming the
 * reader will infer it from the absence of a login button.
 */

const KIND_LABEL: Record<string, string> = {
  created: "Record opened",
  "context-imported": "Context carried in",
  handoff: "Handed to another desk",
  decision: "Position taken",
  wear: "Wear logged",
  reassessment: "Reassessed",
  consult: "Question sheet built",
  evidence: "Evidence noted",
  correction: "Corrected",
};

const APP_LABEL: Record<string, string> = {
  spa: "Spa",
  skincare: "Skincare",
  makeup: "Makeup",
};

const STATUS_CHIP: Record<DecisionEntry["status"], string> = {
  chosen: "chip chip-known",
  held: "chip chip-partial",
  open: "chip",
  reversed: "chip chip-fail",
};

const STATUS_WORD: Record<DecisionEntry["status"], string> = {
  chosen: "Settled",
  held: "Held",
  open: "Open",
  reversed: "Reversed",
};

const dayOf = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
};

export function DeskHistory({ onGo }: { onGo: (m: Mode) => void }) {
  // The record and the saved sets both live in localStorage, so neither exists
  // during the server render. Reading them in an effect keeps hydration honest
  // rather than producing a first paint that disagrees with the second.
  const [record, setRecord] = useState<VanityDecisionRecord | null>(null);
  const [sets, setSets] = useState<SavedSet[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRecord(loadDecisionRecord());
    setSets(listSets());
    setReady(true);
  }, []);

  const spaDecisions = useMemo(
    () =>
      (record?.decisions ?? [])
        .filter((d) => d.app === "spa")
        .slice()
        .reverse(),
    [record],
  );
  const elsewhere = useMemo(
    () =>
      (record?.decisions ?? [])
        .filter((d) => d.app !== "spa")
        .slice()
        .reverse(),
    [record],
  );
  const history = useMemo(() => (record?.history ?? []).slice().reverse().slice(0, 40), [record]);

  if (!ready) {
    return (
      <div className="panel rounded-xl px-7 py-14 text-center">
        <p className="eyebrow">Reading your browser</p>
      </div>
    );
  }

  const empty = !record || (spaDecisions.length === 0 && history.length === 0 && sets.length === 0);

  return (
    <div className="space-y-12">
      <SectionHead eyebrow="What you have decided" title="The slow decision, kept">
        Booking decisions take weeks. You read a menu, ask two questions, decide to wait, and come
        back having forgotten which two questions you asked. This is that record — every position
        this desk took, every sheet you built, every card you took away, with the date on it.
      </SectionHead>

      {empty ? (
        <div className="panel rounded-xl px-7 py-14 text-center">
          <p className="eyebrow">Nothing recorded yet</p>
          <h3 className="display-lg mx-auto mt-4 max-w-md text-ink">
            You have not <span className="italic text-oxblood">decided anything</span> here yet
          </h3>
          <p className="lede mx-auto mt-4 max-w-md">
            The record starts writing itself the first time you build a question sheet or open a
            decision card. Nothing is sent anywhere — it is a file in this browser, on this device.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button type="button" className="btn-primary" onClick={() => onGo("fast")}>
              Start with four questions
            </button>
            <button type="button" className="btn-quiet" onClick={() => onGo("full")}>
              Walk a setting properly
            </button>
          </div>
        </div>
      ) : null}

      {spaDecisions.length ? (
        <section>
          <p className="eyebrow">Positions this desk took</p>
          <ul className="mt-4 space-y-px border border-rule">
            {spaDecisions.map((d) => (
              <li key={d.id} className="border-b border-rule bg-parchment/70 p-5 last:border-b-0">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-display text-xl leading-snug text-ink">{d.label}</p>
                  <span className={STATUS_CHIP[d.status]}>{STATUS_WORD[d.status]}</span>
                </div>
                {d.rationale ? (
                  <p className="mt-3 max-w-prose text-sm leading-relaxed text-ink-soft">
                    {d.rationale}
                  </p>
                ) : null}
                <p className="mt-3 font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-soft">
                  {dayOf(d.at)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {sets.length ? (
        <section>
          <p className="eyebrow">Settings you saved</p>
          <ul className="mt-4 grid gap-px border border-rule sm:grid-cols-2">
            {sets.map((s) => (
              <li
                key={s.id}
                className="border-b border-rule bg-parchment/70 p-5 last:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0"
              >
                <p className="font-display text-lg leading-snug text-ink">{s.name}</p>
                <p className="mt-2 text-sm text-ink-soft">
                  {s.blocks.length} setting{s.blocks.length === 1 ? "" : "s"} ·{" "}
                  {relativeTime(s.savedAt)}
                </p>
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-prose text-xs leading-relaxed text-ink-soft">
            Saved sets are loaded from the compare panel. Loading one replaces what is currently on
            the desk — this list is a record of what exists, not a second copy of it.
          </p>
        </section>
      ) : null}

      {elsewhere.length ? (
        <section>
          <p className="eyebrow">Carried in from the rest of Vanity or Vice</p>
          <ul className="mt-4 space-y-px border border-rule">
            {elsewhere.map((d) => (
              <li
                key={d.id}
                className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-rule bg-parchment/50 px-5 py-4 last:border-b-0"
              >
                <span className="chip">{APP_LABEL[d.app] ?? d.app}</span>
                <span className="min-w-0 flex-1 text-sm leading-relaxed text-ink">{d.label}</span>
                <span className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-soft">
                  {dayOf(d.at)}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 max-w-prose text-xs leading-relaxed text-ink-soft">
            These came from the skincare and makeup desks through a link you followed. This desk has
            not read anything it was not handed, and it has sent nothing back on its own.
          </p>
        </section>
      ) : null}

      {history.length ? (
        <section>
          <p className="eyebrow">Everything, in order</p>
          <ol className="mt-4 border-l border-rule pl-5">
            {history.map((h: DecisionHistoryEntry) => (
              <li key={h.id} className="relative pb-6 last:pb-0">
                <span
                  aria-hidden="true"
                  className="absolute -left-[1.4375rem] top-1.5 block size-2 rounded-full bg-bronze"
                />
                <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-soft">
                  {dayOf(h.at)} · {APP_LABEL[h.app] ?? h.app} · {KIND_LABEL[h.kind] ?? h.kind}
                </p>
                <p className="mt-1.5 text-sm leading-relaxed text-ink">{h.label}</p>
                {h.detail ? (
                  <p className="mt-1 max-w-prose text-xs leading-relaxed text-ink-soft">
                    {h.detail}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {record ? (
        <p className="border-t border-rule pt-6 text-xs leading-relaxed text-ink-soft">
          This record lives in this browser and has never been transmitted. Clearing your site data
          removes it, and there is no copy anywhere else — which is the trade for not asking you to
          make an account before you can find out what a facial costs.
        </p>
      ) : null}
    </div>
  );
}
