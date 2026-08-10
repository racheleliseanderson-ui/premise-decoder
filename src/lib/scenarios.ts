import { emptyInput, type EvalInput } from "./engine";

export interface Scenario {
  id: string;
  title: string;
  note: string;
  expected: string;
  input: EvalInput;
}

export const SCENARIOS: Scenario[] = [
  {
    id: "botox-special",
    title: "“Botox special — today only” · day spa",
    note: "High-burden injectable in a day-spa setting with weak oversight and identity gaps.",
    expected: "Expect: fail-closed on product, performer, after-hours.",
    input: {
      ...emptyInput,
      serviceClass: "injectable",
      venue: "day-spa",
      menuLine: "Botox special",
      product: "",
      performer: "Injection specialist",
      price: "$9 per unit",
      afterHours: "Front desk voicemail during business hours",
      seriesPressure: "Rebook every 3 months, prepay 4 sessions",
      marketing:
        "Botox special — today only! $9 per unit with our injection specialist. Painless, no downtime, walk out looking refreshed. Voted best in the valley.",
    },
  },
  {
    id: "named-filler",
    title: "Named HA filler + RN injector · med-spa",
    note: "Usable path: product and performer resolved; facility questions remain honest.",
    expected: "Expect: mostly known, residual unknowns on consent and night cover.",
    input: {
      ...emptyInput,
      serviceClass: "injectable",
      venue: "med-spa",
      menuLine: "Hyaluronic acid filler, 1 syringe, nasolabial folds",
      product: "Juvéderm Ultra XC, 1.0 mL",
      performer: "RN injector",
      license: "RN, license number provided on request",
      price: "$680 per syringe",
      supervision: "Supervising physician on site Tuesdays and Thursdays",
      sanitation: "Single-use needles opened in front of the client; sharps log kept",
      afterHours: "Direct cell line to the injecting RN for 72 hours",
      consent: "Written consent provided by email before the appointment",
      marketing:
        "One syringe of Juvéderm Ultra XC placed by our RN injector, with a physician on site. Results typically last 9–12 months.",
    },
  },
  {
    id: "medical-grade-peel",
    title: "Unnamed “medical-grade” peel",
    note: "Agent identity gap plus tier language with no verified standard.",
    expected: "Expect: product fail-closed on tier language alone.",
    input: {
      ...emptyInput,
      serviceClass: "chemical",
      venue: "unclear",
      menuLine: "Signature medical-grade resurfacing peel",
      product: "Medical-grade proprietary blend",
      performer: "Skin expert",
      price: "$185",
      sanitation: "Spotless, beautiful treatment rooms",
      marketing:
        "Our signature medical-grade peel uses a proprietary clinical-strength blend for instant results. Safe for all skin types.",
    },
  },
  {
    id: "laser-permanence",
    title: "Permanent laser hair package pressure",
    note: "Permanence and guarantee marketing with an unnamed device and series pressure.",
    expected: "Expect: hard flags on permanence and guarantee.",
    input: {
      ...emptyInput,
      serviceClass: "device",
      venue: "med-spa",
      menuLine: "Permanent laser hair removal — 6 session package",
      product: "",
      performer: "Laser technician",
      price: "$1,450 package of 6",
      supervision: "Medical director available by phone",
      afterHours: "Instagram DM",
      seriesPressure: "6 sessions, then annual touch-ups",
      marketing:
        "Permanent laser hair removal, guaranteed smooth skin forever. FDA-approved technology. Limited spots at this price — book now to lock it in.",
    },
  },
  {
    id: "iv-membership",
    title: "IV immunity membership",
    note: "Limited-evidence class, detox and immunity marketing, hard membership pressure.",
    expected: "Expect: mechanism language flagged, commitment structure flagged.",
    input: {
      ...emptyInput,
      serviceClass: "iv",
      venue: "day-spa",
      menuLine: "Immunity Boost IV drip",
      product: "Custom blend vitamin cocktail",
      performer: "Wellness technician",
      price: "$149 / month membership",
      afterHours: "Email the studio",
      seriesPressure: "Monthly auto-renew, credits expire in 60 days",
      marketing:
        "Our Immunity Boost drip floods your cells to detox and reset your system. Boosts immunity instantly. Auto-renewing membership, cancel anytime*.",
    },
  },
];
