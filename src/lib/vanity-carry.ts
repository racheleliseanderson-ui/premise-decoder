/**
 * The Vanity context, kept.
 *
 * SINGLE SOURCE OF TRUTH. Byte-identical in all three repositories, like
 * `fleet.ts` and `vanity-context.ts`. Change it in all three in the same pass.
 *
 * WHY IT EXISTS. `vanity-context.ts` states what may cross between the three
 * desks. It does not say where any of it LIVES, and the answer used to be
 * nowhere: a handoff was a link, a link was a moment, and the moment ended when
 * the page loaded. Walk Skincare to Makeup to Spa and the third desk knew what
 * the second one sent it and nothing at all about the first, so a reader who
 * had already named their concern once named it again, and then a third time.
 * That is the person doing the integration work by hand between our own
 * applications.
 *
 * So this is the small, boring, visible thing that was missing: one record, in
 * this browser, of what the fleet has been told. Every desk contributes what it
 * legitimately knows, every outbound link carries the union rather than one
 * desk's slice, and every inbound arrival is merged into it — after the reader
 * has seen it and agreed.
 *
 * THE RULES IT INHERITS, AND THE TWO IT ADDS.
 *
 *   1. Closed vocabulary only. Nothing is stored that `parseVanityContext`
 *      would not accept, which is enforced structurally: the record holds the
 *      URL-parameter form and is re-parsed on every read. A hand-edited
 *      localStorage entry cannot get a value into this record that a hand-
 *      edited URL could not.
 *
 *   2. Nothing leaves the browser. There is no sync, no account, no endpoint.
 *      A carry travels only in a link the reader clicks.
 *
 *   3. NEW — EVERY FIELD SAYS WHO SAID IT AND WHEN. A record that cannot
 *      attribute itself is a profile. This one can: each field carries the desk
 *      that contributed it and the moment it did, so the surface that shows it
 *      can say "Skincare Intelligence, six days ago" and the reader can drop
 *      that one line without dropping the rest.
 *
 *   4. NEW — IT GOES STALE ON PURPOSE. Tolerance is a fact about a fortnight,
 *      not a standing property of a person. Fields older than
 *      `CARRY_STALE_DAYS` are marked stale wherever they are shown, and fields
 *      older than `CARRY_FORGET_DAYS` are dropped on read. A desk that
 *      confidently applies a six-month-old skin state is worse than a desk that
 *      asks.
 */

import {
  ACTIVE_LABEL,
  CONCERN_LABEL,
  SKIN_STATE_LABEL,
  TOLERANCE_LABEL,
  VANITY_CONTEXT_VERSION,
  parseVanityContext,
  vanityContextParams,
  type VanityApp,
  type VanityContext,
} from "./vanity-context.ts";

export const CARRY_VERSION = "vcarry-1" as const;
export const CARRY_STORAGE_KEY = "vv-carry-1";

/** Shown as "worth confirming" from here on. */
export const CARRY_STALE_DAYS = 21;
/** Dropped on read from here on. Nothing in this vocabulary survives a season. */
export const CARRY_FORGET_DAYS = 120;

/** Everything in the vocabulary except the envelope's own two fields. */
export type CarryKey = Exclude<keyof VanityContext, "v" | "from">;

export interface CarrySource {
  from: VanityApp;
  at: number;
}

export interface CarriedContext {
  v: typeof CARRY_VERSION;
  /**
   * The URL-parameter form of the vocabulary.
   *
   * Deliberately not a typed object. Holding the wire format means the record
   * is validated by exactly the same function that validates a link, so there
   * is one parser to trust rather than two that agree until they do not.
   */
  params: Record<string, string>;
  sources: Partial<Record<CarryKey, CarrySource>>;
}

/** Which query key each field is written under. Mirrors `vanityContextParams`. */
const PARAM_OF: Record<CarryKey, string> = {
  concern: "concern",
  also: "also",
  tolerance: "tolerance",
  skinState: "skinState",
  actives: "actives",
  reassessDays: "reassess",
  routineBurden: "burden",
  cosmeticGoal: "goal",
  prepBurden: "prep",
  serviceClass: "service",
  professional: "professional",
  openQuestions: "open",
  aftercareAnswered: "aftercare",
};

const CARRY_KEYS = Object.keys(PARAM_OF) as CarryKey[];

const APP_NAME: Record<VanityApp, string> = {
  skincare: "Skincare Intelligence",
  makeup: "Makeup Intelligence",
  spa: "Spa Intelligence",
};

export function emptyCarry(): CarriedContext {
  return { v: CARRY_VERSION, params: {}, sources: {} };
}

const DAY = 86_400_000;

function isApp(v: unknown): v is VanityApp {
  return v === "skincare" || v === "makeup" || v === "spa";
}

/**
 * Read a stored record back, dropping anything the vocabulary or the clock
 * refuses. Never throws: a corrupt record is an empty record, because the
 * alternative is a desk that will not open.
 */
export function reviveCarry(raw: unknown, now = Date.now()): CarriedContext {
  if (!raw || typeof raw !== "object") return emptyCarry();
  const r = raw as Partial<CarriedContext>;
  if (r.v !== CARRY_VERSION) return emptyCarry();
  const rawParams = r.params && typeof r.params === "object" ? r.params : {};
  const rawSources = r.sources && typeof r.sources === "object" ? r.sources : {};

  const params: Record<string, string> = {};
  const sources: Partial<Record<CarryKey, CarrySource>> = {};

  for (const key of CARRY_KEYS) {
    const param = PARAM_OF[key];
    const value = (rawParams as Record<string, unknown>)[param];
    if (typeof value !== "string" || !value) continue;
    const src = (rawSources as Record<string, unknown>)[key];
    if (!src || typeof src !== "object") continue;
    const { from, at } = src as Partial<CarrySource>;
    if (!isApp(from) || typeof at !== "number" || !Number.isFinite(at)) continue;
    if (now - at > CARRY_FORGET_DAYS * DAY) continue;
    params[param] = value;
    sources[key] = { from, at };
  }

  // Round-trip through the wire parser. Anything it will not accept is not in
  // the record, whatever localStorage happens to contain.
  const parsed = parseVanityContext({
    ...params,
    v: VANITY_CONTEXT_VERSION,
    from: "skincare",
  });
  if (!parsed) return emptyCarry();
  const clean = vanityContextParams(parsed);
  const kept: Record<string, string> = {};
  const keptSources: Partial<Record<CarryKey, CarrySource>> = {};
  for (const key of CARRY_KEYS) {
    const param = PARAM_OF[key];
    const value = clean.get(param);
    if (value === null || !sources[key]) continue;
    kept[param] = value;
    keptSources[key] = sources[key];
  }
  return { v: CARRY_VERSION, params: kept, sources: keptSources };
}

/** The record as a context, addressed from `app`. Null when nothing is held. */
export function carryContext(carry: CarriedContext, app: VanityApp): VanityContext | null {
  if (!Object.keys(carry.params).length) return null;
  return parseVanityContext({ ...carry.params, v: VANITY_CONTEXT_VERSION, from: app });
}

/**
 * Fold a context into the record.
 *
 * A field the incoming context sets replaces what was held, and takes the
 * sender's name and the current time with it. A field it does not set is left
 * exactly as it was — silence is not an instruction to forget.
 */
export function mergeCarry(
  carry: CarriedContext,
  incoming: VanityContext,
  now = Date.now(),
): CarriedContext {
  const next = vanityContextParams(incoming);
  const params = { ...carry.params };
  const sources = { ...carry.sources };
  for (const key of CARRY_KEYS) {
    const param = PARAM_OF[key];
    const value = next.get(param);
    if (value === null) continue;
    params[param] = value;
    sources[key] = { from: incoming.from, at: now };
  }
  return { v: CARRY_VERSION, params, sources };
}

/** Drop one field. The reader's veto, one line at a time. */
export function forgetCarryField(carry: CarriedContext, key: CarryKey): CarriedContext {
  const params = { ...carry.params };
  const sources = { ...carry.sources };
  delete params[PARAM_OF[key]];
  delete sources[key];
  return { v: CARRY_VERSION, params, sources };
}

export function carryIsEmpty(carry: CarriedContext): boolean {
  return Object.keys(carry.params).length === 0;
}

/* ------------------------------------------------------------------ rows */

export interface CarryRow {
  key: CarryKey;
  /** What this field is, in the reader's words. */
  label: string;
  /** Its current value, in the reader's words. */
  value: string;
  /** Which desk said it. */
  from: VanityApp;
  fromLabel: string;
  at: number;
  /** "six days ago". */
  ageLabel: string;
  /** Old enough that a desk should ask again rather than assume. */
  stale: boolean;
}

const FIELD_LABEL: Record<CarryKey, string> = {
  concern: "What you are working on",
  also: "After that",
  tolerance: "How your skin is taking things",
  skinState: "The surface right now",
  actives: "Leave-on actives",
  reassessDays: "Before a verdict is fair",
  routineBurden: "Leave-on steps",
  cosmeticGoal: "What the face is meant to do",
  prepBurden: "Films under the makeup",
  serviceClass: "Treatment being considered",
  professional: "A professional is involved",
  openQuestions: "Still unanswered about that setting",
  aftercareAnswered: "Aftercare window",
};

function ageWords(ms: number): string {
  const days = Math.floor(ms / DAY);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 14) return `${days} days ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return `${weeks} weeks ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months === 1 ? "" : "s"} ago`;
}

function valueWords(key: CarryKey, ctx: VanityContext): string | null {
  switch (key) {
    case "concern":
      return ctx.concern ? CONCERN_LABEL[ctx.concern] : null;
    case "also":
      return ctx.also?.length ? ctx.also.map((c) => CONCERN_LABEL[c]).join(", ") : null;
    case "tolerance":
      return ctx.tolerance ? TOLERANCE_LABEL[ctx.tolerance] : null;
    case "skinState":
      return ctx.skinState ? SKIN_STATE_LABEL[ctx.skinState] : null;
    case "actives":
      return ctx.actives?.length ? ctx.actives.map((a) => ACTIVE_LABEL[a]).join(", ") : null;
    case "reassessDays":
      return ctx.reassessDays === undefined ? null : `${ctx.reassessDays} days`;
    case "routineBurden":
      return ctx.routineBurden === undefined
        ? null
        : `${ctx.routineBurden} step${ctx.routineBurden === 1 ? "" : "s"}`;
    case "cosmeticGoal":
      return ctx.cosmeticGoal?.length ? ctx.cosmeticGoal.join(", ").replace(/-/g, " ") : null;
    case "prepBurden":
      return ctx.prepBurden === undefined
        ? null
        : `${ctx.prepBurden} film${ctx.prepBurden === 1 ? "" : "s"}`;
    case "serviceClass":
      return ctx.serviceClass ?? null;
    case "professional":
      return ctx.professional ? "yes" : null;
    case "openQuestions":
      return ctx.openQuestions === undefined
        ? null
        : `${ctx.openQuestions} question${ctx.openQuestions === 1 ? "" : "s"}`;
    case "aftercareAnswered":
      return ctx.aftercareAnswered ? "answered by the provider" : null;
    default:
      return null;
  }
}

/**
 * The record as a list a reader can read and edit.
 *
 * Ordered by the vocabulary rather than by recency on purpose: this is a thing
 * to be understood, not a feed.
 */
export function carryRows(carry: CarriedContext, now = Date.now()): CarryRow[] {
  const ctx = carryContext(carry, "skincare");
  if (!ctx) return [];
  const rows: CarryRow[] = [];
  for (const key of CARRY_KEYS) {
    const source = carry.sources[key];
    if (!source) continue;
    const value = valueWords(key, ctx);
    if (value === null) continue;
    const age = Math.max(0, now - source.at);
    rows.push({
      key,
      label: FIELD_LABEL[key],
      value,
      from: source.from,
      fromLabel: APP_NAME[source.from],
      at: source.at,
      ageLabel: ageWords(age),
      stale: age > CARRY_STALE_DAYS * DAY,
    });
  }
  return rows;
}

/**
 * The one sentence above the list.
 *
 * It names the desks involved rather than the number of fields, because "four
 * things" tells a reader nothing about whether they should be surprised.
 */
export function carrySummary(carry: CarriedContext, now = Date.now()): string {
  const rows = carryRows(carry, now);
  if (!rows.length) {
    return "Nothing is travelling with you. Each desk will ask for what it needs.";
  }
  const desks = [...new Set(rows.map((r) => r.fromLabel))];
  const stale = rows.filter((r) => r.stale).length;
  const named =
    desks.length === 1
      ? desks[0]
      : `${desks.slice(0, -1).join(", ")} and ${desks[desks.length - 1]}`;
  return `${rows.length} thing${rows.length === 1 ? "" : "s"} you told ${named} travel${
    rows.length === 1 ? "s" : ""
  } with you between the three desks${stale ? `, ${stale} of them old enough to be worth confirming` : ""}. It is held in this browser and goes nowhere else.`;
}

/* ------------------------------------------------------------- storage */

function storage(): Storage | null {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

export function loadCarry(now = Date.now()): CarriedContext {
  const store = storage();
  if (!store) return emptyCarry();
  try {
    const raw = store.getItem(CARRY_STORAGE_KEY);
    if (!raw) return emptyCarry();
    return reviveCarry(JSON.parse(raw), now);
  } catch {
    return emptyCarry();
  }
}

export function saveCarry(carry: CarriedContext): void {
  const store = storage();
  if (!store) return;
  try {
    if (carryIsEmpty(carry)) store.removeItem(CARRY_STORAGE_KEY);
    else store.setItem(CARRY_STORAGE_KEY, JSON.stringify(carry));
  } catch {
    // Local-first is best effort. A browser that refuses storage still gets a
    // working desk; it just asks again next time.
  }
}

export function clearCarry(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(CARRY_STORAGE_KEY);
  } catch {
    // ignore
  }
}
