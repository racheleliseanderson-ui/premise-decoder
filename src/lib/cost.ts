/**
 * What this actually costs.
 *
 * The desk has always had two free-text fields with money in them — `price` and
 * `seriesPressure` — and has never read a number out of either. It could tell
 * you that a room had not named its injector and stayed silent about the fact
 * that the room had also not named what happens to the four sessions you paid
 * for and did not use.
 *
 * This module reads those fields and does exactly as much arithmetic as the
 * words support, then stops. That last part is the whole design. Every
 * consumer-facing cost calculator in this category produces a confident annual
 * figure by assuming the parts it was not told, and the assumption is always
 * the flattering one. A projection here has a FLOOR — what is certainly owed
 * given what has been named — and it has a year-one number only when every
 * input needed for that number is on the desk. When it is not, `yearOne` is
 * null and `blockedBy` says which sentence is missing.
 *
 * The same fail-closed grammar the signals use, pointed at money:
 *
 *   named     the copy says it, and we quote it back
 *   derived   arithmetic on named things, and the row says which
 *   unknown   nobody said, and the total refuses to move without it
 *
 * Nothing here is a price guide. The desk does not know what anything should
 * cost and does not have an opinion about it. It knows what this room has
 * committed to in writing and what it has left for later.
 */

import { NO_ANSWER, isNoAnswer, type EvalInput } from "./engine.ts";

/* ------------------------------------------------------------- shapes */

/** What the quoted number is a price FOR. Null means the copy did not say. */
export type CostUnit =
  | "session"
  | "unit"
  | "syringe"
  | "vial"
  | "area"
  | "course"
  | "month"
  | "hour"
  | null;

export const UNIT_LABEL: Record<NonNullable<CostUnit>, string> = {
  session: "per session",
  unit: "per unit",
  syringe: "per syringe",
  vial: "per vial",
  area: "per area",
  course: "for the whole course",
  month: "per month",
  hour: "per hour",
};

/**
 * A unit whose total depends on a quantity nobody has stated yet.
 *
 * "$12 per unit" is not a price. It is a rate, and the number of units is
 * decided by the person holding the syringe, after you have agreed to the rate.
 * This set is why `floor` and `entry` can diverge from `quoted`.
 */
const RATE_UNITS = new Set<NonNullable<CostUnit>>(["unit", "syringe", "vial", "area", "hour"]);

export const isRateUnit = (u: CostUnit): boolean => u !== null && RATE_UNITS.has(u);

/** One thing the copy said about money, with the sentence it said it in. */
export interface CostQuote {
  /** Which part of the shape this sentence produced. */
  field: string;
  /** The sentence, verbatim, clipped. */
  text: string;
}

export interface CostShape {
  /** The headline number, as printed. Null when no number was found. */
  quoted: number | null;
  /** The symbol or code as printed, so the desk never converts a currency. */
  currency: string;
  unit: CostUnit;
  /** Sessions in the package or course, when the copy counts them. */
  sessions: number | null;
  /** Quantity of a rate unit, when stated ("20 units", "2 syringes"). */
  quantity: number | null;
  deposit: number | null;
  /** True / false only when the copy says so. Null is the common case. */
  depositRefundable: boolean | null;
  /** Notice required to cancel without losing money, in hours. */
  cancellationHours: number | null;
  /** How long prepaid sessions survive before they evaporate. */
  creditsExpireDays: number | null;
  /** Months between maintenance visits, when the copy commits to an interval. */
  maintenanceIntervalMonths: number | null;
  /** A recurring charge that continues whether or not you book. */
  membershipMonthly: number | null;
  /** Whether the copy uses "starting at" / "from" — a floor, not a price. */
  fromPrice: boolean;
  /** Whether a consultation fee is named, and whether it is credited back. */
  consultFee: number | null;
  consultCredited: boolean | null;
  quotes: CostQuote[];
  /** Money questions this copy leaves open, in the order they cost you. */
  unknowns: string[];
  /** True when the reader asked about money and was declined. */
  refused: boolean;
}

export const emptyCost: CostShape = {
  quoted: null,
  currency: "",
  unit: null,
  sessions: null,
  quantity: null,
  deposit: null,
  depositRefundable: null,
  cancellationHours: null,
  creditsExpireDays: null,
  maintenanceIntervalMonths: null,
  membershipMonthly: null,
  fromPrice: false,
  consultFee: null,
  consultCredited: null,
  quotes: [],
  unknowns: [],
  refused: false,
};

/* -------------------------------------------------------------- parsing */

const clip = (s: string, n = 160) => {
  const t = s.trim().replace(/\s+/g, " ");
  return t.length > n ? `${t.slice(0, n - 1)}…` : t;
};

/** Split into sentences so a quote can be attributed to the line that made it. */
const sentences = (text: string) =>
  text
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((s) => s.trim())
    .filter(Boolean);

const NUM = String.raw`\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?`;

/** `$1,200` · `£95` · `€120` · `1200 USD` · `95 dollars`. */
const MONEY_RE = new RegExp(
  String.raw`(?:([$£€])\s?(${NUM}))|(?:(${NUM})\s?(?:usd|gbp|eur|dollars?|pounds?|euros?))`,
  "i",
);

const MONEY_RE_G = new RegExp(MONEY_RE.source, "gi");

const toNumber = (s: string) => {
  const n = Number(s.replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
};

/** Read the first money amount out of a fragment, with its symbol. */
function readMoney(text: string): { value: number; currency: string } | null {
  const m = MONEY_RE.exec(text);
  if (!m) return null;
  const symbol = m[1] ?? "";
  const raw = m[2] ?? m[3];
  if (!raw) return null;
  const value = toNumber(raw);
  if (value === null) return null;
  const code = /usd|dollars?/i.test(text) ? "$" : /gbp|pounds?/i.test(text) ? "£" : /eur|euros?/i.test(text) ? "€" : "";
  return { value, currency: symbol || code };
}

/** Every money amount in a fragment, largest first is NOT assumed — order kept. */
function readAllMoney(text: string): number[] {
  const out: number[] = [];
  for (const m of text.matchAll(MONEY_RE_G)) {
    const raw = m[2] ?? m[3];
    if (!raw) continue;
    const v = toNumber(raw);
    if (v !== null) out.push(v);
  }
  return out;
}

const UNIT_PATTERNS: { re: RegExp; unit: NonNullable<CostUnit> }[] = [
  { re: /\b(?:per|a|each|\/)\s?(?:syringe|vial of filler)\b/i, unit: "syringe" },
  { re: /\b(?:per|a|each|\/)\s?vial\b/i, unit: "vial" },
  { re: /\b(?:per|a|each|\/)\s?unit\b/i, unit: "unit" },
  { re: /\b(?:per|a|each|\/)\s?(?:treatment )?area\b/i, unit: "area" },
  { re: /\b(?:per|a|each|\/)\s?(?:session|treatment|visit|appointment)\b/i, unit: "session" },
  { re: /\b(?:per|a|each|\/)\s?(?:hour|hr)\b/i, unit: "hour" },
  { re: /\b(?:per|a|each|\/)\s?(?:month|mo)\b/i, unit: "month" },
  { re: /\b(?:for the |the )?(?:whole |full |entire |complete )?(?:course|package|series|programme|program)\b/i, unit: "course" },
];

const SESSION_COUNT_RE =
  /\b(?:package|series|course|programme|program|set)\s+of\s+(\d{1,2})\b|\b(\d{1,2})[-\s](?:session|treatment|visit)s?\b|\b(\d{1,2})\s+(?:session|treatment|visit)s?\b/i;

const DEPOSIT_RE = /\bdeposit\b/i;
const NONREFUNDABLE_RE = /\bnon[-\s]?refundable\b|\bnot refundable\b|\bno refunds?\b/i;
const REFUNDABLE_RE = /\brefundable\b|\brefunded\b|\bapplied to (?:your |the )?(?:treatment|balance|service)\b|\bgoes toward\b|\bcredited (?:to|toward)\b/i;

const CANCEL_RE =
  /\b(\d{1,3})\s?(?:-|\s)?(hour|hr|hours|hrs|day|days|business day|business days|week|weeks)\b[^.;]{0,40}\b(?:notice|cancel\w*|reschedul\w*)\b|\b(?:cancel\w*|reschedul\w*)\b[^.;]{0,40}\b(\d{1,3})\s?(?:-|\s)?(hour|hr|hours|hrs|day|days|week|weeks)\b/i;

const EXPIRY_RE =
  /\b(?:credits?|sessions?|packages?|treatments?|visits?)\b[^.;]{0,40}\bexpire\w*\b[^.;]{0,30}?\b(\d{1,3})\s?(day|days|week|weeks|month|months|year|years)\b|\bexpire\w*\b[^.;]{0,30}?\b(\d{1,3})\s?(day|days|week|weeks|month|months|year|years)\b/i;

const MAINTENANCE_RE =
  /\b(?:maintenance|touch[-\s]?up|top[-\s]?up|repeat|retreat\w*|refresh\w*|again)\b[^.;]{0,50}?\bevery\s+(\d{1,2})(?:\s?(?:-|–|to)\s?(\d{1,2}))?\s?(week|weeks|month|months|year|years)\b|\bevery\s+(\d{1,2})(?:\s?(?:-|–|to)\s?(\d{1,2}))?\s?(week|weeks|month|months|year|years)\b[^.;]{0,30}?\b(?:maintenance|touch[-\s]?up|top[-\s]?up|to maintain)\b/i;

const ANNUAL_MAINT_RE = /\b(?:annual\w*|yearly|once a year|every year)\b[^.;]{0,30}\b(?:maintenance|touch[-\s]?up|top[-\s]?up)\b|\b(?:maintenance|touch[-\s]?up|top[-\s]?up)\b[^.;]{0,30}\b(?:annual\w*|yearly|once a year|every year)\b/i;

const MEMBERSHIP_RE = /\b(?:members?hip|monthly|per month|\/mo\b|auto[-\s]?renew\w*|subscription)\b/i;

const CONSULT_RE = /\bconsult\w*\b/i;

const QUANTITY_RE =
  /\b(\d{1,3})\s?(?:units?|syringes?|vials?|areas?)\b/i;

const FROM_PRICE_RE = /\b(?:starting at|starts at|from as little as|from just|prices? from|as low as)\b|\bfrom\s+[$£€]/i;

const toMonths = (n: number, word: string): number => {
  const w = word.toLowerCase();
  if (w.startsWith("week")) return Math.round((n / 4.345) * 10) / 10;
  if (w.startsWith("year")) return n * 12;
  return n;
};

const toHours = (n: number, word: string): number => {
  const w = word.toLowerCase();
  if (w.startsWith("day")) return n * 24;
  if (w.startsWith("week")) return n * 168;
  return n;
};

const toDays = (n: number, word: string): number => {
  const w = word.toLowerCase();
  if (w.startsWith("week")) return n * 7;
  if (w.startsWith("month")) return Math.round(n * 30.4);
  if (w.startsWith("year")) return n * 365;
  return n;
};

/**
 * Read a cost shape out of whatever the reader pasted.
 *
 * Three fields are read, in a deliberate order of trust: `price` is what the
 * reader was quoted, `seriesPressure` is what they were told about the course,
 * and `marketing` is the advertisement — read last, and only for the terms that
 * are almost never in the quote (expiry, cancellation, membership), because a
 * number in an advertisement is the least binding number in the room.
 */
export function parseCost(input: Pick<EvalInput, "price" | "seriesPressure" | "marketing">): CostShape {
  const refused = isNoAnswer(input.price) || isNoAnswer(input.seriesPressure);
  const price = isNoAnswer(input.price) ? "" : input.price.trim();
  const series = isNoAnswer(input.seriesPressure) ? "" : input.seriesPressure.trim();
  const marketing = isNoAnswer(input.marketing) ? "" : input.marketing.trim();

  const shape: CostShape = { ...emptyCost, quotes: [], unknowns: [], refused };

  const priced = [price, series].filter(Boolean).join("\n");
  const all = [price, series, marketing].filter(Boolean).join("\n");
  if (!priced && !marketing) {
    // A refusal is not an empty desk. Silence earns the generic line; a
    // declined question earns the sentence that says it was declined.
    shape.unknowns = refused ? costUnknowns(shape) : MONEY_UNKNOWNS_EMPTY.slice();
    return shape;
  }

  const note = (field: string, text: string) => {
    const t = clip(text);
    if (!t) return;
    if (shape.quotes.some((q) => q.field === field && q.text === t)) return;
    shape.quotes.push({ field, text: t });
  };

  /* headline number — from the quote, never from the advertisement */
  const priceSentences = sentences(priced);
  for (const s of priceSentences) {
    if (DEPOSIT_RE.test(s) || CONSULT_RE.test(s)) continue;
    const m = readMoney(s);
    if (m) {
      shape.quoted = m.value;
      shape.currency = m.currency;
      note("quoted", s);
      break;
    }
  }
  if (shape.quoted === null) {
    const m = readMoney(priced);
    if (m) {
      shape.quoted = m.value;
      shape.currency = m.currency;
      note("quoted", priced);
    }
  }

  /* what the number is a price for */
  for (const { re, unit } of UNIT_PATTERNS) {
    if (re.test(priced)) {
      shape.unit = unit;
      const s = priceSentences.find((x) => re.test(x));
      if (s) note("unit", s);
      break;
    }
  }
  if (shape.unit === null && FROM_PRICE_RE.test(all)) shape.unit = "session";

  if (FROM_PRICE_RE.test(all)) {
    shape.fromPrice = true;
    const s = sentences(all).find((x) => FROM_PRICE_RE.test(x));
    if (s) note("fromPrice", s);
  }

  /* how many of them */
  const sc = SESSION_COUNT_RE.exec(priced) ?? SESSION_COUNT_RE.exec(marketing);
  if (sc) {
    const n = Number(sc[1] ?? sc[2] ?? sc[3]);
    if (Number.isFinite(n) && n > 1 && n <= 60) {
      shape.sessions = n;
      const s = sentences(all).find((x) => SESSION_COUNT_RE.test(x));
      if (s) note("sessions", s);
    }
  }

  const q = QUANTITY_RE.exec(priced);
  if (q) {
    const n = Number(q[1]);
    if (Number.isFinite(n) && n > 0 && n <= 500) {
      shape.quantity = n;
      const s = priceSentences.find((x) => QUANTITY_RE.test(x));
      if (s) note("quantity", s);
    }
  }

  /* deposit */
  const depositSentence = sentences(all).find((s) => DEPOSIT_RE.test(s));
  if (depositSentence) {
    const amounts = readAllMoney(depositSentence);
    if (amounts.length) shape.deposit = amounts[0] ?? null;
    if (NONREFUNDABLE_RE.test(depositSentence)) shape.depositRefundable = false;
    else if (REFUNDABLE_RE.test(depositSentence)) shape.depositRefundable = true;
    note("deposit", depositSentence);
  }

  /* consultation fee */
  const consultSentence = sentences(all).find((s) => CONSULT_RE.test(s) && MONEY_RE.test(s));
  if (consultSentence) {
    const m = readMoney(consultSentence);
    if (m) shape.consultFee = m.value;
    if (REFUNDABLE_RE.test(consultSentence) || /\bcredited\b|\bapplied\b|\bwaived\b/i.test(consultSentence)) {
      shape.consultCredited = true;
    }
    note("consultFee", consultSentence);
  }

  /* cancellation window */
  const cm = CANCEL_RE.exec(all);
  if (cm) {
    const n = Number(cm[1] ?? cm[3]);
    const word = (cm[2] ?? cm[4] ?? "hour").toString();
    if (Number.isFinite(n)) {
      shape.cancellationHours = toHours(n, word);
      const s = sentences(all).find((x) => CANCEL_RE.test(x));
      if (s) note("cancellationHours", s);
    }
  }

  /* credit expiry */
  const em = EXPIRY_RE.exec(all);
  if (em) {
    const n = Number(em[1] ?? em[3]);
    const word = (em[2] ?? em[4] ?? "day").toString();
    if (Number.isFinite(n)) {
      shape.creditsExpireDays = toDays(n, word);
      const s = sentences(all).find((x) => EXPIRY_RE.test(x));
      if (s) note("creditsExpireDays", s);
    }
  }

  /* maintenance interval */
  const mm = MAINTENANCE_RE.exec(all);
  if (mm) {
    // Take the FAR end of a range. "every 3-4 months" is sold as three and
    // lived as four, and the reader is the one who finds out which.
    const lo = Number(mm[1] ?? mm[4]);
    const hi = Number(mm[2] ?? mm[5]);
    const word = (mm[3] ?? mm[6] ?? "month").toString();
    const n = Number.isFinite(hi) ? hi : lo;
    if (Number.isFinite(n)) {
      shape.maintenanceIntervalMonths = toMonths(n, word);
      const s = sentences(all).find((x) => MAINTENANCE_RE.test(x));
      if (s) note("maintenanceIntervalMonths", s);
    }
  } else if (ANNUAL_MAINT_RE.test(all)) {
    shape.maintenanceIntervalMonths = 12;
    const s = sentences(all).find((x) => ANNUAL_MAINT_RE.test(x));
    if (s) note("maintenanceIntervalMonths", s);
  }

  /* membership */
  if (MEMBERSHIP_RE.test(all)) {
    const s = sentences(all).find((x) => MEMBERSHIP_RE.test(x) && MONEY_RE.test(x));
    if (s) {
      const m = readMoney(s);
      if (m) {
        shape.membershipMonthly = m.value;
        if (!shape.currency) shape.currency = m.currency;
        note("membershipMonthly", s);
      }
    } else if (shape.unit === "month" && shape.quoted !== null) {
      shape.membershipMonthly = shape.quoted;
    }
  }

  shape.unknowns = costUnknowns(shape);
  return shape;
}

const MONEY_UNKNOWNS_EMPTY = [
  "Nothing about money is on the desk — not a number, not a course length, not a cancellation term.",
];

/**
 * What is still open, ordered by what it costs to leave open.
 *
 * Cancellation and expiry come before the headline number on purpose. A price
 * you were told is a number you can think about. A cancellation window you were
 * not told is money that leaves without a decision.
 */
function costUnknowns(s: CostShape): string[] {
  const out: string[] = [];
  if (s.refused) {
    out.push("Money was asked about and not answered. A price that cannot be said out loud before booking is a term, not an oversight.");
  }
  if (s.deposit !== null && s.depositRefundable === null) {
    out.push(`A ${s.currency}${fmt(s.deposit)} deposit is named and its refund terms are not. Ask whether it survives a cancellation, a reschedule, and a change of plan.`);
  }
  if (s.cancellationHours === null) {
    out.push("No cancellation window named. This is the term most likely to take money without a treatment happening.");
  }
  if ((s.sessions !== null || s.membershipMonthly !== null) && s.creditsExpireDays === null) {
    out.push("Prepaid sessions are in play and nothing says when they expire. Unused credits with no stated life are the house's, eventually.");
  }
  if (isRateUnit(s.unit) && s.quantity === null) {
    out.push(`Quoted ${UNIT_LABEL[s.unit as NonNullable<CostUnit>]}, with the quantity decided in the room. The rate is agreed before the number of them is.`);
  }
  if (s.maintenanceIntervalMonths === null) {
    out.push("No maintenance interval named. Whether this is one payment or a standing order is the difference between a purchase and a subscription.");
  }
  if (s.quoted === null && s.membershipMonthly === null) {
    out.push("No number anywhere. Everything below is structure without a price attached to it.");
  }
  if (s.fromPrice) {
    out.push("The price is a floor — “from” and “starting at” describe the cheapest version of the thing, which is rarely the version being recommended to you.");
  }
  if (s.membershipMonthly !== null) {
    out.push("A recurring charge continues whether or not you book. Ask what cancels it, in writing, and how much notice that takes.");
  }
  return out;
}

/* ---------------------------------------------------------- projection */

export type CostRowState = "named" | "derived" | "unknown";

export interface CostRow {
  label: string;
  /** Null when the row is an unknown rather than an amount. */
  amount: number | null;
  /** Where the number came from, in one clause. */
  basis: string;
  state: CostRowState;
}

export interface CostProjection {
  currency: string;
  /** What leaves your account to start. */
  entry: number | null;
  /** What is certainly owed, given only what has been named. */
  floor: number | null;
  /** Twelve months, computed only when nothing needed for it is missing. */
  yearOne: number | null;
  /** Three years, on the same terms. */
  yearThree: number | null;
  /** Why `yearOne` is null. Empty when it is not. */
  blockedBy: string[];
  perSession: number | null;
  rows: CostRow[];
  /** The one sentence a reader should leave with. */
  line: string;
  unknowns: string[];
}

const fmt = (n: number): string =>
  n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : String(Math.round(n * 100) / 100);

export const money = (n: number | null, currency: string): string =>
  n === null ? "—" : `${currency || ""}${fmt(n)}`;

/**
 * Turn a shape into a projection.
 *
 * The rule that makes this honest: `yearOne` requires a headline number, a
 * resolved quantity for rate units, and a maintenance interval. Miss any of
 * them and the projection returns a floor and a list. It does not estimate.
 */
export function projectCost(s: CostShape): CostProjection {
  const rows: CostRow[] = [];
  const blocked: string[] = [];
  const cur = s.currency;

  const unitLabel = s.unit ? UNIT_LABEL[s.unit] : null;

  /* -- what one of them costs -------------------------------------- */
  let perSession: number | null = null;
  if (s.quoted !== null) {
    if (s.unit === "course" && s.sessions) {
      perSession = Math.round((s.quoted / s.sessions) * 100) / 100;
      rows.push({
        label: "One session",
        amount: perSession,
        basis: `${money(s.quoted, cur)} for the course, divided by the ${s.sessions} sessions the copy counts.`,
        state: "derived",
      });
    } else if (isRateUnit(s.unit)) {
      if (s.quantity !== null) {
        perSession = s.quoted * s.quantity;
        rows.push({
          label: "One session",
          amount: perSession,
          basis: `${money(s.quoted, cur)} ${unitLabel} × ${s.quantity} stated.`,
          state: "derived",
        });
      } else {
        rows.push({
          label: "One session",
          amount: null,
          basis: `Quoted ${money(s.quoted, cur)} ${unitLabel}. How many is not on the desk, and it is not your decision on the day.`,
          state: "unknown",
        });
        blocked.push(`The quantity behind "${money(s.quoted, cur)} ${unitLabel}" has never been stated.`);
      }
    } else if (s.unit === "month") {
      rows.push({
        label: "Every month",
        amount: s.quoted,
        basis: "Named as a monthly charge.",
        state: "named",
      });
    } else {
      perSession = s.quoted;
      rows.push({
        label: "One session",
        amount: s.quoted,
        basis: unitLabel ? `Named ${unitLabel}.` : "The number on the desk, with nothing saying what it is a price for.",
        state: unitLabel ? "named" : "derived",
      });
      if (!unitLabel) blocked.push("The number is not attached to a unit — session, area, unit or course all price differently.");
    }
  } else if (s.membershipMonthly === null) {
    rows.push({
      label: "One session",
      amount: null,
      basis: "No number has been named.",
      state: "unknown",
    });
    blocked.push("No price has been named at all.");
  }

  /* -- what it takes to start -------------------------------------- */
  let entry: number | null = null;
  const entryParts: string[] = [];
  if (s.deposit !== null) {
    entry = (entry ?? 0) + s.deposit;
    entryParts.push(`${money(s.deposit, cur)} deposit`);
  }
  if (s.consultFee !== null && s.consultCredited !== true) {
    entry = (entry ?? 0) + s.consultFee;
    entryParts.push(`${money(s.consultFee, cur)} consultation`);
  }
  if (entry === null && perSession !== null && s.deposit === null) {
    entry = s.unit === "course" && s.quoted !== null ? s.quoted : perSession;
    entryParts.push(s.unit === "course" ? "the course, paid up front" : "one session");
  }
  if (entry !== null) {
    rows.push({
      label: "To start",
      amount: entry,
      basis: entryParts.join(" + ") + ".",
      state: s.deposit !== null || s.consultFee !== null ? "named" : "derived",
    });
  }

  /* -- the floor ---------------------------------------------------- */
  let floor: number | null = null;
  if (s.unit === "course" && s.quoted !== null) {
    floor = s.quoted;
    rows.push({
      label: "The course",
      amount: floor,
      basis: `Named as the price for ${s.sessions ?? "the"} session${s.sessions === 1 ? "" : "s"}.`,
      state: "named",
    });
  } else if (perSession !== null && s.sessions !== null) {
    floor = perSession * s.sessions;
    rows.push({
      label: "The course",
      amount: floor,
      basis: `${money(perSession, cur)} × ${s.sessions} sessions.`,
      state: "derived",
    });
  } else if (perSession !== null) {
    floor = perSession;
  }
  if (s.membershipMonthly !== null) {
    floor = (floor ?? 0) + s.membershipMonthly * 12;
    rows.push({
      label: "Membership, one year",
      amount: s.membershipMonthly * 12,
      basis: `${money(s.membershipMonthly, cur)} a month × 12, whether or not you book.`,
      state: "derived",
    });
  }

  /* -- the year ----------------------------------------------------- */
  let yearOne: number | null = null;
  let yearThree: number | null = null;
  if (s.maintenanceIntervalMonths === null) {
    blocked.push("Nobody has said how often this has to be repeated, so twelve months cannot be costed.");
    rows.push({
      label: "Twelve months",
      amount: null,
      basis: "Blocked: no maintenance interval named.",
      state: "unknown",
    });
  } else if (floor !== null && perSession !== null) {
    const perYear = 12 / s.maintenanceIntervalMonths;
    const maintainVisits = Math.max(0, Math.round(perYear * 10) / 10);
    const maintenance = perSession * maintainVisits;
    if (blocked.length === 0) {
      yearOne = Math.round(floor + (s.sessions ? maintenance : Math.max(0, maintenance - perSession)));
      yearThree = Math.round(floor + (s.sessions ? maintenance * 3 : maintenance * 3 - perSession));
      rows.push({
        label: "Twelve months",
        amount: yearOne,
        basis: `The course, plus ${maintainVisits} maintenance visit${maintainVisits === 1 ? "" : "s"} at ${money(perSession, cur)} on the ${s.maintenanceIntervalMonths}-month interval the copy names.`,
        state: "derived",
      });
      rows.push({
        label: "Three years",
        amount: yearThree,
        basis: "The same interval, held. Assumes the price does not move, which no room has promised.",
        state: "derived",
      });
    } else {
      rows.push({
        label: "Twelve months",
        amount: null,
        basis: `Blocked: ${blocked[0]}`,
        state: "unknown",
      });
    }
  } else {
    rows.push({
      label: "Twelve months",
      amount: null,
      basis: blocked[0] ? `Blocked: ${blocked[0]}` : "Blocked: not enough has been named.",
      state: "unknown",
    });
  }

  /* -- the terms that move money without a treatment ---------------- */
  if (s.cancellationHours !== null) {
    rows.push({
      label: "Cancellation",
      amount: null,
      basis:
        s.cancellationHours >= 48
          ? `${Math.round(s.cancellationHours)} hours' notice. Long windows are normal and worth diarising the day you book.`
          : `${Math.round(s.cancellationHours)} hours' notice — short enough that an ordinary week can breach it.`,
      state: "named",
    });
  }
  if (s.creditsExpireDays !== null) {
    rows.push({
      label: "Credits expire",
      amount: null,
      basis: `${Math.round(s.creditsExpireDays)} days. Sessions you paid for and did not take stop being yours on that date.`,
      state: "named",
    });
  }
  if (s.deposit !== null && s.depositRefundable === false) {
    rows.push({
      label: "Deposit",
      amount: s.deposit,
      basis: "Named as non-refundable. That is a decision fee, not a payment toward a treatment.",
      state: "named",
    });
  }

  const line = projectionLine(s, { entry, floor, yearOne, blocked, perSession, currency: cur });

  return {
    currency: cur,
    entry,
    floor,
    yearOne,
    yearThree,
    blockedBy: blocked,
    perSession,
    rows,
    line,
    unknowns: s.unknowns,
  };
}

function projectionLine(
  s: CostShape,
  p: {
    entry: number | null;
    floor: number | null;
    yearOne: number | null;
    blocked: string[];
    perSession: number | null;
    currency: string;
  },
): string {
  const cur = p.currency;
  if (s.refused) {
    return "Money was asked about and not answered, so nothing here can be costed. A room that will not price a service before you arrive has told you something.";
  }
  if (p.floor === null && s.membershipMonthly === null) {
    return "No price is on the desk. Everything the copy says about value is currently unpriced.";
  }
  if (p.yearOne !== null) {
    return `${money(p.yearOne, cur)} over twelve months on the schedule they describe${
      s.fromPrice ? ", and that is built on a “from” price, which is the cheapest version of it" : ""
    }.`;
  }
  if (p.floor !== null && p.blocked.length) {
    return `${money(p.floor, cur)} is what has actually been named. The twelve-month number does not exist yet, because ${lowerFirst(p.blocked[0] ?? "something needed for it is missing")}`;
  }
  return "Enough has been named to start, and not enough to know what a year of this costs.";
}

const lowerFirst = (s: string) => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

/* ------------------------------------------------------ prep questions */

export interface MoneyQuestion {
  id: string;
  group: string;
  text: string;
  why: string;
}

/**
 * The money questions this particular quote leaves open.
 *
 * Deliberately generated from the shape rather than printed as a fixed list: a
 * reader who has already been told the cancellation window should not be handed
 * a sheet that asks about it, or they stop reading the sheet.
 */
export function moneyPrep(s: CostShape): MoneyQuestion[] {
  const out: MoneyQuestion[] = [];
  const g = "The money";

  if (s.quoted === null && s.membershipMonthly === null) {
    out.push({
      id: "money-number",
      group: g,
      text: "What is the number, for exactly what — a session, an area, a unit, or the whole course?",
      why: "A price with no unit attached to it cannot be compared with anything.",
    });
  }
  if (isRateUnit(s.unit) && s.quantity === null) {
    out.push({
      id: "money-quantity",
      group: g,
      text: `You have quoted ${money(s.quoted, s.currency)} ${s.unit ? UNIT_LABEL[s.unit] : ""} — how many do you expect to use on me, and what is the range?`,
      why: "A rate is agreed before the quantity is, and the quantity is chosen by the person holding the syringe.",
    });
  }
  if (s.cancellationHours === null) {
    out.push({
      id: "money-cancel",
      group: g,
      text: "What notice do I have to give to cancel or move the appointment without losing money, and is that in writing?",
      why: "This is the term most likely to take money without a treatment happening.",
    });
  }
  if (s.deposit !== null && s.depositRefundable === null) {
    out.push({
      id: "money-deposit",
      group: g,
      text: "Does the deposit come off the treatment price, and does it survive a reschedule?",
      why: "A deposit that does neither is a fee for making a decision.",
    });
  }
  if ((s.sessions !== null || s.membershipMonthly !== null) && s.creditsExpireDays === null) {
    out.push({
      id: "money-expiry",
      group: g,
      text: "If I buy the package and only use part of it, when do the remaining sessions expire, and are they transferable?",
      why: "Unused prepaid sessions with no stated life quietly become the room's.",
    });
  }
  if (s.membershipMonthly !== null) {
    out.push({
      id: "money-exit",
      group: g,
      text: "How do I cancel the membership, how much notice does it take, and what happens to credits I have already paid for?",
      why: "The exit terms are the part of a subscription that is never in the advertisement.",
    });
  }
  if (s.maintenanceIntervalMonths === null) {
    out.push({
      id: "money-maintenance",
      group: g,
      text: "How often does this have to be repeated to keep the result, and what does one of those cost?",
      why: "It is the difference between a purchase and a standing order, and it is rarely in the quoted price.",
    });
  }
  if (s.fromPrice) {
    out.push({
      id: "money-from",
      group: g,
      text: "What does the version you are actually recommending for me cost, rather than the starting price?",
      why: "“From” prices the cheapest version of the thing, which is seldom the version being proposed.",
    });
  }
  out.push({
    id: "money-total",
    group: g,
    text: "Write down the total I would spend with you in the first year if I do everything you are recommending.",
    why: "Asking for one number in writing collapses a package, a membership and a maintenance schedule into a decision you can actually make.",
  });
  return out;
}

/* ------------------------------------------------------------- signal */

/**
 * The tenth signal.
 *
 * Money is scored the same way the room is: not on whether it is expensive, but
 * on whether it has been named. A room that will happily quote a headline price
 * and go quiet on cancellation terms has answered the easy half.
 */
export function costSignalState(s: CostShape): { state: "known" | "partial" | "fail-closed"; reading: string } {
  if (s.refused) {
    return {
      state: "fail-closed",
      reading: `${NO_ANSWER} — money. A price that cannot be given before you arrive is a term of the sale.`,
    };
  }
  const hasNumber = s.quoted !== null || s.membershipMonthly !== null;
  const termsNamed =
    (s.cancellationHours !== null ? 1 : 0) +
    (s.maintenanceIntervalMonths !== null ? 1 : 0) +
    (s.sessions !== null || s.unit !== null ? 1 : 0);

  if (!hasNumber) {
    return {
      state: "fail-closed",
      reading:
        "No price on the desk. Everything the copy claims about value is currently attached to no number at all.",
    };
  }
  if (termsNamed >= 3 && (s.deposit === null || s.depositRefundable !== null)) {
    return {
      state: "known",
      reading: `${money(s.quoted ?? s.membershipMonthly, s.currency)}${
        s.unit ? ` ${UNIT_LABEL[s.unit]}` : ""
      }, with the structure around it named — what it repeats at, what it takes to cancel, and what you are buying.`,
    };
  }
  return {
    state: "partial",
    reading: `${money(s.quoted ?? s.membershipMonthly, s.currency)}${
      s.unit ? ` ${UNIT_LABEL[s.unit]}` : ""
    } is named. ${s.unknowns[0] ?? "The structure around it is not."}`,
  };
}
