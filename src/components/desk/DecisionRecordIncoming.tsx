import { useEffect, useState } from "react";
import {
  acceptDecisionHandoff,
  clearDecisionHandoffHash,
  parseDecisionHandoffHash,
  saveDecisionRecord,
  setDecisionContext,
  type DecisionHandoffEnvelope,
} from "@/lib/decision-record";
import { useDesk } from "@/lib/desk-context";

/**
 * An incoming Vanity Decision Record, landing on the spa desk.
 *
 * The rule that governs this card is the one that makes the whole record
 * defensible on this desk in particular: arriving history is KEPT, and it does
 * not touch a single field of the evaluation. Nothing in a skincare routine or
 * a makeup profile can tell you who performs a treatment or under what licence,
 * and a desk that let another desk's answers pre-fill its intake would be
 * manufacturing exactly the false resolution it exists to catch.
 *
 * So: keep the concern, the constraints, the prior decisions and the evidence
 * receipts. Fill in nothing about the venue. That line is the whole reason this
 * desk can claim to be reading a setting rather than a mood.
 */
export function DecisionRecordIncoming() {
  const [incoming, setIncoming] = useState<DecisionHandoffEnvelope | null>(null);
  const desk = useDesk();

  useEffect(() => {
    setIncoming(parseDecisionHandoffHash(window.location.hash));
  }, []);

  if (!incoming) return null;

  const accept = () => {
    let record = acceptDecisionHandoff(incoming, "spa");
    record = setDecisionContext(record, "spa", {
      appState: {
        importedFrom: incoming.source.app,
        importedAt: incoming.source.at,
        // Deliberately nothing about the venue. See the note above.
        mode: desk.mode,
      },
    });
    saveDecisionRecord(record);
    clearDecisionHandoffHash();
    setIncoming(null);
  };

  const ignore = () => {
    clearDecisionHandoffHash();
    setIncoming(null);
  };

  return (
    <section
      className="sticky top-0 z-[70] border-b border-rule bg-parchment/97 px-5 py-4 backdrop-blur md:px-10"
      aria-labelledby="incoming-spa-record"
    >
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-4xl">
          <p className="eyebrow">Incoming Vanity Decision Record</p>
          <h2 id="incoming-spa-record" className="display-lg mt-2 text-2xl text-ink md:text-3xl">
            Keep the history.{" "}
            <span className="italic text-oxblood">Nothing here fills in the room.</span>
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            From {incoming.source.app} · {new Date(incoming.source.at).toLocaleString()}. This desk
            keeps the concern, constraints, prior decisions and evidence receipts, and answers not one
            question about the setting from them — nothing in a routine can tell you who performs a
            treatment or under what licence.
          </p>
          <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Line label="Concern" value={incoming.record.concern || "not named"} />
            <Line label="Goals" value={incoming.record.goals.join(", ") || "none named"} />
            <Line
              label="Constraints"
              value={incoming.record.constraints.slice(0, 6).join(" · ") || "none recorded"}
            />
            <Line label="History" value={`${incoming.record.history.length} prior entries`} />
          </dl>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button type="button" className="btn-primary" onClick={accept}>
            Keep this record
          </button>
          <button type="button" className="btn-quiet" onClick={ignore}>
            Continue without importing
          </button>
        </div>
      </div>
    </section>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="eyebrow text-[0.55rem]">{label}</dt>
      <dd className="mt-1 text-ink-soft">{value}</dd>
    </div>
  );
}
