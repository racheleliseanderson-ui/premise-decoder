import type { DeskInput, Evaluation } from "./types.ts";

export type ConsultQuestion = {
  id: string;
  group: string;
  text: string;
  why: string;
  priority: "critical" | "high" | "medium";
};

const CORE: ConsultQuestion[] = [
  { id: "exact-used", group: "Identity", text: "What exact product, device, formulation, wavelength, or protocol will be used — not the house name?", why: "A house name is marketing. A printed name is checkable.", priority: "critical" },
  { id: "who-performs", group: "Identity", text: "Who will actually perform it, what is their current license, and can I check the board?", why: "The person in the chair is not always the person on the website.", priority: "critical" },
  { id: "after-hours", group: "Risk", text: "If something changes tonight, which named licensed person do I reach, and how?", why: "A front-desk voicemail is not a complication pathway.", priority: "critical" },
  { id: "typical-result", group: "Outcome", text: "What result range do you see most often, at what time point — not the favorite photograph?", why: "Peak swelling is not the result.", priority: "high" },
  { id: "full-course", group: "Burden", text: "How many sessions, what interval, what downtime, what maintenance, and what happens if I stop?", why: "The maintenance schedule is part of the product.", priority: "high" },
  { id: "price-includes", group: "Burden", text: "What is included in the quoted price — consult, quantity, areas, follow-up, aftercare, complication management?", why: "Starting-at is not a receipt.", priority: "high" },
  { id: "advise-against", group: "Exit", text: "What would make you advise against this for me?", why: "A thoughtful provider can describe non-candidacy without reaching for the financing form.", priority: "high" },
  { id: "alternatives", group: "Exit", text: "What are the alternatives, including a smaller intervention, another opinion, and doing nothing for now?", why: "Desire is allowed. So is waiting.", priority: "medium" },
];

const BY_CLASS: Record<string, ConsultQuestion[]> = {
  injectable: [
    { id: "tox-units", group: "Neuromodulators", text: "Which product by name, and how many units for my areas?", why: "Brand and unit count are the minimum identity for a toxin plan.", priority: "critical" },
    { id: "show-vial", group: "Neuromodulators", text: "Will you show me the vial and the units?", why: "Seeing the labeled product is basic disclosure, not a favor.", priority: "high" },
    { id: "hyaluronidase", group: "Fillers", text: "Is hyaluronidase on site tonight, and who is licensed to inject it?", why: "Reversal capacity is a setting fact, not a personality trait.", priority: "critical" },
    { id: "plane", group: "Fillers", text: "Which product, how many syringes, and in which plane?", why: "Family name is not product identity.", priority: "high" },
  ],
  device: [
    { id: "device-model", group: "Devices", text: "Which device, which handpiece or module, and which settings for my skin?", why: "Platform families are not a single treatment.", priority: "critical" },
    { id: "skin-type", group: "Devices", text: "How do you screen my skin type and history before any energy is delivered?", why: "'Safe for everyone' is an unresolved screening claim.", priority: "critical" },
    { id: "indication", group: "Devices", text: "Is this use within the reviewed indication for this exact device?", why: "Clearance does not silently prove every nearby marketing claim.", priority: "high" },
  ],
  chemical: [
    { id: "acid", group: "Peels", text: "Which acid, at what percentage and pH, how many layers, and who reviews healing?", why: "Depth is the product.", priority: "critical" },
    { id: "sun", group: "Peels", text: "What is the sun-discipline window, and who do I call if I blister?", why: "Aftercare is not a PDF. It is a person.", priority: "high" },
  ],
  iv: [
    { id: "contents", group: "Infusions", text: "Exact contents and doses, who prescribed them, and which pharmacy compounded them?", why: "A drip is a prescription. A menu adjective is not.", priority: "critical" },
    { id: "monitor", group: "Infusions", text: "Who is physically present to monitor the line, and what is the emergency plan?", why: "A lounge is not a crash cart.", priority: "critical" },
  ],
  facial: [
    { id: "boosters", group: "Facials", text: "Which products by name, and what is actually in any booster or infusion?", why: "The add-on is often the unresolved product.", priority: "high" },
    { id: "tips", group: "Facials", text: "Are tips single-use and opened in front of me?", why: "A branded machine does not sterilize an unnamed booster.", priority: "medium" },
  ],
};

export function consultQuestions(input: DeskInput, evaluation: Evaluation): ConsultQuestion[] {
  const extra = BY_CLASS[input.serviceClass] ?? [];
  const fromGaps: ConsultQuestion[] = evaluation.failClosed.slice(0, 4).map((s) => ({
    id: `gap-${s.id}`,
    group: "Open on this desk",
    text: s.ask,
    why: s.why,
    priority: "critical" as const,
  }));
  const fromClaims: ConsultQuestion[] = evaluation.claims
    .filter((c) => c.severity !== "note")
    .slice(0, 3)
    .map((c, i) => ({
      id: `claim-${i}`,
      group: c.category,
      text: c.ask,
      why: c.hides,
      priority: (c.severity === "hard" ? "critical" : "high") as "critical" | "high",
    }));
  const seen = new Set<string>();
  const out: ConsultQuestion[] = [];
  for (const q of [...fromGaps, ...fromClaims, ...extra, ...CORE]) {
    if (seen.has(q.text)) continue;
    seen.add(q.text);
    out.push(q);
  }
  return out.slice(0, 14);
}
