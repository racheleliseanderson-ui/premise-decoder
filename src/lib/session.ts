/**
 * Desk session — autosave, restore, and named saved sets.
 *
 * Everything lives in this browser's localStorage. Nothing is transmitted.
 * The desk holds up to MAX_VENUES venue blocks so settings can be compared
 * side by side; a saved set is a named snapshot of all of them.
 */

import { emptyInput, REGIONS, VENUE_PROFILES, type EvalInput, type Venue } from "./engine";

export const MAX_VENUES = 5;

const DESK_KEY = "spa-intel-desk-v3";
const SETS_KEY = "spa-intel-sets-v3";
const SCHEMA = 3;

export interface VenueBlock {
  id: string;
  /** User-facing block name. Never a real facility unless the user types one. */
  name: string;
  input: EvalInput;
}

export interface DeskState {
  version: number;
  blocks: VenueBlock[];
  activeId: string;
  mode: string;
  savedAt: number;
}

export interface SavedSet {
  id: string;
  name: string;
  savedAt: number;
  blocks: VenueBlock[];
}

/* ------------------------------------------------------------------ ids */

export function newId() {
  return `v${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
}

export function blockLabel(i: number) {
  return `Venue ${String.fromCharCode(65 + i)}`;
}

export function makeBlock(i = 0, input: EvalInput = emptyInput): VenueBlock {
  return { id: newId(), name: blockLabel(i), input: { ...input } };
}

/* -------------------------------------------------------- normalisation */

const VENUE_IDS = new Set(Object.keys(VENUE_PROFILES));
const REGION_IDS = new Set(REGIONS.map((r) => r.id));

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
  if (!(out.serviceClass in SERVICE_IDS)) out.serviceClass = "facial";
  return out;
}

const SERVICE_IDS: Record<string, true> = {
  facial: true,
  injectable: true,
  device: true,
  bodywork: true,
  chemical: true,
  iv: true,
  other: true,
};

function normalizeBlock(raw: unknown, i: number): VenueBlock {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    id: typeof o["id"] === "string" && o["id"] ? o["id"] : newId(),
    name: typeof o["name"] === "string" && o["name"].trim() ? o["name"].slice(0, 48) : blockLabel(i),
    input: normalizeInput(o["input"]),
  };
}

function normalizeBlocks(raw: unknown): VenueBlock[] {
  const arr = Array.isArray(raw) ? raw : [];
  const blocks = arr.slice(0, MAX_VENUES).map(normalizeBlock);
  return blocks.length ? blocks : [makeBlock(0)];
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
  return {
    version: SCHEMA,
    blocks,
    activeId,
    mode: typeof raw["mode"] === "string" ? raw["mode"] : "fast",
    savedAt: typeof raw["savedAt"] === "number" ? raw["savedAt"] : 0,
  };
}

export function saveDesk(state: Omit<DeskState, "version" | "savedAt">) {
  writeJson(DESK_KEY, { ...state, version: SCHEMA, savedAt: Date.now() });
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
        name: typeof o["name"] === "string" && o["name"].trim() ? o["name"].slice(0, 60) : "Untitled set",
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
    blocks: blocks.map((b) => ({ ...b, input: { ...b.input } })),
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
