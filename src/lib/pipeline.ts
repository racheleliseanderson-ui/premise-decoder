/**
 * Pipeline model — explicit run controls.
 *
 * The desk does not quietly decide things in the background. Each stage is
 * named, its state is derived from what is actually on the desk, and the reader
 * can run stages one at a time or end to end. Nothing here fabricates a value;
 * a stage that cannot resolve reports that it cannot.
 */

import type { Assessment, EvalInput } from "./engine";
import { isNoAnswer } from "./engine.ts";
import type { Evidence } from "./session";

export type StageId = "intake" | "identify" | "agency" | "practice" | "decode" | "score";

/**
 * No "running" state. Stage evaluation is synchronous and pure — there is no
 * point at which a stage is in flight — and the state existed only to be
 * rendered by a spinner nothing could ever trigger.
 */
export type StageState = "idle" | "clear" | "gaps" | "blocked";

export interface StageDef {
  id: StageId;
  index: number;
  name: string;
  what: string;
  /** Mode the reader is sent to when this stage needs work. */
  mode: string;
}

export const STAGE_DEFS: StageDef[] = [
  {
    id: "intake",
    index: 0,
    name: "Intake",
    what: "Pasted source material on the desk",
    mode: "intake",
  },
  {
    id: "identify",
    index: 1,
    name: "Identify",
    what: "Service, setting, jurisdiction, product",
    mode: "fast",
  },
  {
    id: "agency",
    index: 2,
    name: "Agency",
    what: "Who performs it, under which licence",
    mode: "full",
  },
  {
    id: "practice",
    index: 3,
    name: "Practice",
    what: "Oversight, sanitation, night cover, consent",
    mode: "full",
  },
  {
    id: "decode",
    index: 4,
    name: "Decode",
    what: "Marketing text read for pattern",
    mode: "decode",
  },
  {
    id: "score",
    index: 5,
    name: "Score",
    what: "Where it lands, what it takes to check, what to take with you",
    mode: "packet",
  },
];

export interface StageStatus {
  def: StageDef;
  state: StageState;
  /** Short, literal reading of the stage. */
  line: string;
  /** Signals or fields still open in this stage. */
  open: string[];
  refused: number;
}

const SIGNALS_BY_STAGE: Record<StageId, string[]> = {
  intake: [],
  identify: ["menu", "venue", "region", "product"],
  agency: ["performer"],
  practice: ["supervision", "sanitation", "afterhours", "consent"],
  decode: [],
  score: [],
};

const REFUSABLE: (keyof EvalInput)[] = [
  "menuLine",
  "product",
  "performer",
  "license",
  "supervision",
  "sanitation",
  "afterHours",
  "consent",
];

export function stageStatuses(
  a: Assessment,
  evidence: Record<string, Evidence>,
  /**
   * Kept in the signature for the existing call site, and typed `null` so a
   * caller cannot pass a stage id and expect it to do something.
   */
  _running?: null,
): StageStatus[] {
  const input = a.input;
  const extracted = Object.values(evidence).filter((e) => e.origin === "extracted").length;
  const refusedFields = REFUSABLE.filter((f) => isNoAnswer(String(input[f] ?? ""))).length;

  return STAGE_DEFS.map((def) => {
    if (def.id === "intake") {
      const has = extracted > 0 || input.marketing.trim().length > 8;
      return {
        def,
        state: has ? ("clear" as StageState) : ("idle" as StageState),
        line: has
          ? `${extracted || "0"} field${extracted === 1 ? "" : "s"} filled from pasted material.`
          : "Nothing pasted yet. Typing the fields yourself is equally valid.",
        open: [],
        refused: 0,
      };
    }

    if (def.id === "decode") {
      const hard = a.claims.filter((c) => c.severity === "hard").length;
      return {
        def,
        state: !input.marketing.trim()
          ? "idle"
          : hard
            ? "blocked"
            : a.claims.length
              ? "gaps"
              : "clear",
        line: !input.marketing.trim()
          ? "No marketing text on the desk to read."
          : hard
            ? `${hard} hard flag${hard > 1 ? "s" : ""} in the text as written.`
            : a.claims.length
              ? `${a.claims.length} pattern${a.claims.length > 1 ? "s" : ""} worth a question.`
              : "Read, no pattern caught. Absence of flags is not endorsement.",
        open: a.claims.slice(0, 3).map((c) => c.category),
        refused: 0,
      };
    }

    if (def.id === "score") {
      return {
        def,
        state:
          a.posture.key === "empty"
            ? "idle"
            : refusedFields
              ? "blocked"
              : a.failClosed.length
                ? "gaps"
                : "clear",
        line:
          a.posture.key === "empty"
            ? "Nothing to score yet."
            : `${a.place}% of the setting resolved · burden ${a.burden.band.toLowerCase()} · ${a.failClosed.length} unnamed${refusedFields ? ` · ${refusedFields} asked and declined` : ""}.`,
        open: [],
        refused: refusedFields,
      };
    }

    const ids = SIGNALS_BY_STAGE[def.id];
    const sigs = a.signals.filter((s) => ids.includes(s.id));
    const open = sigs.filter((s) => s.state !== "known");
    const refused = sigs.filter((s) => s.refused).length;
    return {
      def,
      state: !sigs.length ? "idle" : refused ? "blocked" : open.length ? "gaps" : "clear",
      line: refused
        ? `${refused} question${refused > 1 ? "s" : ""} asked and declined.`
        : open.length
          ? `${open.length} of ${sigs.length} still open.`
          : `All ${sigs.length} resolved on this stage.`,
      open: open.map((s) => s.label),
      refused,
    };
  });
}

export const STAGE_TONE: Record<StageState, string> = {
  idle: "chip",
  clear: "chip chip-known",
  gaps: "chip chip-partial",
  blocked: "chip chip-fail",
};

export const STAGE_WORD: Record<StageState, string> = {
  idle: "Not started",
  clear: "Clear",
  gaps: "Open items",
  blocked: "Blocked",
};
