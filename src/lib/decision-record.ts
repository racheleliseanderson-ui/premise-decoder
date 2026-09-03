export const DECISION_RECORD_VERSION = "vv-decision-record-v1" as const;
export const DECISION_RECORD_STORAGE_KEY = "vv-decision-record-v1";
export const DECISION_HANDOFF_KEY = "vvdr";

export type VanityApplication = "makeup" | "skincare" | "spa";
export type DecisionSourceApplication = VanityApplication | "publication";
export type EvidenceConfidence = "high" | "moderate" | "limited" | "unknown";
export type ExactObjectMatch = "exact" | "category" | "ingredient" | "mechanism" | "setting" | "unknown";
export type CommercialContext = "independent" | "manufacturer" | "retailer" | "affiliate" | "sponsored" | "mixed" | "unknown";
export type CorrectionState = "current" | "review-due" | "corrected" | "superseded" | "unknown";
export type DecisionHistoryKind =
  | "created"
  | "context-imported"
  | "handoff"
  | "decision"
  | "wear"
  | "reassessment"
  | "consult"
  | "evidence"
  | "correction";

export interface EvidenceReceipt {
  id: string;
  claim: string;
  source: string;
  sourceUrl?: string;
  publishedAt?: string;
  checkedAt: string;
  exactObjectMatch: ExactObjectMatch;
  confidence: EvidenceConfidence;
  uncertainty: string[];
  commercialContext: CommercialContext;
  correctionState: CorrectionState;
  note?: string;
}

export interface DecisionEntry {
  id: string;
  at: string;
  app: VanityApplication;
  label: string;
  rationale?: string;
  status: "open" | "chosen" | "held" | "reversed";
}

export interface DecisionHistoryEntry {
  id: string;
  at: string;
  app: VanityApplication;
  kind: DecisionHistoryKind;
  label: string;
  detail?: string;
  data?: Record<string, unknown>;
}

export interface DecisionSource {
  app: DecisionSourceApplication;
  at: string;
}

export interface VanityDecisionRecord {
  version: typeof DECISION_RECORD_VERSION;
  id: string;
  createdAt: string;
  updatedAt: string;
  concern: string;
  goals: string[];
  constraints: string[];
  evidence: EvidenceReceipt[];
  decisions: DecisionEntry[];
  history: DecisionHistoryEntry[];
  appState: Partial<Record<VanityApplication, Record<string, unknown>>>;
  lastSource: DecisionSource;
}

export interface DecisionHandoffEnvelope {
  version: typeof DECISION_RECORD_VERSION;
  source: DecisionSource;
  record: VanityDecisionRecord;
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function now() {
  return new Date().toISOString();
}

function unique(values: string[]) {
  return [...new Set(values.map((v) => v.trim()).filter(Boolean))];
}

export function createDecisionRecord(
  app: VanityApplication,
  seed: Partial<Pick<VanityDecisionRecord, "concern" | "goals" | "constraints">> = {},
): VanityDecisionRecord {
  const at = now();
  const record: VanityDecisionRecord = {
    version: DECISION_RECORD_VERSION,
    id: uid("vvdr"),
    createdAt: at,
    updatedAt: at,
    concern: seed.concern?.trim() ?? "",
    goals: unique(seed.goals ?? []),
    constraints: unique(seed.constraints ?? []),
    evidence: [],
    decisions: [],
    history: [],
    appState: {},
    lastSource: { app, at },
  };
  return appendDecisionHistory(record, app, "created", "Decision Record created");
}

export function isDecisionRecord(value: unknown): value is VanityDecisionRecord {
  if (!value || typeof value !== "object") return false;
  const r = value as Partial<VanityDecisionRecord>;
  return (
    r.version === DECISION_RECORD_VERSION &&
    typeof r.id === "string" &&
    typeof r.createdAt === "string" &&
    typeof r.updatedAt === "string" &&
    Array.isArray(r.goals) &&
    Array.isArray(r.constraints) &&
    Array.isArray(r.evidence) &&
    Array.isArray(r.decisions) &&
    Array.isArray(r.history) &&
    !!r.appState &&
    typeof r.appState === "object"
  );
}

export function loadDecisionRecord(): VanityDecisionRecord | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(DECISION_RECORD_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    return isDecisionRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveDecisionRecord(record: VanityDecisionRecord): VanityDecisionRecord {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(DECISION_RECORD_STORAGE_KEY, JSON.stringify(record));
    } catch {
      // Local-first is best effort. A blocked storage API must not break the desk.
    }
  }
  return record;
}

export function mergeDecisionRecords(
  local: VanityDecisionRecord | null,
  incoming: VanityDecisionRecord,
  targetApp: VanityApplication,
): VanityDecisionRecord {
  if (!local || local.id === incoming.id) {
    const base = local ? {
      ...incoming,
      concern: incoming.concern || local.concern,
      goals: unique([...local.goals, ...incoming.goals]),
      constraints: unique([...local.constraints, ...incoming.constraints]),
      evidence: dedupeById([...local.evidence, ...incoming.evidence]),
      decisions: dedupeById([...local.decisions, ...incoming.decisions]),
      history: dedupeById([...local.history, ...incoming.history]).slice(-240),
      appState: { ...local.appState, ...incoming.appState },
    } : incoming;
    return {
      ...base,
      updatedAt: now(),
      lastSource: { app: targetApp, at: now() },
    };
  }

  // Different local record: incoming is the explicit handoff the user chose.
  // Preserve local evidence/history as context, but keep the incoming record id.
  return {
    ...incoming,
    goals: unique([...local.goals, ...incoming.goals]),
    constraints: unique([...local.constraints, ...incoming.constraints]),
    evidence: dedupeById([...local.evidence, ...incoming.evidence]),
    decisions: dedupeById([...local.decisions, ...incoming.decisions]),
    history: dedupeById([...local.history, ...incoming.history]).slice(-240),
    appState: { ...local.appState, ...incoming.appState },
    updatedAt: now(),
    lastSource: { app: targetApp, at: now() },
  };
}

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const map = new Map<string, T>();
  for (const item of items) map.set(item.id, item);
  return [...map.values()];
}

export function setDecisionContext(
  record: VanityDecisionRecord,
  app: VanityApplication,
  context: { concern?: string; goals?: string[]; constraints?: string[]; appState?: Record<string, unknown> },
): VanityDecisionRecord {
  const at = now();
  return {
    ...record,
    concern: context.concern?.trim() || record.concern,
    goals: unique([...record.goals, ...(context.goals ?? [])]),
    constraints: unique([...record.constraints, ...(context.constraints ?? [])]),
    appState: context.appState ? { ...record.appState, [app]: context.appState } : record.appState,
    updatedAt: at,
    lastSource: { app, at },
  };
}

export function appendDecisionHistory(
  record: VanityDecisionRecord,
  app: VanityApplication,
  kind: DecisionHistoryKind,
  label: string,
  detail?: string,
  data?: Record<string, unknown>,
): VanityDecisionRecord {
  const at = now();
  // `exactOptionalPropertyTypes` is on: an optional field must be absent, not
  // present-and-undefined. Spreading conditionally is the difference between
  // "no detail was given" and "the detail is undefined", and only the first is
  // true here.
  const entry: DecisionHistoryEntry = {
    id: uid("evt"),
    at,
    app,
    kind,
    label,
    ...(detail === undefined ? {} : { detail }),
    ...(data === undefined ? {} : { data }),
  };
  return {
    ...record,
    history: [...record.history, entry].slice(-240),
    updatedAt: at,
    lastSource: { app, at },
  };
}

export function appendDecision(
  record: VanityDecisionRecord,
  app: VanityApplication,
  label: string,
  rationale?: string,
  status: DecisionEntry["status"] = "chosen",
): VanityDecisionRecord {
  const at = now();
  const decision: DecisionEntry = {
    id: uid("dec"),
    at,
    app,
    label,
    ...(rationale === undefined ? {} : { rationale }),
    status,
  };
  return appendDecisionHistory(
    { ...record, decisions: [...record.decisions, decision].slice(-120), updatedAt: at },
    app,
    "decision",
    label,
    rationale,
  );
}

export function appendEvidenceReceipt(
  record: VanityDecisionRecord,
  app: VanityApplication,
  receipt: Omit<EvidenceReceipt, "id"> & { id?: string },
): VanityDecisionRecord {
  const next: EvidenceReceipt = { ...receipt, id: receipt.id ?? uid("ev") };
  return appendDecisionHistory(
    { ...record, evidence: dedupeById([...record.evidence, next]).slice(-120) },
    app,
    "evidence",
    next.claim,
    `${next.source} · ${next.confidence} confidence`,
  );
}

function encodeUtf8Base64Url(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeUtf8Base64Url(text: string): string | null {
  try {
    const b64 = text.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return null;
  }
}

export function buildDecisionHandoffUrl(
  baseUrl: string,
  record: VanityDecisionRecord,
  sourceApp: VanityApplication,
): string {
  const at = now();
  const outgoing = appendDecisionHistory(record, sourceApp, "handoff", `Handed to ${new URL(baseUrl).hostname}`);
  saveDecisionRecord(outgoing);
  const envelope: DecisionHandoffEnvelope = {
    version: DECISION_RECORD_VERSION,
    source: { app: sourceApp, at },
    record: outgoing,
  };
  const url = new URL(baseUrl);
  url.hash = `${DECISION_HANDOFF_KEY}=${encodeUtf8Base64Url(JSON.stringify(envelope))}`;
  return url.toString();
}

export function parseDecisionHandoffHash(hash: string): DecisionHandoffEnvelope | null {
  const raw = hash.startsWith("#") ? hash.slice(1) : hash;
  const params = new URLSearchParams(raw);
  const payload = params.get(DECISION_HANDOFF_KEY);
  if (!payload) return null;
  const decoded = decodeUtf8Base64Url(payload);
  if (!decoded) return null;
  try {
    const parsed = JSON.parse(decoded) as Partial<DecisionHandoffEnvelope>;
    if (parsed.version !== DECISION_RECORD_VERSION || !parsed.source || !isDecisionRecord(parsed.record)) return null;
    return parsed as DecisionHandoffEnvelope;
  } catch {
    return null;
  }
}

export function acceptDecisionHandoff(
  envelope: DecisionHandoffEnvelope,
  targetApp: VanityApplication,
): VanityDecisionRecord {
  let record = mergeDecisionRecords(loadDecisionRecord(), envelope.record, targetApp);
  record = appendDecisionHistory(
    record,
    targetApp,
    "context-imported",
    `Context accepted from ${envelope.source.app}`,
    `Source timestamp: ${envelope.source.at}`,
  );
  return saveDecisionRecord(record);
}

export function clearDecisionHandoffHash() {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (!url.hash.includes(`${DECISION_HANDOFF_KEY}=`)) return;
  url.hash = "";
  window.history.replaceState(null, "", `${url.pathname}${url.search}`);
}
