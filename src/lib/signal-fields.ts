/**
 * Which input fields feed which scored signal — in one direction, once.
 *
 * This used to be two hand-maintained maps in two components, pointing opposite
 * ways, with a comment in one of them admitting the arrangement was a drift
 * hazard and that fixing it needed a module in `lib/`. This is that module. Add
 * a signal here and both the evidence rail and the inline catalog note find it.
 */

import type { EvalInput } from "./engine";

/** signal id → the input fields that can resolve it. */
export const SIGNAL_FIELDS: Record<string, (keyof EvalInput)[]> = {
  menu: ["menuLine"],
  venue: ["venue"],
  region: ["region"],
  product: ["product"],
  performer: ["performer", "license"],
  supervision: ["supervision"],
  sanitation: ["sanitation"],
  afterhours: ["afterHours"],
  consent: ["consent"],
  aftercare: ["aftercare"],
  complication: ["complication"],
  followup: ["followup"],
  cost: ["price", "seriesPressure"],
};

/**
 * field → signal id. Derived, never typed out again.
 *
 * `performer` and `license` both land on `performer`; the first signal that
 * claims a field owns it, which matches the order above.
 */
export const SIGNAL_OF_FIELD: Partial<Record<keyof EvalInput, string>> = (() => {
  const out: Partial<Record<keyof EvalInput, string>> = {};
  for (const [signal, fields] of Object.entries(SIGNAL_FIELDS)) {
    for (const f of fields) if (!out[f]) out[f] = signal;
  }
  return out;
})();
