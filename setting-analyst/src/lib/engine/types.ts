export type ServiceClass =
  | "unselected"
  | "facial"
  | "injectable"
  | "device"
  | "bodywork"
  | "chemical"
  | "iv"
  | "other";

export type VenueId =
  | "day-spa"
  | "hotel-spa"
  | "wellness-studio"
  | "salon-suite"
  | "franchise-chain"
  | "mobile"
  | "med-spa"
  | "dental-adjacent"
  | "clinic"
  | "unclear";

export type RegionId =
  | "unstated"
  | "us-ca"
  | "us-ny"
  | "us-tx"
  | "us-fl"
  | "us-il"
  | "us-az"
  | "us-wa"
  | "us-co"
  | "us-nv"
  | "us-ga"
  | "us-other"
  | "ca-canada"
  | "uk"
  | "eu"
  | "au-nz"
  | "other";

export type SignalState = "known" | "partial" | "fail-closed" | "declined";
export type SignalDepth = "fast" | "full";
export type PostureKey = "empty" | "unresolved" | "partial" | "resolved";
export type ClaimSeverity = "hard" | "flag" | "note";
export type Freshness = "verified" | "current" | "review-due" | "incomplete" | "unknown";

export type DeskInput = {
  venueName: string;
  serviceClass: ServiceClass;
  venue: VenueId;
  region: RegionId;
  menuLine: string;
  product: string;
  performer: string;
  license: string;
  price: string;
  supervision: string;
  sanitation: string;
  afterHours: string;
  consent: string;
  seriesPressure: string;
  marketing: string;
};

export type Signal = {
  id: string;
  label: string;
  weight: number;
  depth: SignalDepth;
  state: SignalState;
  reading: string;
  ask: string;
  why: string;
  note?: string;
};

export type ClaimHit = {
  phrase: string;
  category: string;
  hides: string;
  ask: string;
  severity: ClaimSeverity;
};

export type Burden = {
  score: number;
  band: "High" | "Moderate" | "Contained" | "Low";
  drivers: string[];
};

export type Posture = {
  key: PostureKey;
  label: string;
  line: string;
  next: string;
};

export type Evaluation = {
  input: DeskInput;
  signals: Signal[];
  place: number;
  promise: number;
  gap: number;
  burden: Burden;
  claims: ClaimHit[];
  known: Signal[];
  failClosed: Signal[];
  declined: Signal[];
  unknowns: string[];
  nextSteps: string[];
  posture: Posture;
  identityLine: string;
  weakest: Signal | null;
  costHorizon: CostHorizon;
};

export type CostHorizon = {
  stated: string;
  reading: string;
  annualHint: string | null;
  confidence: "stated" | "inferred-from-text" | "unknown";
};

export type SavedScenario = {
  id: string;
  name: string;
  savedAt: string;
  input: DeskInput;
  pinned: boolean;
};

export type Mode =
  | "fast"
  | "intake"
  | "full"
  | "compare"
  | "prep"
  | "decode"
  | "library"
  | "packet"
  | "whatif";

export const ASKED_NO_ANSWER = "Asked, no answer given";

export const EMPTY_INPUT: DeskInput = {
  venueName: "",
  serviceClass: "unselected",
  venue: "unclear",
  region: "unstated",
  menuLine: "",
  product: "",
  performer: "",
  license: "",
  price: "",
  supervision: "",
  sanitation: "",
  afterHours: "",
  consent: "",
  seriesPressure: "",
  marketing: "",
};
