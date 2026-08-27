export const EDITORIAL = {
  home: "https://vanityvice.blog/",
  desks: "https://vanityvice.blog/desks/",
  spa: "https://vanityvice.blog/spa-intelligence/",
  menuAudit: "https://vanityvice.blog/spa-intelligence-read-treatment-menu-before-booking/",
  claimDecoder: "https://vanityvice.blog/claim-decoder/",
  treatmentRoom: "https://vanityvice.blog/treatment-room/",
  fdaVerbs: "https://vanityvice.blog/fda-cleared-approved-registered-not-interchangeable/",
  medicalGrade: "https://vanityvice.blog/medical-grade-marketing-category-not-verdict/",
  maintenanceMath: "https://vanityvice.blog/aesthetic-treatment-maintenance-math-real-cost/",
  consultReceipt: "https://vanityvice.blog/consultation-receipt-treatment-verification-record/",
  disclaimer: "https://vanityvice.blog/editorial-medical-disclaimer/",
  standards: "https://vanityvice.blog/editorial-standards/",
  makeupDesk: "https://makeup.vanityvice.blog/",
  skincareDesk: "https://skincare.vanityvice.blog/",
  skincareConsult: "https://skincare.vanityvice.blog/consultation",
  house: "https://northernlanternhouse.com/",
  legal: "https://northernlanternhouse.com/legal",
  support: "https://northernlanternhouse.com/support",
} as const;

export const CONTEXT_LINKS: { match: RegExp; href: string; label: string; why: string }[] = [
  {
    match: /FDA|cleared|approved|registered/i,
    href: EDITORIAL.fdaVerbs,
    label: "FDA verbs are not interchangeable",
    why: "Registered, listed, cleared, and approved do different work.",
  },
  {
    match: /medical[-\s]?grade|cosmeceutical/i,
    href: EDITORIAL.medicalGrade,
    label: "‘Medical grade’ is a marketing category",
    why: "The phrase is not a regulatory verdict.",
  },
  {
    match: /series|maintenance|prepay|membership|per unit/i,
    href: EDITORIAL.maintenanceMath,
    label: "The first price is rarely the whole price",
    why: "Series, aftercare, and maintenance belong on the receipt.",
  },
  {
    match: /exosome|pdrn|growth factor|regenerative/i,
    href: "https://vanityvice.blog/exosome-serums-treatments-biology-thin-finished-product-receipts/",
    label: "Exosomes and regenerative add-ons",
    why: "Source and finished-product identity are usually the missing receipt.",
  },
];
