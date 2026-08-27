import type { ClaimHit, ClaimSeverity } from "./types.ts";
import { filled } from "./text.ts";

type Pattern = {
  test: RegExp;
  category: string;
  hides: string;
  ask: string;
  severity: ClaimSeverity;
};

/** Claim lexicon. Original desk patterns plus editorial-grounded FDA and biologic flags. */
export const CLAIM_PATTERNS: Pattern[] = [
  {
    test: /medical[-\s]?grade|pharmaceutical[-\s]?grade|clinical[-\s]?strength/i,
    category: "Unregulated tier language",
    hides: "Implies a regulated tier that does not exist. It replaces the product or device name and its real regulatory status.",
    ask: "Which exact product or device, and what is its real regulatory status — FDA cleared, approved, or neither?",
    severity: "flag",
  },
  {
    test: /medical spa|medspa|med[-\s]?spa/i,
    category: "Setting label without oversight detail",
    hides: "The label does not say who the supervising licensee is or whether they are on site.",
    ask: "Who is the supervising medical licensee, and are they physically on site during my appointment?",
    severity: "flag",
  },
  {
    test: /permanent|permanently|forever|lifetime results|for good/i,
    category: "Permanence claim",
    hides: "Maintenance schedule, retreatment cost, and what happens when the effect fades.",
    ask: "What is the realistic duration, and what does upkeep cost per year?",
    severity: "hard",
  },
  {
    test: /non[-\s]?surgical facelift|nonsurgical facelift|liquid facelift/i,
    category: "Surgery synonym",
    hides: "A facelift is a surgical operation. Thread, filler, or energy language borrowing the word conceals duration, reversibility, and what tissue actually moves.",
    ask: "What tissue is expected to change, by how much, when it peaks, and how long it usually lasts?",
    severity: "hard",
  },
  {
    test: /guarantee|guaranteed|money[-\s]?back|risk[-\s]?free|zero risk/i,
    category: "Certainty claim",
    hides: "An outcome guarantee is not a clinical claim. Measurement method and accountable party stay unnamed.",
    ask: "What specifically is guaranteed, measured how, and by whom?",
    severity: "hard",
  },
  {
    test: /today only|expires|last chance|limited spots|flash|book now to lock/i,
    category: "Time pressure",
    hides: "Urgency pressure on an elective medical decision. Time to read consent and verify credentials.",
    ask: "Is this price still available after a proper consultation, or only under time pressure?",
    severity: "flag",
  },
  {
    test: /special|\$?\d+\s?(?:per|\/)\s?(?:unit|area)|deal|discount|package of \d+|bogo/i,
    category: "Price-led framing",
    hides: "Product identity, units, dilution, and who performs the service.",
    ask: "Which product, how many units, and which licensed person administers it?",
    severity: "note",
  },
  {
    test: /detox|toxin release|boost(?:s)? immunity|immune boost|reset your|cellular renewal|lymphatic drainage cures/i,
    category: "Mechanism language without a mechanism",
    hides: "Mechanism claims with thin evidence. What is measured, how, and by whom remains unspoken.",
    ask: "What is the specific mechanism claim, and what evidence supports it for this outcome?",
    severity: "flag",
  },
  {
    test: /instant|immediate results|walk out (?:looking|glowing)|see results in one|no downtime/i,
    category: "Timeline compression",
    hides: "Swelling, settling period, and the honest review window.",
    ask: "When is the follow-up review, and what does it cost?",
    severity: "note",
  },
  {
    test: /FDA[-\s]?approved/i,
    category: "Regulatory borrowing — approved",
    hides: "Premarket approval is tied to a defined device and intended use. It is not a universal certificate for every body area, protocol, or spa promise.",
    ask: "Approved for exactly which indication, and does that match what you are proposing for me?",
    severity: "flag",
  },
  {
    test: /FDA[-\s]?cleared/i,
    category: "Regulatory borrowing — cleared",
    hides: "510(k) clearance means substantial equivalence to a predicate. It does not mean best in category, risk-free, or proven for every nearby marketing claim.",
    ask: "Cleared for which indication, on which exact device, and does that match this protocol?",
    severity: "flag",
  },
  {
    test: /FDA[-\s]?registered|FDA[-\s]?listed/i,
    category: "Regulatory borrowing — registered/listed",
    hides: "Registration and listing do not denote approval, clearance, or authorization of the establishment or its devices.",
    ask: "Are you describing establishment registration, or a premarket review of this exact device and use?",
    severity: "hard",
  },
  {
    test: /clinically proven|clinically tested|clinical studies show/i,
    category: "Evidence halo",
    hides: "A study of a category does not automatically validate this device, formulation, setting, protocol, or promised result.",
    ask: "Which study, on which exact product or device, in which population, measuring what, at what time point?",
    severity: "flag",
  },
  {
    test: /exosome|pdrn|stem cell|growth[-\s]?factor booster|regenerative (?:booster|add-?on|glow)/i,
    category: "Unnamed biologic add-on",
    hides: "Source, contents, processing, and regulatory status of the add-on. Barrier-crossing delivery makes the unnamed add-on the actual product.",
    ask: "What is the exact product name, source, and regulatory status of what you are putting on or in my skin?",
    severity: "hard",
  },
  {
    test: /(?:award|voted|#1|best in|celebrity|as seen)/i,
    category: "Reputation substitution",
    hides: "Credentials, medical director identity, and the written complication protocol.",
    ask: "Who is the medical director, and can I verify credentials and the complication protocol?",
    severity: "note",
  },
  {
    test: /painless|gentle enough for anyone|safe for everyone|all skin types, no exceptions|all skin types/i,
    category: "Universality claim",
    hides: "Screening, especially for light and energy on deeper tones, and the intake conversation.",
    ask: "What device and settings, and how do you screen my skin type and history first?",
    severity: "flag",
  },
  {
    test: /membership|auto[-\s]?renew|prepay|credits expire|subscription/i,
    category: "Commitment structure",
    hides: "Exit terms, refund policy, and what happens to unused sessions.",
    ask: "What are the written cancellation and unused-credit terms?",
    severity: "flag",
  },
  {
    test: /signature|proprietary protocol|proprietary blend|our own blend|house blend|proprietary/i,
    category: "Signature / proprietary language",
    hides: "The actual products, concentrations, device settings, or ingredients inside the name.",
    ask: "What are the actual products, concentrations, or device settings in it?",
    severity: "flag",
  },
  {
    test: /injection specialist|aesthetic provider|skin expert|master injector|skin specialist|laser technician/i,
    category: "Title without defined scope",
    hides: "A title with no defined scope. License, board, and supervising physician stay unnamed.",
    ask: "What is your license, and who is the supervising physician?",
    severity: "flag",
  },
  {
    test: /customized just for you|custom protocol|tailored to you/i,
    category: "Customization claim",
    hides: "Whether assessment changes anything, who performs it, and what actually varies.",
    ask: "Customized based on what assessment, by whom, and what changes for my case?",
    severity: "note",
  },
];

export function decodeClaims(text: string): ClaimHit[] {
  if (!filled(text)) return [];
  const hits: ClaimHit[] = [];
  const sentences = text.split(/(?<=[.!?;])\s+|\n+/).filter((s) => s.trim());
  for (const pattern of CLAIM_PATTERNS) {
    const quoted = sentences.find((s) => pattern.test.test(s)) ?? (pattern.test.test(text) ? text : null);
    if (quoted) {
      hits.push({
        phrase: quoted.trim().slice(0, 180),
        category: pattern.category,
        hides: pattern.hides,
        ask: pattern.ask,
        severity: pattern.severity,
      });
    }
  }
  return hits;
}
