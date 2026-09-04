import { useDesk } from "@/lib/desk-context";
import { ARRIVAL_DISPOSITION, arrivalQuestions, arrivalSummary } from "@/lib/handoff";

/**
 * What came in on the link, said out loud.
 *
 * The rule this notice exists to keep: a handoff that silently changed the desk
 * would be indistinguishable from the desk making things up. So the arrival is
 * printed in full, the disposition states plainly that nothing about the venue
 * was filled in, and the added questions are counted rather than merged in
 * silence. Dismissing it removes the notice; the questions stay on the sheet,
 * where they can be ignored one at a time like every other question.
 */
export function ArrivalNotice() {
  const desk = useDesk();
  const arrival = desk.arrival;
  if (!arrival || arrival.noticed) return null;

  const lines = arrivalSummary(arrival);
  const added = arrivalQuestions(arrival).length;
  // Name the desk that actually sent this. The eyebrow said "Skincare
  // Intelligence" whatever the sender was, while the body text two lines below
  // it correctly said Makeup — the notice whose entire job is telling you where
  // something came from was the one component getting it wrong.
  const sender = arrival.from === "makeup" ? "Makeup Intelligence" : "Skincare Intelligence";

  return (
    <aside
      aria-labelledby="arrival-heading"
      className="no-print mb-8 border border-gold/50 bg-parchment px-5 py-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Arrived from {sender}</p>
          <h2 id="arrival-heading" className="mt-2 font-display text-xl leading-snug text-ink">
            Your routine context came across with the link
          </h2>
        </div>
        <button
          type="button"
          className="btn-quiet"
          onClick={desk.dismissArrival}
          aria-label={`Dismiss the arrival notice from ${sender}`}
        >
          Dismiss
        </button>
      </div>

      <ul className="mt-4 space-y-1.5 text-sm leading-relaxed text-ink">
        {lines.map((line) => (
          <li key={line} className="flex gap-2">
            <span aria-hidden="true" className="text-gold">
              ·
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-soft">{ARRIVAL_DISPOSITION}</p>

      {added > 0 ? (
        <p className="mt-4 text-sm leading-relaxed text-ink">
          <strong className="font-semibold">
            {added} question{added === 1 ? "" : "s"} added to Consult prep.
          </strong>{" "}
          They are questions for the provider, not instructions about your products — what pauses,
          when, and for how long is their call on the specific procedure, and this desk does not
          have the procedure.{" "}
          <button
            type="button"
            className="min-h-11 font-semibold text-oxblood underline underline-offset-4 hover:text-gold"
            onClick={() => desk.go("prep", { scroll: "panel" })}
          >
            Open the sheet
          </button>
        </p>
      ) : null}
    </aside>
  );
}
