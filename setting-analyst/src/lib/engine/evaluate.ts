import {
  HIGH_BURDEN_CLASSES,
  LICENSE_TOKENS,
  REGION_BY_ID,
  SERVICE_CLASS_LABEL,
  TIER_LANGUAGE,
  VENUE_BY_ID,
  findProduct,
  findService,
} from "../data/catalog.ts";
import { decodeClaims } from "./claims.ts";
import {
  ASKED_NO_ANSWER,
  type Burden,
  type CostHorizon,
  type DeskInput,
  type Evaluation,
  type Posture,
  type Signal,
  type SignalState,
} from "./types.ts";
import { clamp, declined, filled, norm, quote, unique, wordCount } from "./text.ts";

const BURDEN_BASE: Record<DeskInput["serviceClass"], { base: number; note: string }> = {
  unselected: { base: 30, note: "Class unnamed — burden cannot be aimed until the service class is chosen." },
  facial: { base: 18, note: "Low structural burden; product identity still matters." },
  injectable: { base: 62, note: "Injectable class: dosing, product identity, and complication path carry the burden." },
  device: { base: 55, note: "Device class: settings, operator training, and skin-type screening carry the burden." },
  bodywork: { base: 14, note: "Low structural burden; scope and pressure consent still apply." },
  chemical: { base: 48, note: "Resurfacing class: depth, aftercare, and sun discipline carry the burden." },
  iv: { base: 58, note: "Infusion class: sterile technique and medical oversight carry the burden." },
  other: { base: 30, note: "Class unresolved, so burden is estimated conservatively." },
};

function hasTierLanguage(value: string): boolean {
  const n = norm(value);
  return TIER_LANGUAGE.some((t) => n.includes(t));
}

function hasLicenseToken(value: string): boolean {
  const n = norm(value);
  return LICENSE_TOKENS.some((t) => n.includes(t));
}

function fieldState(value: string, whenFilled: SignalState, whenEmpty: SignalState): SignalState {
  if (declined(value)) return "declined";
  if (filled(value)) return whenFilled;
  return whenEmpty;
}

function buildSignals(input: DeskInput): Signal[] {
  const high = HIGH_BURDEN_CLASSES.includes(input.serviceClass);
  const venue = VENUE_BY_ID[input.venue];
  const region = REGION_BY_ID[input.region];
  const signals: Signal[] = [];

  const menuTier = hasTierLanguage(input.menuLine);
  signals.push({
    id: "menu",
    label: "Menu identity",
    weight: 14,
    depth: "fast",
    state: declined(input.menuLine)
      ? "declined"
      : filled(input.menuLine)
        ? menuTier || wordCount(input.menuLine) < 2
          ? "partial"
          : "known"
        : "fail-closed",
    reading: declined(input.menuLine)
      ? "They declined to name the menu line. A refusal is recorded as worse than an omission, because it is."
      : filled(input.menuLine)
        ? menuTier
          ? `${quote(input.menuLine)} reads as a brand name, not a described service.`
          : `${quote(input.menuLine)} is a nameable line item that can be quoted back.`
        : "No menu line on the desk. The service being bought is unnamed.",
    ask: "Read me the exact menu line and what it includes, step by step.",
    why: "If the line cannot be quoted, nothing downstream can be checked against it.",
  });

  const classSettingMismatch = high && (venue.oversight === "none" || venue.oversight === "unknown");
  signals.push({
    id: "venue",
    label: "Setting type + oversight implied",
    weight: 14,
    depth: "fast",
    state:
      input.venue === "unclear"
        ? "fail-closed"
        : classSettingMismatch || venue.oversight === "mixed"
          ? "partial"
          : "known",
    reading:
      input.venue === "unclear"
        ? "Setting class unresolved. Spa, hotel spa, suite rental, med-spa, and clinic carry different oversight."
        : classSettingMismatch
          ? `${SERVICE_CLASS_LABEL[input.serviceClass]} offered in a ${venue.short.toLowerCase()} setting — a class/setting question that has to be explained, not assumed. ${venue.note}`
          : `${venue.label} named. ${venue.note}`,
    ask: "Which kind of setting is this, and under whose license does this specific service operate?",
    why: "Day spa, hotel spa, suite rental, mobile, med-spa, dental-adjacent, and clinic do not share a license story.",
  });

  signals.push({
    id: "region",
    label: "Jurisdiction named",
    weight: 8,
    depth: "fast",
    state: input.region === "unstated" ? "fail-closed" : input.region === "other" ? "partial" : "known",
    reading:
      input.region === "unstated"
        ? "No jurisdiction on the desk. Scope of practice, supervision rules, and the board you would search all depend on it."
        : `${region.label}. ${region.note}`,
    ask: "Which state or country licenses the person performing this, and which board issued that license?",
    why: "A license is checkable only against a named board.",
  });

  const performerBlob = `${input.performer} ${input.license}`;
  const licenseKnown = hasLicenseToken(performerBlob);
  signals.push({
    id: "performer",
    label: "Who performs it + license",
    weight: 18,
    depth: "fast",
    state: declined(input.performer)
      ? "declined"
      : filled(input.performer)
        ? licenseKnown
          ? "known"
          : "partial"
        : "fail-closed",
    reading: declined(input.performer)
      ? "They declined to name the person. Title shopping is not a substitute."
      : filled(input.performer)
        ? licenseKnown
          ? `Performer described with a license type (${input.performer.trim()}${filled(input.license) ? ` · ${input.license.trim()}` : ""}). Verifiable against the state board.`
          : `${quote(input.performer)} is a job title, not a license. Title does not establish scope.`
        : "The performing person is unnamed. This is the single most consequential gap.",
    ask: "What is the performer's license type and license number, so I can check the state board?",
    why: "A title is marketing. A license is checkable against the state board.",
  });

  const productTier = hasTierLanguage(input.product);
  const catalogProduct = filled(input.product) ? findProduct(input.product) ?? findService(input.product) : null;
  const silent = catalogProduct && "silent" in catalogProduct ? catalogProduct.silent : "";
  const vagueProduct =
    /unspecified|undisclosed|withheld|unnamed|not named|fat-freezing device|technology\b/i.test(input.product);
  const productState: SignalState = declined(input.product)
    ? "declined"
    : filled(input.product)
      ? productTier
        ? "fail-closed"
        : vagueProduct
          ? "partial"
          : "known"
      : "fail-closed";
  signals.push({
    id: "product",
    label: "Exact product / device",
    weight: 16,
    depth: "fast",
    state: productState,
    reading: declined(input.product)
      ? "They declined to name the product or device. Nothing about strength, clearance, or dilution can be checked."
      : filled(input.product)
        ? productTier
          ? `${quote(input.product)} is tier language, not a product. Treated as unresolved.`
          : vagueProduct
            ? `${quote(input.product)} is a category, not a printed name. Manufacturer, model, and indication stay unchecked.`
            : catalogProduct
            ? `${quote(input.product)} is a checkable name. ${silent}`
            : `${quote(input.product)} is a checkable name — manufacturer, indication, and labeling can be read independently.`
        : "No product or device named. Nothing about strength, clearance, or dilution can be checked.",
    ask: "What is the brand name printed on the box, vial, or device panel?",
    why: "Category evidence does not validate an unnamed device, formulation, or add-on.",
    note: silent || undefined,
  });

  const supervisionText = input.supervision;
  const onSite = /on site|onsite|present|in the building|same suite|named/i.test(supervisionText);
  const remote = /remote|telehealth|off site|offsite|phone|by chart|available by/i.test(supervisionText);
  signals.push({
    id: "supervision",
    label: "Oversight on site",
    weight: high ? 14 : 8,
    depth: "full",
    state: declined(supervisionText)
      ? "declined"
      : filled(supervisionText)
        ? onSite
          ? "known"
          : "partial"
        : high
          ? "fail-closed"
          : "partial",
    reading: declined(supervisionText)
      ? "They declined to name who supervises. For a class that usually requires it, that stays open."
      : filled(supervisionText)
        ? remote && !onSite
          ? `${quote(supervisionText)} describes availability, not presence.`
          : supervisionText.trim()
        : high
          ? "Medical oversight unstated for a class that usually requires it."
          : "Oversight unstated. Lower stakes here, still an open line.",
    ask: "Who supervises, and are they on site while my service is performed?",
    why: "A medical director on paper is not the same as a licensee in the building.",
  });

  const sanitationOk = /single[-\s]?use|sealed|autoclave|opened in front|new needle|sharps|log/i.test(input.sanitation);
  signals.push({
    id: "sanitation",
    label: "Sanitation signals",
    weight: 12,
    depth: "full",
    state: fieldState(input.sanitation, sanitationOk ? "known" : "partial", "fail-closed"),
    reading: declined(input.sanitation)
      ? "They declined to describe processing. Cleanliness of a room is decor, not a practice."
      : filled(input.sanitation)
        ? sanitationOk
          ? input.sanitation.trim()
          : `${quote(input.sanitation)} describes appearance more than procedure.`
        : "No sanitation practice described. Cleanliness of a room is decor, not a practice.",
    ask: "Is packaging opened in front of me, and how are reusable tools processed between clients?",
    why: "Single-use, sealed, autoclave, opened-in-front — those are practices. Scented towels are not.",
  });

  const afterNamed = /named|direct|cell|licensee|on call|physician|24/i.test(input.afterHours);
  const afterQueue = /voicemail|email|front desk|business hours|instagram|dm/i.test(input.afterHours);
  signals.push({
    id: "afterhours",
    label: "After-hours ownership",
    weight: 14,
    depth: "full",
    state: declined(input.afterHours)
      ? "declined"
      : filled(input.afterHours)
        ? afterNamed
          ? "known"
          : afterQueue
            ? "fail-closed"
            : "partial"
        : "fail-closed",
    reading: declined(input.afterHours)
      ? "They declined to name who owns the night. Treated as unresolved."
      : filled(input.afterHours)
        ? afterQueue
          ? `${quote(input.afterHours)} routes a possible complication to a queue. Treated as unresolved.`
          : input.afterHours.trim()
        : "Nobody owns the night. If something changes at 9pm, there is no named path.",
    ask: "If something changes tonight, which named licensed person do I reach, and how?",
    why: "A voicemail queue is not a complication pathway.",
  });

  const writtenConsent = /written|form|in advance|before payment|copy|chart|photo/i.test(input.consent);
  const verbalOnly = /verbal|orally|told me|no form/i.test(input.consent);
  signals.push({
    id: "consent",
    label: "Written consent + record",
    weight: 10,
    depth: "full",
    state: declined(input.consent)
      ? "declined"
      : filled(input.consent) && writtenConsent
        ? "known"
        : "partial",
    reading: declined(input.consent)
      ? "They declined to describe consent. Ask to read it before paying, not on the table."
      : filled(input.consent)
        ? verbalOnly
          ? `${quote(input.consent)} is not a record you can reconstruct next week.`
          : input.consent.trim()
        : "Consent process unstated. Ask to read it before paying, not on the table.",
    ask: "Can I read the consent form and keep a copy before I pay?",
    why: "A consultation you cannot reconstruct a week later might as well not have happened.",
  });

  return signals;
}

function scorePlace(signals: Signal[]): number {
  const total = signals.reduce((sum, s) => sum + s.weight, 0);
  const earned = signals.reduce((sum, s) => {
    if (s.state === "known") return sum + s.weight;
    if (s.state === "partial") return sum + s.weight * 0.45;
    return sum;
  }, 0);
  return clamp((earned / total) * 100, 0, 100);
}

function scorePromise(input: DeskInput, claims: ReturnType<typeof decodeClaims>): number {
  const text = `${input.marketing} ${input.menuLine}`.trim();
  if (!filled(text)) return 0;
  const claimLoad = claims.reduce((sum, c) => sum + (c.severity === "hard" ? 26 : c.severity === "flag" ? 16 : 8), 0);
  const identityCredit =
    (filled(input.product) && !hasTierLanguage(input.product) ? 14 : 0) +
    (hasLicenseToken(`${input.performer} ${input.license}`) ? 12 : 0) +
    (/\d/.test(text) && /\b(?:unit|ml|%|mg|joule|nm|session)\b/i.test(text) ? 10 : 0);
  const density = Math.min(40, Math.round((wordCount(text) > 6 ? 18 : 8) + claimLoad / 2));
  return clamp(density + claimLoad / 2 - identityCredit, 0, 100);
}

function scoreBurden(input: DeskInput, signals: Signal[], claims: ReturnType<typeof decodeClaims>): Burden {
  const base = BURDEN_BASE[input.serviceClass];
  const drivers = [base.note];
  let score = base.base;
  const venue = VENUE_BY_ID[input.venue];
  if (venue.burden) {
    score += venue.burden;
    drivers.push(`${venue.label}: ${venue.note}`);
  }
  if (HIGH_BURDEN_CLASSES.includes(input.serviceClass) && (venue.oversight === "none" || venue.oversight === "unknown")) {
    score += 14;
    drivers.push(
      `Higher-burden class in a ${venue.short.toLowerCase()} setting, where medical oversight is not implied by the name.`,
    );
  }
  if (input.region === "unstated") {
    score += 8;
    drivers.push("Jurisdiction unnamed, so there is no board to check the license against.");
  }
  const closed = signals.filter((s) => s.state === "fail-closed" || s.state === "declined").length;
  if (closed) {
    score += closed * 4;
    drivers.push(`${closed} fail-closed signal${closed > 1 ? "s" : ""} add verification work before booking.`);
  }
  if (filled(input.seriesPressure) && /\d/.test(input.seriesPressure)) {
    score += 8;
    drivers.push(`Series/maintenance commitment stated: ${input.seriesPressure.trim()}.`);
  }
  if (claims.some((c) => c.category === "Commitment structure")) {
    score += 6;
    drivers.push("Membership or prepay structure extends the commitment past one visit.");
  }
  if (claims.some((c) => c.category === "Permanence claim" || c.category === "Surgery synonym")) {
    score += 6;
    drivers.push("Permanence or facelift language usually conceals a maintenance schedule.");
  }
  score = clamp(score, 0, 100);
  return {
    score,
    band: score >= 70 ? "High" : score >= 45 ? "Moderate" : score >= 25 ? "Contained" : "Low",
    drivers,
  };
}

function postureFor(input: DeskInput, signals: Signal[], place: number): Posture {
  const hasAnything =
    filled(input.menuLine) ||
    filled(input.product) ||
    filled(input.performer) ||
    filled(input.marketing) ||
    input.region !== "unstated" ||
    input.venue !== "unclear" ||
    input.serviceClass !== "unselected";
  const failClosed = signals.filter((s) => s.state === "fail-closed" || s.state === "declined");
  if (!hasAnything) {
    return {
      key: "empty",
      label: "Desk empty",
      line: "Nothing on the desk yet. Four fields is enough to start.",
      next: "Name the menu line, the setting, the person, and the product.",
    };
  }
  if (failClosed.length === 0 && place >= 78) {
    return {
      key: "resolved",
      label: "Setting largely resolved",
      line: "The room answers most of the questions a booking should answer. Remaining items are verification, not discovery.",
      next: "Print the packet and take the residual questions into the consult.",
    };
  }
  if (failClosed.length <= 2) {
    return {
      key: "partial",
      label: "Partly resolved",
      line: "Enough is named to have a real conversation. The listed gaps are what that conversation is for.",
      next: "Ask the open questions out loud before you pay or consent.",
    };
  }
  return {
    key: "unresolved",
    label: "Setting unresolved — fail closed",
    line: "Too much of the setting is unnamed to treat marketing as information. These stay open until answered out loud.",
    next: "Do not let urgency do the work that information has not done.",
  };
}

function costHorizon(input: DeskInput): CostHorizon {
  const blob = `${input.price} ${input.seriesPressure}`;
  if (!filled(blob)) {
    return {
      stated: "No price on the desk.",
      reading: "The first number is rarely the whole number. Series, aftercare, and maintenance are part of the product.",
      annualHint: null,
      confidence: "unknown",
    };
  }
  const amounts = [...blob.matchAll(/\$\s?([\d,]+(?:\.\d+)?)/g)].map((m) => Number(m[1].replace(/,/g, "")));
  const sessions = blob.match(/(\d+)\s*(?:sessions?|visits?|treatments?|vials?|areas?)/i);
  const months = blob.match(/every\s+(\d+)\s*(?:months?|weeks?)/i) || blob.match(/(\d+)\s*[–-]\s*(\d+)\s*months/i);
  let annualHint: string | null = null;
  if (amounts.length && sessions) {
    const unit = amounts[0];
    const n = Number(sessions[1]);
    if (Number.isFinite(unit) && Number.isFinite(n) && n > 0) {
      const series = unit * n;
      annualHint = `If ${n} units/sessions at about $${unit.toLocaleString()} hold, the named course is about $${series.toLocaleString()} before travel, aftercare, or retreatment.`;
    }
  } else if (amounts.length && months) {
    const unit = amounts[0];
    const interval = Number(months[1]);
    if (interval > 0 && interval <= 12) {
      const perYear = Math.round((12 / interval) * unit);
      annualHint = `If retreatment every ${interval} month${interval > 1 ? "s" : ""} at about $${unit.toLocaleString()} holds, a rough year-one floor is about $${perYear.toLocaleString()} — still missing aftercare and add-ons.`;
    }
  }
  return {
    stated: blob.trim(),
    reading: annualHint
      ? "This is arithmetic on the numbers they already printed. It is not a quote, and it is not a recommendation."
      : "A number is on the desk. Series, maintenance, and what happens if you stop are still the rest of the receipt.",
    annualHint,
    confidence: annualHint ? "inferred-from-text" : "stated",
  };
}

function identityLine(input: DeskInput): string {
  const venue = VENUE_BY_ID[input.venue];
  const region = REGION_BY_ID[input.region];
  const hasAnything =
    filled(input.menuLine) ||
    filled(input.product) ||
    filled(input.performer) ||
    filled(input.marketing) ||
    input.region !== "unstated" ||
    input.venue !== "unclear" ||
    input.serviceClass !== "unselected";
  if (!hasAnything) return "No service on the desk";
  return [
    filled(input.menuLine) ? quote(input.menuLine) : "unnamed service",
    input.serviceClass === "unselected" ? "class not selected" : SERVICE_CLASS_LABEL[input.serviceClass].toLowerCase(),
    `in a ${venue.short.toLowerCase()} setting`,
    input.region === "unstated" ? "jurisdiction unnamed" : region.label,
  ].join(" · ");
}

export function evaluate(input: DeskInput): Evaluation {
  const signals = buildSignals(input);
  const claims = decodeClaims(`${input.marketing}\n${input.menuLine}\n${input.seriesPressure}\n${input.product}`);
  const place = scorePlace(signals);
  const promise = scorePromise(input, claims);
  const known = signals.filter((s) => s.state === "known");
  const failClosed = signals.filter((s) => s.state === "fail-closed");
  const declinedSignals = signals.filter((s) => s.state === "declined");
  const partial = signals.filter((s) => s.state === "partial");
  const closed = [...failClosed, ...declinedSignals];
  const unknowns = [...closed, ...partial].map((s) => `${s.label} — ${s.reading}`);
  const nextSteps = unique([
    ...closed.slice(0, 4).map((s) => s.ask),
    ...claims.filter((c) => c.severity === "hard").map((c) => c.ask),
    ...partial.slice(0, 2).map((s) => s.ask),
  ]).slice(0, 6);
  const weakest =
    closed.sort((a, b) => b.weight - a.weight)[0] ??
    partial.sort((a, b) => b.weight - a.weight)[0] ??
    null;

  return {
    input,
    signals,
    place,
    promise,
    gap: clamp(promise - place, -100, 100),
    burden: scoreBurden(input, signals, claims),
    claims,
    known,
    failClosed,
    declined: declinedSignals,
    unknowns,
    nextSteps,
    posture: postureFor(input, signals, place),
    identityLine: identityLine(input),
    weakest,
    costHorizon: costHorizon(input),
  };
}

export function isDeskActive(input: DeskInput): boolean {
  return (
    filled(input.menuLine) ||
    filled(input.product) ||
    filled(input.performer) ||
    filled(input.marketing) ||
    input.region !== "unstated" ||
    input.venue !== "unclear" ||
    input.serviceClass !== "unselected" ||
    declined(input.menuLine) ||
    declined(input.product) ||
    declined(input.performer)
  );
}

export { ASKED_NO_ANSWER };
