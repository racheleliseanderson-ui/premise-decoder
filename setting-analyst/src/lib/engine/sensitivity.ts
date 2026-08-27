import { evaluate } from "./evaluate.ts";
import type { DeskInput, Evaluation, Signal } from "./types.ts";

export type WhatIf = {
  field: Signal["id"];
  label: string;
  current: Signal["state"];
  proposed: string;
  placeBefore: number;
  placeAfter: number;
  delta: number;
  postureBefore: string;
  postureAfter: string;
  closes: boolean;
};

const PROBES: Record<string, (input: DeskInput) => DeskInput> = {
  menu: (i) => ({ ...i, menuLine: i.menuLine || "Named menu line: full-face neuromodulator, areas listed" }),
  venue: (i) => ({ ...i, venue: "clinic" }),
  region: (i) => ({ ...i, region: i.region === "unstated" ? "us-co" : i.region }),
  performer: (i) => ({
    ...i,
    performer: "Nurse practitioner injector",
    license: "NP, verifiable with the state board",
  }),
  product: (i) => ({ ...i, product: i.product && !/proprietary|signature|medical[-\s]?grade/i.test(i.product) ? i.product : "Botox Cosmetic (onabotulinumtoxinA)" }),
  supervision: (i) => ({ ...i, supervision: "Named medical director on site during treatment" }),
  sanitation: (i) => ({ ...i, sanitation: "Single-use vial and needles; opened in front of me" }),
  afterhours: (i) => ({ ...i, afterHours: "Named licensee cell line; 24/7 escalation documented" }),
  consent: (i) => ({ ...i, consent: "Written consent in advance; copy provided before payment" }),
};

export function whatIfAll(input: DeskInput, base: Evaluation): WhatIf[] {
  const open = base.signals.filter((s) => s.state !== "known");
  const rows: WhatIf[] = [];
  for (const signal of open) {
    const probe = PROBES[signal.id];
    if (!probe) continue;
    const next = probe(input);
    const ev = evaluate(next);
    const delta = ev.place - base.place;
    rows.push({
      field: signal.id,
      label: signal.label,
      current: signal.state,
      proposed: describeProbe(signal.id),
      placeBefore: base.place,
      placeAfter: ev.place,
      delta,
      postureBefore: base.posture.label,
      postureAfter: ev.posture.label,
      closes: ev.signals.find((s) => s.id === signal.id)?.state === "known",
    });
  }
  return rows.sort((a, b) => b.delta - a.delta);
}

function describeProbe(id: string): string {
  switch (id) {
    case "menu":
      return "If the menu line named the actual service, areas, and units";
    case "venue":
      return "If this were a named medical clinic rather than an unresolved setting";
    case "region":
      return "If a US state were named (example: Colorado)";
    case "performer":
      return "If a nurse practitioner injector with a checkable license were named";
    case "product":
      return "If a specific product (example: Botox Cosmetic) were named instead of tier language";
    case "supervision":
      return "If a named medical director were on site";
    case "sanitation":
      return "If single-use, opened-in-front practice were described";
    case "afterhours":
      return "If a named licensee owned the night";
    case "consent":
      return "If written consent were provided before payment";
    default:
      return "If this field were actually named";
  }
}

export function applyProbe(input: DeskInput, field: string): DeskInput {
  return PROBES[field] ? PROBES[field](input) : input;
}
