/**
 * Desk session — autosave, restore, named saved sets, and JSON portability.
 *
 * Everything lives in this browser's localStorage. Nothing is transmitted.
 * The desk holds up to MAX_VENUES venue blocks so settings can be compared
 * side by side; a saved set is a named snapshot of all of them.
 */

import {
  emptyInput,
  REGIONS,
  VENUE_PROFILES,
  type EvalInput,
  type ServiceClass,
  type Venue,
} from "./engine";
import { isMode, type Mode } from "./modes";
import { parseArrival, serializeArrival, type Arrival } from "./handoff";

export const MAX_VENUES = 5;

const DESK_KEY = "spa-intel-desk-v3";
const SETS_KEY = "spa-intel-sets-v3";
const SCHEMA = 4;

export const PORTABLE_KIND = "spa-intelligence-sets";

/** Where a field's current value came from. Provenance is never inferred. */
export type Origin =
  | "typed"
  | "extracted"
  | "scenario"
  | "catalog"
  | "no-answer"
  /** Carried in on a link from another desk in the fleet, and labelled as such. */
  | "handoff";

export interface Evidence {
  origin: Origin;
  /** The exact sentence the value was taken from, when there is one. */
  quote?: string;
  /** Label of the pasted source it came from. */
  source?: string;
  at: number;
}

/** Consult-prep tick state and the reader's verbatim notes. */
export interface PrepState {
  checked: Record<string, boolean>;
  answers: Record<string, string>;
  /**
   * The consultation itself: when it happened and who was doing the talking.
   *
   * Absent until the reader opens the room view and says. It matters more than
   * it looks: an answer with no date is a memory, and "the person at the desk
   * said" and "the practitioner said" are not the same answer to the same
   * question — which is precisely the distinction this desk exists to keep.
   */
  visit?: { at: string; who: string };
}

export function emptyPrep(): PrepState {
  return { checked: {}, answers: {} };
}

export interface VenueBlock {
  id: string;
  /** User-facing block name. Never a real facility unless the user types one. */
  name: string;
  input: EvalInput;
  /** Field id → provenance record. Absent means the field is untouched. */
  evidence: Record<string, Evidence>;
  /** Consult prep answers. Persist across tab switches and into the packet. */
  prep: PrepState;
  /** Unapplied paste-buffer for Add venue text. Survives tab switches. */
  intakeDraft: string;
}

export const ORIGIN_LABELS: Record<Origin, string> = {
  typed: "Entered by you",
  extracted: "Read from pasted text",
  scenario: "Demonstration scenario",
  catalog: "Chosen from known names",
  "no-answer": "Asked · no answer given",
  // Which desk is named on the evidence's `source`, since more than one desk
  // sends now. The label cannot hardcode a sender any more.
  handoff: "Carried from another desk",
};

export interface DeskState {
  version: number;
  blocks: VenueBlock[];
  activeId: string;
  mode: string;
  savedAt: number;
  /** Last-selected class in the Reference library. */
  libraryClass: ServiceClass;
  /** Context carried in from another desk in the fleet, if any. */
  carried: Arrival | null;
}

export interface SavedSet {
  id: string;
  name: string;
  savedAt: number;
  blocks: VenueBlock[];
}

export interface PortablePayload {
  kind: typeof PORTABLE_KIND;
  version: number;
  exportedAt: number;
  sets: SavedSet[];
}

/* ------------------------------------------------------------------ ids */

export function newId() {
  return `v${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

export function blockLabel(i: number) {
  return `Venue ${String.fromCharCode(65 + i)}`;
}

export function makeBlock(i = 0, input: EvalInput = emptyInput): VenueBlock {
  return {
    id: newId(),
    name: blockLabel(i),
    input: { ...input },
    evidence: {},
    prep: emptyPrep(),
    intakeDraft: "",
  };
}

/* -------------------------------------------------------- normalisation */

const VENUE_IDS = new Set(Object.keys(VENUE_PROFILES));
const REGION_IDS = new Set(REGIONS.map((r) => r.id));

const SERVICE_IDS: Record<string, true> = {
  unselected: true,
  facial: true,
  injectable: true,
  device: true,
  bodywork: true,
  chemical: true,
  iv: true,
  other: true,
};

/** Merge an unknown stored object onto the current shape. Never trusts it. */
export function normalizeInput(raw: unknown): EvalInput {
  const o = (raw ?? {}) as Record<string, unknown>;
  const out: EvalInput = { ...emptyInput };
  for (const key of Object.keys(emptyInput) as (keyof EvalInput)[]) {
    const v = o[key];
    if (typeof v === "string" && v) (out as unknown as Record<string, string>)[key] = v;
  }
  if (!VENUE_IDS.has(out.venue)) out.venue = "unclear";
  if (!REGION_IDS.has(out.region)) out.region = "unstated";
  if (!(out.serviceClass in SERVICE_IDS)) out.serviceClass = "unselected";
  return out;
}

// Every Origin the type allows. "handoff" was missing, so a value carried in
// from another desk was rewritten to "typed" on the first reload — the record
// said the reader had entered a sentence they had actually been handed.
// Typed as a Set<string> so it can be asked about an arbitrary stored value,
// while `satisfies Origin[]` still fails the build if an entry is not a real
// Origin or if a new one is added to the union and forgotten here.
const ORIGINS = new Set<string>([
  "typed",
  "extracted",
  "scenario",
  "catalog",
  "no-answer",
  "handoff",
] satisfies Origin[]);

function normalizeEvidence(raw: unknown): Record<string, Evidence> {
  const o = (raw ?? {}) as Record<string, unknown>;
  const out: Record<string, Evidence> = {};
  for (const [k, v] of Object.entries(o)) {
    const e = (v ?? {}) as Record<string, unknown>;
    const origin =
      typeof e["origin"] === "string" && ORIGINS.has(e["origin"])
        ? (e["origin"] as Origin)
        : "typed";
    out[k] = {
      origin,
      at: typeof e["at"] === "number" ? e["at"] : 0,
      ...(typeof e["quote"] === "string" && e["quote"] ? { quote: e["quote"].slice(0, 400) } : {}),
      ...(typeof e["source"] === "string" && e["source"]
        ? { source: e["source"].slice(0, 80) }
        : {}),
    };
  }
  return out;
}

function normalizeStringMap(raw: unknown, max = 2000): Record<string, string> {
  const o = (raw ?? {}) as Record<string, unknown>;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === "string" && v) out[k] = v.slice(0, max);
  }
  return out;
}

function normalizeBoolMap(raw: unknown): Record<string, boolean> {
  const o = (raw ?? {}) as Record<string, unknown>;
  const out: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === true) out[k] = true;
  }
  return out;
}

export function normalizePrep(raw: unknown): PrepState {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    checked: normalizeBoolMap(o["checked"]),
    answers: normalizeStringMap(o["answers"], 800),
  };
}

function normalizeBlock(raw: unknown, i: number): VenueBlock {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    id: typeof o["id"] === "string" && o["id"] ? o["id"] : newId(),
    name:
      typeof o["name"] === "string" && o["name"].trim() ? o["name"].slice(0, 48) : blockLabel(i),
    input: normalizeInput(o["input"]),
    evidence: normalizeEvidence(o["evidence"]),
    prep: normalizePrep(o["prep"]),
    intakeDraft: typeof o["intakeDraft"] === "string" ? o["intakeDraft"].slice(0, 12000) : "",
  };
}

function normalizeBlocks(raw: unknown): VenueBlock[] {
  const arr = Array.isArray(raw) ? raw : [];
  const blocks = arr.slice(0, MAX_VENUES).map(normalizeBlock);
  return blocks.length ? blocks : [makeBlock(0)];
}

function normalizeServiceClass(raw: unknown): ServiceClass {
  return typeof raw === "string" && raw in SERVICE_IDS ? (raw as ServiceClass) : "unselected";
}

function cloneBlock(b: VenueBlock): VenueBlock {
  return {
    ...b,
    input: { ...b.input },
    evidence: { ...b.evidence },
    prep: {
      checked: { ...b.prep.checked },
      answers: { ...b.prep.answers },
    },
    intakeDraft: b.intakeDraft,
  };
}

/* ------------------------------------------------------------- read/write */

function readJson(key: string): unknown {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or blocked — the desk still works, it just won't persist */
  }
}

export function loadDesk(): DeskState | null {
  const raw = readJson(DESK_KEY) as Record<string, unknown> | null;
  if (!raw) return null;
  const blocks = normalizeBlocks(raw["blocks"]);
  const activeId =
    typeof raw["activeId"] === "string" && blocks.some((b) => b.id === raw["activeId"])
      ? raw["activeId"]
      : blocks[0]!.id;
  const mode = typeof raw["mode"] === "string" && isMode(raw["mode"]) ? raw["mode"] : "fast";
  return {
    version: SCHEMA,
    blocks,
    activeId,
    mode,
    savedAt: typeof raw["savedAt"] === "number" ? raw["savedAt"] : 0,
    libraryClass: normalizeServiceClass(raw["libraryClass"] ?? blocks[0]?.input.serviceClass),
    // Re-validated on the way out of storage by the same parser that reads a
    // link, so a hand-edited localStorage entry is no more trusted than a
    // hand-edited URL.
    carried: parseArrival((raw["carried"] ?? {}) as Record<string, unknown>),
  };
}

export function saveDesk(state: Omit<DeskState, "version" | "savedAt">) {
  const { carried, ...rest } = state;
  writeJson(DESK_KEY, {
    ...rest,
    carried: carried ? serializeArrival(carried) : null,
    version: SCHEMA,
    savedAt: Date.now(),
  });
}

export function clearDesk() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(DESK_KEY);
  } catch {
    /* ignore */
  }
}

/* ---------------------------------------------------------- saved sets */

export function listSets(): SavedSet[] {
  const raw = readJson(SETS_KEY);
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .map((s) => {
      const o = (s ?? {}) as Record<string, unknown>;
      return {
        id: typeof o["id"] === "string" && o["id"] ? o["id"] : newId(),
        name:
          typeof o["name"] === "string" && o["name"].trim()
            ? o["name"].slice(0, 60)
            : "Untitled set",
        savedAt: typeof o["savedAt"] === "number" ? o["savedAt"] : 0,
        blocks: normalizeBlocks(o["blocks"]),
      } satisfies SavedSet;
    })
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, 24);
}

export function saveSet(name: string, blocks: VenueBlock[]): SavedSet[] {
  const sets = listSets();
  const clean = name.trim().slice(0, 60) || `Set · ${new Date().toLocaleDateString()}`;
  const entry: SavedSet = {
    id: newId(),
    name: clean,
    savedAt: Date.now(),
    blocks: blocks.map(cloneBlock),
  };
  const next = [entry, ...sets.filter((s) => s.name !== clean)].slice(0, 24);
  writeJson(SETS_KEY, next);
  return next;
}

export function deleteSet(id: string): SavedSet[] {
  const next = listSets().filter((s) => s.id !== id);
  writeJson(SETS_KEY, next);
  return next;
}

export function writeSets(sets: SavedSet[]): SavedSet[] {
  const next = sets
    .map((s) => ({
      ...s,
      blocks: normalizeBlocks(s.blocks),
    }))
    .sort((a, b) => b.savedAt - a.savedAt)
    .slice(0, 24);
  writeJson(SETS_KEY, next);
  return listSets();
}

/* ---------------------------------------------------------- JSON portability */

export function exportSetsJson(sets: SavedSet[]): string {
  const payload: PortablePayload = {
    kind: PORTABLE_KIND,
    version: SCHEMA,
    exportedAt: Date.now(),
    sets: sets.map((s) => ({
      ...s,
      blocks: s.blocks.map(cloneBlock),
    })),
  };
  return JSON.stringify(payload, null, 2);
}

export function parseImportedSets(raw: string): { sets: SavedSet[] } | { error: string } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "That file is not valid JSON." };
  }
  const o = (parsed ?? {}) as Record<string, unknown>;
  if (o["kind"] !== PORTABLE_KIND) {
    return { error: "This is not a Spa Intelligence set file." };
  }
  const arr = Array.isArray(o["sets"]) ? o["sets"] : Array.isArray(o["blocks"]) ? [o] : null;
  if (!arr) return { error: "No saved sets found in that file." };
  const sets: SavedSet[] = arr.map((s, i) => {
    const rec = (s ?? {}) as Record<string, unknown>;
    return {
      id: typeof rec["id"] === "string" && rec["id"] ? rec["id"] : newId(),
      name:
        typeof rec["name"] === "string" && rec["name"].trim()
          ? rec["name"].slice(0, 60)
          : `Imported set ${i + 1}`,
      savedAt: typeof rec["savedAt"] === "number" ? rec["savedAt"] : Date.now(),
      blocks: normalizeBlocks(rec["blocks"]),
    };
  });
  if (!sets.length) return { error: "The file contained no venue blocks." };
  return { sets };
}

export function mergeImportedSets(incoming: SavedSet[]): SavedSet[] {
  const existing = listSets();
  const seen = new Set(existing.map((s) => s.id));
  const names = new Set(existing.map((s) => s.name));
  const extra: SavedSet[] = [];
  for (const s of incoming) {
    const id = seen.has(s.id) ? newId() : s.id;
    seen.add(id);
    let name = s.name;
    if (names.has(name)) name = `${name} · imported`.slice(0, 60);
    names.add(name);
    extra.push({ ...s, id, name, blocks: s.blocks.map(cloneBlock) });
  }
  return writeSets([...extra, ...existing]);
}

/* --------------------------------------------------------------- helpers */

export const venueOf = (v: string): Venue => (VENUE_IDS.has(v) ? (v as Venue) : "unclear");

export function relativeTime(ts: number) {
  if (!ts) return "not yet";
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 10) return "just now";
  if (s < 60) return `${s}s ago`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hr ago`;
  return new Date(ts).toLocaleDateString();
}

export type { Mode };
