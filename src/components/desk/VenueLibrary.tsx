import { useEffect, useState } from "react";

import { useDesk } from "@/lib/desk-context";
import {
  addNote,
  changedSince,
  listFiled,
  removeFiled,
  venueLine,
  whenWords,
  type FiledVenue,
} from "@/lib/venue-library";

/**
 * Settings you have filed.
 *
 * The History panel already said what this is for — "you read a menu, ask two
 * questions, decide to wait, and come back having forgotten which two questions
 * you asked" — and then rendered a log you could only scroll past. This is the
 * part you can come back to: the room as it stood, the dates you looked at it,
 * and what moved between one look and the next.
 *
 * The only measure kept is disclosure. How much the setting has named, how much
 * it has not, and how many of your own questions have an answer written against
 * them. No quality, no safety, no ranking, and no view on whether to book —
 * a library is exactly where those boundaries would be easiest to lose.
 */
export function VenueLibrary() {
  const desk = useDesk();
  const [venues, setVenues] = useState<FiledVenue[]>([]);
  const [ready, setReady] = useState(false);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    setVenues(listFiled());
    setReady(true);
  }, []);

  if (!ready) return null;

  return (
    <section aria-labelledby="library-heading">
      <p className="eyebrow">Settings you have filed</p>
      <h3 id="library-heading" className="display-lg mt-3 text-ink">
        The rooms you are still <span className="italic text-oxblood">thinking about</span>
      </h3>
      <p className="lede mt-4 max-w-2xl">
        A booking decision takes weeks. File a setting and this holds it — the state it was in, the
        dates you came back to it, and what had changed by then. Nothing here is transmitted.
      </p>

      {!venues.length ? (
        <div className="panel mt-6 rounded-xl px-7 py-10">
          <p className="text-sm leading-relaxed text-ink-soft">
            Nothing filed yet. On any setting you have worked on, use{" "}
            <span className="text-ink">File this setting</span> under the venue strip. It is worth
            doing before you phone them, not after — the point of the record is the difference
            between the two.
          </p>
        </div>
      ) : (
        <ul className="mt-6 space-y-px border border-rule">
          {venues.map((venue) => {
            const visits = venue.visits;
            const latest = visits[visits.length - 1];
            const previous = visits.length > 1 ? visits[visits.length - 2] : null;
            return (
              <li
                key={venue.id}
                className="border-b border-rule bg-parchment/70 p-5 last:border-b-0"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
                  <div className="min-w-0">
                    <p className="font-display text-xl leading-snug text-ink">{venue.name}</p>
                    <p className="mt-1 font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-soft">
                      {venueLine(venue)}
                    </p>
                  </div>
                  <p className="font-mono text-[0.625rem] uppercase tracking-[0.16em] text-ink-soft">
                    Last looked at {latest ? whenWords(latest.at) : "—"}
                  </p>
                </div>

                {previous && latest ? (
                  <div className="mt-4 border-l-2 border-bronze/50 pl-4">
                    <p className="eyebrow">Since {whenWords(previous.at)}</p>
                    <ul className="mt-2 space-y-1.5">
                      {changedSince(previous, latest).map((line) => (
                        <li key={line} className="text-sm leading-relaxed text-ink-soft">
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {visits.some((v) => v.note) ? (
                  <ol className="mt-4 space-y-2">
                    {visits
                      .filter((v) => v.note)
                      .slice(-4)
                      .map((v) => (
                        <li key={v.at} className="text-sm leading-relaxed text-ink">
                          <span className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-soft">
                            {whenWords(v.at)}
                          </span>
                          <br />
                          {v.note}
                        </li>
                      ))}
                  </ol>
                ) : null}

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="btn-quiet"
                    onClick={() => desk.openFiled(venue.block)}
                  >
                    Put it back on the desk
                  </button>
                  <button
                    type="button"
                    className="btn-quiet"
                    onClick={() => {
                      setNoteFor((v) => (v === venue.id ? null : venue.id));
                      setDraft("");
                    }}
                  >
                    {noteFor === venue.id ? "Cancel" : "Add a dated note"}
                  </button>
                  <button
                    type="button"
                    className="inline-flex min-h-11 items-center font-mono text-[0.5625rem] uppercase tracking-[0.16em] text-ink-soft underline decoration-dotted underline-offset-4 hover:text-ink"
                    onClick={() => setVenues(removeFiled(venue.id))}
                  >
                    Remove from the library
                  </button>
                </div>

                {noteFor === venue.id ? (
                  <form
                    className="mt-4 flex flex-wrap items-start gap-3"
                    onSubmit={(e) => {
                      e.preventDefault();
                      setVenues(addNote(venue.id, draft));
                      setDraft("");
                      setNoteFor(null);
                    }}
                  >
                    <label htmlFor={`note-${venue.id}`} className="sr-only">
                      A note about {venue.name}
                    </label>
                    <textarea
                      id={`note-${venue.id}`}
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={2}
                      maxLength={600}
                      placeholder="Left a message on the 14th. No call back."
                      className="min-h-11 min-w-0 flex-1 border border-rule bg-bone px-3 py-2 text-sm text-ink"
                    />
                    <button type="submit" className="btn-primary">
                      Write it down
                    </button>
                  </form>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/**
 * File the setting currently on the desk.
 *
 * Re-filing the same block adds a dated visit rather than a second row, which
 * is the entire point: the same room, six weeks apart, with the difference
 * visible.
 */
export function FileThisVenue() {
  const desk = useDesk();
  const [state, setState] = useState<"idle" | "done">("idle");

  if (desk.a.posture.key === "empty") return null;

  return (
    <div className="no-print flex flex-wrap items-center gap-3 border border-rule bg-parchment px-4 py-3 sm:px-5">
      <p className="min-w-0 flex-1 text-sm leading-relaxed text-ink-soft">
        {state === "done"
          ? `"${desk.active.name}" is in your library. Come back to it and the desk will tell you what has changed since today.`
          : "Deciding on this one will take longer than this sitting. File it and the desk will remember what you knew today."}
      </p>
      <button
        type="button"
        className="btn-quiet"
        onClick={async () => {
          const { fileVenue } = await import("@/lib/venue-library");
          fileVenue(desk.active, desk.a);
          setState("done");
        }}
      >
        {state === "done" ? "File it again" : "File this setting"}
      </button>
    </div>
  );
}
