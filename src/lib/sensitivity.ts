/**
 * "What if this were named" rows.
 *
 * Education only. A row never invents a safer room — it shows how Place moves
 * if one currently-open item were actually named. The proposed text is an
 * example of a named answer, not a recommendation.
 */

import { assess, type Assessment, type EvalInput } from "./engine";

export type WhatIf = {
  field: string;
  label: string;
  current: "partial" | "fail-closed";
  proposed: string;
  example: string;
  placeBefore: number;
  placeAfter: number;
  delta: number;
  postureBefore: string;
  postureAfter: string;
  closes: boolean;
};

type Probe = {
  patch: (input: EvalInput) => Partial<EvalInput>;
  proposed: string;
  example: string;
};

const PROBES: Record<string, Probe> = {
  menu: {
    proposed: "If the menu named the actual service, areas, and units",
    example: "Botox Cosmetic, glabella + forehead, 40 units",
    patch: (i) => ({
      menuLine:
        i.menuLine.trim() && i.menuLine.trim().length > 12
          ? i.menuLine
          : "Botox Cosmetic, glabella + forehead, 40 units",
    }),
  },
  venue: {
    proposed: "If the setting were named as a medical clinic rather than left unclear",
    example: "Medical clinic / physician practice",
    patch: () => ({ venue: "clinic" }),
  },
  region: {
    proposed: "If a jurisdiction were named (example: Colorado)",
    example: "Colorado, US",
    patch: (i) => ({ region: i.region === "unstated" ? "us-co" : i.region }),
  },
  performer: {
    proposed: "If a licensed performer were named, with a checkable credential",
    example: "Nurse practitioner injector · NP, verifiable with the state board",
    patch: () => ({
      performer: "Nurse practitioner injector",
      license: "NP, verifiable with the state board",
    }),
  },
  product: {
    proposed: "If a specific product were named instead of a tier word",
    example: "Botox Cosmetic (onabotulinumtoxinA)",
    patch: (i) => ({
      product:
        i.product && !/proprietary|signature|medical[-\s]?grade|premium|house/i.test(i.product)
          ? i.product
          : "Botox Cosmetic (onabotulinumtoxinA)",
    }),
  },
  supervision: {
    proposed: "If a named medical director were on site during treatment",
    example: "Named medical director on site during treatment",
    patch: () => ({ supervision: "Named medical director on site during treatment" }),
  },
  sanitation: {
    proposed: "If single-use practice, opened in front of you, were described",
    example: "Single-use vial and needles; opened in front of me",
    patch: () => ({ sanitation: "Single-use vial and needles; opened in front of me" }),
  },
  afterhours: {
    proposed: "If a named licensee owned the night",
    example: "Named licensee cell line; 24/7 escalation documented",
    patch: () => ({ afterHours: "Named licensee cell line; 24/7 escalation documented" }),
  },
  consent: {
    proposed: "If written consent were provided before payment",
    example: "Written consent in advance; copy provided before payment",
    patch: () => ({ consent: "Written consent in advance; copy provided before payment" }),
  },
};

export function applyProbe(input: EvalInput, field: string): EvalInput {
  const probe = PROBES[field];
  if (!probe) return input;
  return { ...input, ...probe.patch(input) };
}

export function whatIfAll(input: EvalInput, base: Assessment): WhatIf[] {
  const open = base.signals.filter((s) => s.state !== "known");
  const rows: WhatIf[] = [];
  for (const signal of open) {
    const probe = PROBES[signal.id];
    if (!probe) continue;
    const next = applyProbe(input, signal.id);
    const ev = assess(next);
    const delta = Math.round(ev.place) - Math.round(base.place);
    rows.push({
      field: signal.id,
      label: signal.label,
      current: signal.state === "fail-closed" ? "fail-closed" : "partial",
      proposed: probe.proposed,
      example: probe.example,
      placeBefore: Math.round(base.place),
      placeAfter: Math.round(ev.place),
      delta,
      postureBefore: base.posture.label,
      postureAfter: ev.posture.label,
      closes: ev.signals.find((s) => s.id === signal.id)?.state === "known",
    });
  }
  return rows.sort((a, b) => b.delta - a.delta);
}
