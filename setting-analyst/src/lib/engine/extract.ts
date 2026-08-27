import { findProduct, findService, LICENSE_TOKENS, REGIONS, VENUES } from "../data/catalog.ts";
import type { DeskInput, ServiceClass, VenueId } from "./types.ts";
import { filled, norm } from "./text.ts";

export type ExtractedField = {
  key: keyof DeskInput;
  value: string;
  quote: string;
  confidence: "high" | "medium" | "low";
};

const VENUE_HINTS: { id: VenueId; test: RegExp }[] = [
  { id: "med-spa", test: /med(?:ical)?\s*spa|medspa/i },
  { id: "clinic", test: /clinic|dermatolog|plastic surg|physician practice/i },
  { id: "dental-adjacent", test: /dental|dentist|dds|dmd/i },
  { id: "hotel-spa", test: /hotel|resort spa|spa at the/i },
  { id: "mobile", test: /mobile|in[-\s]?home|comes to you|party|event service/i },
  { id: "salon-suite", test: /suite rental|booth rental|independent suite/i },
  { id: "franchise-chain", test: /locations nationwide|franchise|every location/i },
  { id: "wellness-studio", test: /wellness (?:studio|lounge)|recovery lounge|biohacking/i },
  { id: "day-spa", test: /day spa|spa menu|wellness spa/i },
];

const CLASS_HINTS: { id: ServiceClass; test: RegExp }[] = [
  { id: "injectable", test: /botox|dysport|xeomin|filler|juvederm|restylane|kybella|toxin|inject|lip flip|thread|sculptra|semaglutide|prp/i },
  { id: "device", test: /laser|ipl|bbl|rf |microneedl|ulthera|coolsculpt|emsculpt|hydrafacial|morpheus|fraxel|hifu/i },
  { id: "chemical", test: /peel|tca|jessner|dermaplan/i },
  { id: "iv", test: /\biv\b|infusion|drip|myers|nad\+|glutathione/i },
  { id: "bodywork", test: /massage|lymphatic|cupping|gua sha|body wrap/i },
  { id: "facial", test: /facial|lash|wax|microblad|brow/i },
];

function sentenceFor(text: string, test: RegExp): string {
  const parts = text.split(/(?<=[.!?;])\s+|\n+/);
  return (parts.find((p) => test.test(p)) ?? "").trim().slice(0, 220);
}

export function extractFromPaste(raw: string, current: DeskInput): { next: DeskInput; fills: ExtractedField[] } {
  const text = raw.trim();
  if (!text) return { next: current, fills: [] };
  const fills: ExtractedField[] = [];
  const next: DeskInput = { ...current, marketing: current.marketing ? current.marketing : text };

  const firstLine = text.split(/\n/)[0]?.trim() ?? "";
  if (!filled(current.menuLine) && firstLine && firstLine.length < 90) {
    next.menuLine = firstLine.replace(/^[-*•]\s*/, "");
    fills.push({ key: "menuLine", value: next.menuLine, quote: firstLine, confidence: "medium" });
  }

  const service = findService(text);
  if (service && current.serviceClass === "unselected") {
    next.serviceClass = service.serviceClass;
    fills.push({
      key: "serviceClass",
      value: service.serviceClass,
      quote: sentenceFor(text, new RegExp(service.aliases[0] ?? service.name, "i")) || service.name,
      confidence: "high",
    });
  } else if (current.serviceClass === "unselected") {
    const hinted = CLASS_HINTS.find((h) => h.test.test(text));
    if (hinted) {
      next.serviceClass = hinted.id;
      fills.push({ key: "serviceClass", value: hinted.id, quote: sentenceFor(text, hinted.test), confidence: "medium" });
    }
  }

  if (current.venue === "unclear") {
    const hinted = VENUE_HINTS.find((h) => h.test.test(text));
    if (hinted) {
      next.venue = hinted.id;
      fills.push({
        key: "venue",
        value: hinted.id,
        quote: sentenceFor(text, hinted.test),
        confidence: hinted.id === "med-spa" ? "medium" : "high",
      });
    }
  }

  const product = findProduct(text);
  if (product && !filled(current.product)) {
    next.product = product.name;
    fills.push({
      key: "product",
      value: product.name,
      quote: sentenceFor(text, new RegExp(product.aliases[0] ?? product.name, "i")) || product.name,
      confidence: "high",
    });
  }

  if (!filled(current.performer)) {
    const licenseHit = LICENSE_TOKENS.find((t) => t.length > 2 && norm(text).includes(t));
    if (licenseHit) {
      next.performer = licenseHit.toUpperCase() === licenseHit ? licenseHit : licenseHit;
      next.license = next.license || licenseHit;
      fills.push({
        key: "performer",
        value: next.performer,
        quote: sentenceFor(text, new RegExp(licenseHit.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")),
        confidence: "medium",
      });
    }
  }

  if (current.region === "unstated") {
    const region = REGIONS.find((r) => r.id !== "unstated" && r.id !== "other" && text.toLowerCase().includes(r.label.split(",")[0].toLowerCase()));
    if (region) {
      next.region = region.id;
      fills.push({ key: "region", value: region.id, quote: region.label, confidence: "medium" });
    }
  }

  const price = text.match(/\$\s?[\d,]+(?:\.\d+)?(?:\s*(?:per|\/)\s*(?:unit|area|session|vial|syringe))?/i);
  if (price && !filled(current.price)) {
    next.price = price[0];
    fills.push({ key: "price", value: next.price, quote: sentenceFor(text, /\$/), confidence: "high" });
  }

  const after = /(voicemail|instagram|dm us|24\/7|on[-\s]?call|front desk hours)/i.exec(text);
  if (after && !filled(current.afterHours)) {
    next.afterHours = after[0];
    fills.push({ key: "afterHours", value: next.afterHours, quote: sentenceFor(text, /(voicemail|instagram|dm us|24\/7|on[-\s]?call|front desk hours)/i), confidence: "medium" });
  }

  if (!filled(current.consent) && /verbal only|written consent|consent form/i.test(text)) {
    const m = text.match(/verbal only|written consent|consent form/i);
    if (m) {
      next.consent = m[0];
      fills.push({ key: "consent", value: next.consent, quote: sentenceFor(text, /consent/i), confidence: "medium" });
    }
  }

  if (!filled(current.seriesPressure) && /(prepay|membership|book \d|package of \d|every \d+|rebook)/i.test(text)) {
    next.seriesPressure = sentenceFor(text, /(prepay|membership|book \d|package of \d|every \d+|rebook)/i);
    fills.push({ key: "seriesPressure", value: next.seriesPressure, quote: next.seriesPressure, confidence: "medium" });
  }

  if (!next.marketing) next.marketing = text;
  if (next.marketing === current.marketing && text && !current.marketing) next.marketing = text;

  // Keep venue catalog names available for debugging extract quality.
  void VENUES;

  return { next, fills };
}
