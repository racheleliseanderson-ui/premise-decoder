/**
 * Spa Intelligence's half of the Vanity Decision Record.
 *
 * This desk was the only one of the three with no record at all. Skincare and
 * Makeup have been writing to a shared, versioned, browser-local record for
 * months; Spa — the desk you consult immediately before spending several
 * hundred pounds — kept everything to itself and forgot it the moment the tab
 * closed. That is the wrong way round. The spa decision is the one worth having
 * a record of.
 *
 * What this desk contributes is unusual, and the shape matters:
 *
 *   - It does NOT contribute evidence about treatments. This desk reads
 *     marketing copy and setting disclosure. Nothing it learns is clinical, and
 *     filing it as evidence would be exactly the category error the whole
 *     publication exists to argue against.
 *
 *   - It contributes a DECISION and its OPEN QUESTIONS. "Considering an
 *     energy-device treatment; four heavy signals still unnamed; held pending
 *     the operator's licence" is the useful, durable thing — and it is useful
 *     to the skincare desk, which needs to know a procedure is in play, and to
 *     this desk in three weeks when the reader comes back having forgotten what
 *     they were going to ask.
 *
 *   - It contributes ONE evidence receipt, about its own method, so a reader
 *     inspecting the record can see where these lines came from and how much
 *     they are worth. That is the same self-disclosure the other two desks make.
 *
 * Nothing here leaves the browser unless the reader builds a handoff link.
 */

import {
  appendDecision,
  appendDecisionHistory,
  appendEvidenceReceipt,
  buildDecisionHandoffUrl,
  createDecisionRecord,
  loadDecisionRecord,
  saveDecisionRecord,
  setDecisionContext,
  type VanityDecisionRecord,
} from "@/lib/decision-record";
import { SERVICE_LABELS, type Assessment } from "@/lib/engine";

const METHOD_RECEIPT_ID = "spa-method-v1";

function constraintsFrom(a: Assessment): string[] {
  const out = [
    `service:${a.input.serviceClass}`,
    `venue:${a.input.venue}`,
    `place-resolved:${a.place}`,
    `promise-pressure:${a.promise}`,
    `gap:${a.gapState}`,
    `burden:${a.burden.band.toLowerCase()}`,
  ];
  if (a.refused.length) out.push(`refused:${a.refused.length}`);
  if (a.failClosed.length) out.push(`unnamed:${a.failClosed.length}`);
  return out;
}

/** The one-line decision this desk is actually in a position to record. */
function decisionLine(a: Assessment): { label: string; rationale: string } {
  const service =
    a.input.serviceClass && a.input.serviceClass !== "unselected"
      ? (SERVICE_LABELS[a.input.serviceClass] ?? a.input.serviceClass)
      : "an unnamed service";

  if (a.posture.key === "resolved") {
    return {
      label: `${service}: the setting answers what it has to`,
      rationale: `${a.gapLine} Nothing outstanding from these inputs — which is a statement about disclosure, not about whether the treatment suits you.`,
    };
  }
  if (a.posture.key === "empty") {
    return {
      label: `${service}: nothing entered yet`,
      rationale: "The desk has been opened and not yet fed. No finding either way.",
    };
  }
  const heaviest = [...a.failClosed].sort((x, y) => y.weight - x.weight)[0];
  return {
    label: `${service}: ${a.failClosed.length} thing${a.failClosed.length === 1 ? "" : "s"} still unnamed`,
    rationale: heaviest
      ? `${a.gapLine} The heaviest of them is ${heaviest.label.toLowerCase()} — ${heaviest.ask}`
      : a.gapLine,
  };
}

/**
 * Write this desk's current position into the shared record.
 *
 * Idempotent by intent: it appends a decision only when the position has
 * actually changed, so opening the packet four times does not produce four
 * identical entries in a reader's history.
 */
export function decisionRecordForSpa(a: Assessment): VanityDecisionRecord {
  const existing = loadDecisionRecord();
  const openQuestions = a.failClosed.map((s) => s.ask);

  let record =
    existing ??
    createDecisionRecord("spa", {
      concern: a.input.serviceClass && a.input.serviceClass !== "unselected" ? a.input.serviceClass : "",
      goals: [],
      constraints: constraintsFrom(a),
    });

  record = setDecisionContext(record, "spa", {
    concern:
      record.concern ||
      (a.input.serviceClass && a.input.serviceClass !== "unselected" ? a.input.serviceClass : ""),
    constraints: constraintsFrom(a),
    appState: {
      serviceClass: a.input.serviceClass,
      venue: a.input.venue,
      place: a.place,
      promise: a.promise,
      gapState: a.gapState,
      posture: a.posture.key,
      openQuestions,
      refused: a.refused.map((s) => s.label),
      unnamed: a.failClosed.map((s) => s.label),
      capturedAt: new Date().toISOString(),
    },
  });

  if (!record.evidence.some((e) => e.id === METHOD_RECEIPT_ID)) {
    record = appendEvidenceReceipt(record, "spa", {
      id: METHOD_RECEIPT_ID,
      claim: "Setting disclosure and claim-language reading",
      source: "Vanity or Vice · Spa Intelligence disclosed signal weights and claim dictionary",
      publishedAt: "2026-09-01",
      checkedAt: new Date().toISOString(),
      exactObjectMatch: "setting",
      confidence: "limited",
      uncertainty: [
        "This desk reads what a setting discloses and what its copy is doing. It has read nothing clinical and cannot say whether a treatment is appropriate for anyone.",
        "An unnamed signal means nobody has told you, not that the answer is bad.",
        "A phrase the decoder did not catch is a fact about the decoder's rules, not a clean bill of health for the sentence.",
      ],
      commercialContext: "independent",
      correctionState: "current",
      note: "Recorded so a reader can see where these lines came from and weigh them accordingly.",
    });
  }

  const next = decisionLine(a);
  const last = [...record.decisions].reverse().find((d) => d.app === "spa");
  if (!last || last.label !== next.label || last.rationale !== next.rationale) {
    record = appendDecision(
      record,
      "spa",
      next.label,
      next.rationale,
      a.posture.key === "resolved" ? "chosen" : "held",
    );
  }

  return saveDecisionRecord(record);
}

/** Note a consultation sheet being taken away. Written on the click, not on render. */
export function recordConsultPrep(a: Assessment, questionCount: number): VanityDecisionRecord {
  const record = decisionRecordForSpa(a);
  return saveDecisionRecord(
    appendDecisionHistory(
      record,
      "spa",
      "consult",
      `Question sheet built — ${questionCount} question${questionCount === 1 ? "" : "s"}`,
      "Taken into a consultation. The answers belong on this sheet, in the room, before anything is paid.",
      { serviceClass: a.input.serviceClass, venue: a.input.venue },
    ),
  );
}

/** Note a decision packet leaving the desk. */
export function recordPacket(a: Assessment): VanityDecisionRecord {
  const record = decisionRecordForSpa(a);
  return saveDecisionRecord(
    appendDecisionHistory(
      record,
      "spa",
      "decision",
      "Decision packet exported",
      `${a.known.length} named, ${a.failClosed.length} unnamed, ${a.refused.length} refused at the time of export.`,
    ),
  );
}

/** Called only from a user click, so the fragment is generated client-side. */
export function spaHandoffUrl(href: string, a: Assessment): string {
  return buildDecisionHandoffUrl(href, decisionRecordForSpa(a), "spa");
}
