/**
 * Service and product/device catalog — education only.
 *
 * This file names what appears on spa and med-spa menus and what the names
 * alone do NOT establish. It never rates a product, never recommends one,
 * never assesses candidacy, and never states that anything is safe or
 * effective. Every entry exists so a reader can say the exact words back to
 * the facility and ask a checkable question.
 */

import type { ServiceClass } from "./engine";

/* ------------------------------------------------------------- services */

export interface ServiceEntry {
  id: string;
  /** Menu-facing name. */
  name: string;
  cls: ServiceClass;
  /** Group heading in the picker. */
  group: string;
  /** Common marketing aliases for the same line item. */
  aliases: string[];
  /** What the menu name alone leaves unresolved. */
  silent: string;
}

const S = (
  id: string,
  name: string,
  cls: ServiceClass,
  group: string,
  aliases: string[],
  silent: string,
): ServiceEntry => ({ id, name, cls, group, aliases, silent });

export const SERVICE_CATALOG: ServiceEntry[] = [
  /* injectables */
  S(
    "tox-glabella",
    "Neurotoxin, glabella / frown lines",
    "injectable",
    "Injectables",
    ["botox", "dysport", "xeomin", "jeuveau", "daxxify", "tox", "eleven lines"],
    "Which toxin brand, how many units, reconstitution, and who injects.",
  ),
  S(
    "tox-lipflip",
    "Lip flip",
    "injectable",
    "Injectables",
    ["lip flip", "flip"],
    "Units, brand, and whether the injector is separately licensed to inject.",
  ),
  S(
    "tox-hyperhidrosis",
    "Neurotoxin for sweating",
    "injectable",
    "Injectables",
    ["hyperhidrosis", "underarm sweat", "sweat treatment"],
    "Whether this is on-label use, total units, and the prescribing licensee.",
  ),
  S(
    "filler-ha",
    "Hyaluronic acid filler",
    "injectable",
    "Injectables",
    ["juvederm", "juvéderm", "restylane", "rha", "versa", "belotero", "lip filler", "cheek filler"],
    "Product line, syringe volume, placement plane, and reversal agent on site.",
  ),
  S(
    "filler-biostim",
    "Biostimulator injection",
    "injectable",
    "Injectables",
    ["sculptra", "radiesse", "collagen stimulator", "pla"],
    "Vials per session, dilution, session count, and who is accountable for nodules.",
  ),
  S(
    "filler-deoxycholic",
    "Fat-dissolving injection",
    "injectable",
    "Injectables",
    ["kybella", "deoxycholic", "double chin injection", "lipolytic"],
    "Number of vials, sessions, swelling window, and the complication pathway.",
  ),
  S(
    "prp-inject",
    "PRP / PRF injection",
    "injectable",
    "Injectables",
    ["prp", "prf", "platelet rich", "vampire"],
    "Draw and spin protocol, who draws blood, and under whose license.",
  ),
  S(
    "threads",
    "PDO / thread lift",
    "injectable",
    "Injectables",
    ["pdo threads", "thread lift", "barbed threads"],
    "Thread type, count, insertion depth, and who manages migration or extrusion.",
  ),
  S(
    "weight-glp",
    "Weight or metabolic injection program",
    "injectable",
    "Injectables",
    ["semaglutide", "tirzepatide", "glp-1", "weight loss shot", "lipo shot", "b12 injection"],
    "Who prescribes, source of the drug, labs, monitoring, and stopping plan.",
  ),
  S(
    "hormone-pellet",
    "Hormone pellet or injection program",
    "injectable",
    "Injectables",
    ["pellet therapy", "hrt", "testosterone pellet", "bhrt"],
    "Prescriber, lab baseline, dose, and follow-up interval.",
  ),

  /* energy devices */
  S(
    "laser-hair",
    "Laser hair removal",
    "device",
    "Energy devices",
    ["laser hair", "diode", "alexandrite", "nd:yag", "ipl hair", "permanent hair reduction"],
    "Device platform, wavelength, skin-type screening, and operator training.",
  ),
  S(
    "ipl",
    "IPL / BBL photofacial",
    "device",
    "Energy devices",
    ["ipl", "bbl", "photofacial", "photorejuvenation"],
    "Platform, filter, settings, and who screens for pigment risk.",
  ),
  S(
    "laser-resurface",
    "Ablative or fractional resurfacing laser",
    "device",
    "Energy devices",
    ["co2", "fraxel", "erbium", "fractional laser", "clear + brilliant"],
    "Depth, downtime, who operates it, and after-hours cover.",
  ),
  S(
    "laser-vascular",
    "Vascular / redness laser",
    "device",
    "Energy devices",
    ["vbeam", "pulsed dye", "kt laser", "rosacea laser"],
    "Platform, settings, and the licensee responsible for the setting used.",
  ),
  S(
    "laser-tattoo",
    "Tattoo or pigment removal laser",
    "device",
    "Energy devices",
    ["picosure", "picoway", "q-switched", "tattoo removal"],
    "Wavelengths, session count, and management of blistering or scarring.",
  ),
  S(
    "rf-skin",
    "Radiofrequency skin tightening",
    "device",
    "Energy devices",
    ["rf tightening", "thermage", "exilis", "venus legacy"],
    "Platform, energy levels, and operator credential.",
  ),
  S(
    "rf-microneedle",
    "RF microneedling",
    "device",
    "Energy devices",
    ["morpheus8", "vivace", "profound", "secret rf", "rf micro"],
    "Needle depth, energy, sterile tip handling, and prescribing oversight.",
  ),
  S(
    "microneedling",
    "Microneedling",
    "device",
    "Energy devices",
    ["skinpen", "dermapen", "collagen induction", "micro-needling"],
    "Cartridge single-use status, depth, topicals applied, and license held.",
  ),
  S(
    "ultrasound-lift",
    "Ultrasound lifting",
    "device",
    "Energy devices",
    ["ultherapy", "hifu", "sofwave"],
    "Platform, transducer depths, and who interprets the mapping.",
  ),
  S(
    "cryo-contour",
    "Cryolipolysis body contouring",
    "device",
    "Energy devices",
    ["coolsculpting", "fat freezing", "cryolipolysis"],
    "Applicator plan, cycle count, and the pathway for paradoxical hyperplasia.",
  ),
  S(
    "ems-muscle",
    "Electromagnetic muscle stimulation",
    "device",
    "Energy devices",
    ["emsculpt", "emsculpt neo", "trusculpt flex"],
    "Contraindication screening and who supervises the session.",
  ),
  S(
    "laser-lipo-noninv",
    "Non-invasive laser or ultrasound fat reduction",
    "device",
    "Energy devices",
    ["sculpsure", "ultrashape", "cavitation", "laser lipo"],
    "Device name, session count, and what measurement is recorded.",
  ),
  S(
    "led-therapy",
    "LED light therapy",
    "device",
    "Energy devices",
    ["led mask", "celluma", "red light bed"],
    "Device, wavelengths, exposure time, and eye protection.",
  ),
  S(
    "laser-vaginal",
    "Intravaginal energy device",
    "device",
    "Energy devices",
    ["monalisa touch", "femtouch", "vaginal rejuvenation"],
    "Whether a physician performs it and what the cleared indication is.",
  ),

  /* resurfacing / chemical */
  S(
    "peel-superficial",
    "Superficial chemical peel",
    "chemical",
    "Peels and resurfacing",
    ["glycolic peel", "lactic peel", "salicylic peel", "enzyme peel"],
    "Acid, percentage, pH, layers, and neutralization step.",
  ),
  S(
    "peel-medium",
    "Medium-depth chemical peel",
    "chemical",
    "Peels and resurfacing",
    ["tca", "jessner", "vi peel", "perfect derma peel"],
    "Depth, downtime, sun discipline, and who reviews healing.",
  ),
  S(
    "dermaplane",
    "Dermaplaning",
    "chemical",
    "Peels and resurfacing",
    ["dermaplaning", "blade exfoliation"],
    "Blade single-use status and the license covering blade work.",
  ),
  S(
    "microderm",
    "Microdermabrasion / hydradermabrasion",
    "chemical",
    "Peels and resurfacing",
    ["microdermabrasion", "diamond tip", "hydrodermabrasion"],
    "Tip sterilization and the serums used by name.",
  ),

  /* facials and esthetics */
  S(
    "facial-classic",
    "Classic / European facial",
    "facial",
    "Facials and esthetics",
    ["european facial", "signature facial", "deep cleanse facial"],
    "Product line by name and the esthetics license held.",
  ),
  S(
    "hydrafacial",
    "Hydradermabrasion facial",
    "facial",
    "Facials and esthetics",
    ["hydrafacial", "aquafacial", "glass skin facial"],
    "Whether tips are single-use and which boosters are added.",
  ),
  S(
    "facial-extraction",
    "Extraction / acne facial",
    "facial",
    "Facials and esthetics",
    ["acne facial", "extractions", "clarifying facial"],
    "Instrument processing and whether lancets are used and by whom.",
  ),
  S(
    "facial-oxygen",
    "Oxygen or infusion facial",
    "facial",
    "Facials and esthetics",
    ["oxygen facial", "intraceuticals"],
    "What is in the infusion and whether the claim is topical only.",
  ),
  S(
    "facial-medgrade",
    "Advanced / clinical facial",
    "facial",
    "Facials and esthetics",
    ["medical grade facial", "clinical facial", "advanced facial"],
    "Everything: this line names a tier, not a procedure.",
  ),
  S(
    "brow-lash",
    "Lash or brow service",
    "facial",
    "Facials and esthetics",
    ["lash extensions", "lash lift", "brow lamination", "tinting"],
    "Adhesive and dye by name, patch testing, and tool processing.",
  ),
  S(
    "wax-sugar",
    "Waxing or sugaring",
    "facial",
    "Facials and esthetics",
    ["brazilian wax", "sugaring", "hair removal wax"],
    "Double-dipping policy and post-service care instructions.",
  ),
  S(
    "pmu",
    "Permanent makeup / microblading",
    "facial",
    "Facials and esthetics",
    ["microblading", "permanent makeup", "pmu", "powder brows", "lip blush"],
    "Pigment brand, needle single-use status, bloodborne pathogen training, and the tattoo permit.",
  ),
  S(
    "scalp-hair",
    "Scalp or hair restoration service",
    "facial",
    "Facials and esthetics",
    ["scalp facial", "hair restoration", "scalp micropigmentation"],
    "Whether any prescription or injection is involved and who supervises it.",
  ),

  /* bodywork */
  S(
    "massage-deep",
    "Deep tissue / therapeutic massage",
    "bodywork",
    "Bodywork and manual",
    ["deep tissue", "therapeutic massage", "sports massage"],
    "The therapist's massage license and the draping and pressure consent.",
  ),
  S(
    "massage-relax",
    "Relaxation / Swedish massage",
    "bodywork",
    "Bodywork and manual",
    ["swedish", "relaxation massage", "aromatherapy massage"],
    "Who is on the table with you and under which license.",
  ),
  S(
    "lymphatic",
    "Lymphatic drainage / post-op massage",
    "bodywork",
    "Bodywork and manual",
    ["lymphatic drainage", "post-op massage", "mld"],
    "Post-surgical clearance, training certificate, and coordination with the surgeon.",
  ),
  S(
    "cupping",
    "Cupping / gua sha / manual therapy",
    "bodywork",
    "Bodywork and manual",
    ["cupping", "gua sha", "myofascial"],
    "Marking expectations and the scope of the practitioner's license.",
  ),
  S(
    "body-wrap",
    "Body wrap or scrub",
    "bodywork",
    "Bodywork and manual",
    ["body wrap", "body scrub", "detox wrap"],
    "What is applied and what measurable change is actually claimed.",
  ),

  /* infusion and systemic */
  S(
    "iv-hydration",
    "IV hydration drip",
    "iv",
    "IV and infusion",
    ["iv drip", "hydration iv", "banana bag", "hangover iv"],
    "Prescriber, contents and doses, sterile compounding source, and emergency plan.",
  ),
  S(
    "iv-vitamin",
    "Vitamin or mineral infusion",
    "iv",
    "IV and infusion",
    ["vitamin drip", "myers cocktail", "glutathione iv", "vitamin c iv"],
    "Exact contents, who mixed them, and who monitors the line.",
  ),
  S(
    "iv-nad",
    "NAD+ infusion",
    "iv",
    "IV and infusion",
    ["nad", "nad+ drip"],
    "Infusion rate, monitoring, and the licensee physically present.",
  ),
  S(
    "im-shot",
    "IM vitamin or lipotropic injection",
    "iv",
    "IV and infusion",
    ["b12 shot", "lipo shot", "mic injection"],
    "Prescriber, contents, and injection site protocol.",
  ),
  S(
    "hyperbaric",
    "Hyperbaric or oxygen therapy",
    "iv",
    "IV and infusion",
    ["hyperbaric", "hbot", "oxygen chamber"],
    "Chamber type, pressure, medical clearance, and supervision.",
  ),
  S(
    "ozone-uv",
    "Ozone or UV blood therapy",
    "iv",
    "IV and infusion",
    ["ozone therapy", "uvlrx", "blood irradiation"],
    "Who performs it, what evidence is claimed, and what the consent form says.",
  ),

  /* recovery and diagnostics */
  S(
    "cryotherapy",
    "Whole-body cryotherapy",
    "other",
    "Recovery and diagnostics",
    ["cryotherapy", "cryo chamber", "cold chamber"],
    "Attendant presence, session limits, and burn/frostbite protocol.",
  ),
  S(
    "sauna-cold",
    "Sauna, cold plunge, contrast therapy",
    "other",
    "Recovery and diagnostics",
    ["infrared sauna", "cold plunge", "contrast therapy", "ice bath"],
    "Water sanitation, temperature logs, and supervision.",
  ),
  S(
    "compression",
    "Compression or pneumatic recovery",
    "other",
    "Recovery and diagnostics",
    ["normatec", "compression boots", "pressotherapy"],
    "Sleeve hygiene and contraindication screening.",
  ),
  S(
    "body-scan",
    "Body composition or skin scan",
    "other",
    "Recovery and diagnostics",
    ["inbody", "dexa", "visia", "skin analysis"],
    "Who interprets the result and whether it drives a sales recommendation.",
  ),
  S(
    "lab-panel",
    "Lab panel or biomarker program",
    "other",
    "Recovery and diagnostics",
    ["blood panel", "biomarker", "hormone panel", "food sensitivity"],
    "Ordering clinician, lab used, and who reviews abnormal results.",
  ),
  S(
    "teeth-whitening",
    "Teeth whitening",
    "other",
    "Recovery and diagnostics",
    ["teeth whitening", "led whitening", "zoom whitening"],
    "Gel concentration, who applies it, and the license that covers it.",
  ),
  S(
    "other-unnamed",
    "Something else / not named yet",
    "other",
    "Recovery and diagnostics",
    [],
    "Everything. An unnamed service cannot be checked.",
  ),
];

export const SERVICE_GROUPS = Array.from(new Set(SERVICE_CATALOG.map((s) => s.group)));

/* ------------------------------------------------- products and devices */

export interface ProductEntry {
  id: string;
  name: string;
  /** Catalog category. */
  category: string;
  /** Device platform vs injectable/topical trade name. */
  kind: "device platform" | "injectable" | "topical" | "infusion contents";
  aliases: string[];
  /** Setting class that normally operates it, as a question — not a rule. */
  normally: string;
  /** What the brand name alone does not tell you. */
  silent: string;
}

const P = (
  id: string,
  name: string,
  category: string,
  kind: ProductEntry["kind"],
  aliases: string[],
  normally: string,
  silent: string,
): ProductEntry => ({ id, name, category, kind, aliases, normally, silent });

export const PRODUCT_CATALOG: ProductEntry[] = [
  /* toxins */
  P(
    "botox",
    "Botox Cosmetic",
    "Neurotoxins",
    "injectable",
    ["botox", "onabotulinumtoxina"],
    "Prescription product; ask who prescribed and who injects.",
    "Units, dilution, injector license, and lot handling.",
  ),
  P(
    "dysport",
    "Dysport",
    "Neurotoxins",
    "injectable",
    ["dysport", "abobotulinumtoxina"],
    "Prescription product; unit scale differs from other toxins.",
    "Unit conversion, total dose, and the prescribing licensee.",
  ),
  P(
    "xeomin",
    "Xeomin",
    "Neurotoxins",
    "injectable",
    ["xeomin", "incobotulinumtoxina"],
    "Prescription product.",
    "Dose, injector license, and storage handling.",
  ),
  P(
    "jeuveau",
    "Jeuveau",
    "Neurotoxins",
    "injectable",
    ["jeuveau", "newtox"],
    "Prescription product.",
    "Dose and who holds prescribing authority.",
  ),
  P(
    "daxxify",
    "Daxxify",
    "Neurotoxins",
    "injectable",
    ["daxxify", "daxibotulinumtoxina"],
    "Prescription product.",
    "Dose, duration claims, and the injector's license.",
  ),
  /* fillers */
  P(
    "juvederm",
    "Juvéderm family",
    "Fillers",
    "injectable",
    ["juvederm", "juvéderm", "ultra xc", "voluma", "volux", "volbella"],
    "Prescription device; ask which specific product in the family.",
    "Which product, volume placed, plane, and hyaluronidase on site.",
  ),
  P(
    "restylane",
    "Restylane family",
    "Fillers",
    "injectable",
    ["restylane", "lyft", "kysse", "refyne", "defyne", "contour"],
    "Prescription device; family members differ materially.",
    "Exact product, volume, and reversal availability.",
  ),
  P(
    "rha",
    "RHA collection",
    "Fillers",
    "injectable",
    ["rha", "rha 2", "rha 3", "rha 4", "redensity"],
    "Prescription device.",
    "Which RHA, how much, and who injects.",
  ),
  P(
    "versa",
    "Revanesse Versa",
    "Fillers",
    "injectable",
    ["versa", "revanesse"],
    "Prescription device.",
    "Volume and injector license.",
  ),
  P(
    "belotero",
    "Belotero",
    "Fillers",
    "injectable",
    ["belotero"],
    "Prescription device.",
    "Placement depth and reversal plan.",
  ),
  P(
    "sculptra",
    "Sculptra",
    "Biostimulators",
    "injectable",
    ["sculptra", "poly-l-lactic"],
    "Prescription product; not reversible.",
    "Vial count, dilution, session plan, and nodule management.",
  ),
  P(
    "radiesse",
    "Radiesse",
    "Biostimulators",
    "injectable",
    ["radiesse", "calcium hydroxylapatite"],
    "Prescription product; not reversible.",
    "Dilution, plane, and who manages complications.",
  ),
  P(
    "kybella",
    "Kybella",
    "Injectable lipolytics",
    "injectable",
    ["kybella", "deoxycholic acid"],
    "Prescription product.",
    "Vials, sessions, swelling window, and nerve-injury pathway.",
  ),
  P(
    "hyaluronidase",
    "Hyaluronidase",
    "Reversal agents",
    "injectable",
    ["hyaluronidase", "hylenex", "vitrase"],
    "Prescription product kept for HA filler reversal.",
    "Whether it is on site tonight and who is licensed to inject it.",
  ),
  /* laser and light */
  P(
    "cutera",
    "Cutera platforms",
    "Laser and light",
    "device platform",
    ["cutera", "excel v", "xeo", "secret rf"],
    "Ask which handpiece and which cleared indication.",
    "Operator training, settings used, and skin-type screening.",
  ),
  P(
    "candela",
    "Candela platforms",
    "Laser and light",
    "device platform",
    ["candela", "gentlemax", "gentlelase", "vbeam", "nordlys"],
    "Ask which handpiece and wavelength.",
    "Settings, cooling, and operator credential.",
  ),
  P(
    "lumenis",
    "Lumenis platforms",
    "Laser and light",
    "device platform",
    ["lumenis", "m22", "splendorx", "acupulse", "stellar"],
    "Ask which module is being used on you.",
    "Fluence, pulse width, and who set them.",
  ),
  P(
    "sciton",
    "Sciton platforms",
    "Laser and light",
    "device platform",
    ["sciton", "bbl", "hero", "joule", "moxi", "halo"],
    "Ask which module: BBL, Moxi and Halo are different treatments.",
    "Module, settings, downtime, and operator license.",
  ),
  P(
    "alma",
    "Alma platforms",
    "Laser and light",
    "device platform",
    ["alma", "soprano", "harmony", "hybrid", "opus"],
    "Ask which applicator.",
    "Settings and training on that applicator.",
  ),
  P(
    "solta",
    "Solta platforms",
    "Laser and light",
    "device platform",
    ["fraxel", "clear + brilliant", "clear and brilliant", "thermage", "vaser"],
    "Ask which device and depth.",
    "Depth, passes, and post-care review.",
  ),
  P(
    "cynosure",
    "Cynosure platforms",
    "Laser and light",
    "device platform",
    ["cynosure", "picosure", "icon", "elite iq", "sculpsure", "potenza"],
    "Ask which platform and setting.",
    "Wavelength, energy, and who is at the controls.",
  ),
  P(
    "picoway",
    "PicoWay",
    "Laser and light",
    "device platform",
    ["picoway"],
    "Pigment and tattoo work; ask the wavelength used.",
    "Session count and blistering management.",
  ),
  /* rf, ultrasound, contouring */
  P(
    "inmode",
    "InMode platforms",
    "RF and ultrasound",
    "device platform",
    ["inmode", "morpheus8", "forma", "lumecca", "bodytite", "evoke"],
    "Ask which InMode applicator — they are different procedures.",
    "Needle depth, energy, sterile tip status, and prescriber oversight.",
  ),
  P(
    "vivace",
    "Vivace RF microneedling",
    "RF and ultrasound",
    "device platform",
    ["vivace"],
    "Ask depth and energy per zone.",
    "Tip single-use status and who selects settings.",
  ),
  P(
    "ultherapy",
    "Ultherapy",
    "RF and ultrasound",
    "device platform",
    ["ultherapy", "ulthera"],
    "Ask which transducer depths were mapped.",
    "Who mapped it and how many lines were delivered.",
  ),
  P(
    "sofwave",
    "Sofwave",
    "RF and ultrasound",
    "device platform",
    ["sofwave"],
    "Ask passes and energy.",
    "Operator credential and cleared indication.",
  ),
  P(
    "coolsculpting",
    "CoolSculpting / Elite",
    "Body contouring",
    "device platform",
    ["coolsculpting", "cool sculpting", "coolsculpting elite"],
    "Ask applicator plan and cycle count.",
    "Paradoxical hyperplasia pathway and who assesses you.",
  ),
  P(
    "emsculpt",
    "Emsculpt / Emsculpt NEO",
    "Body contouring",
    "device platform",
    ["emsculpt", "emsculpt neo", "btl"],
    "Ask contraindication screening.",
    "Metal implant screening and supervision.",
  ),
  P(
    "trusculpt",
    "truSculpt",
    "Body contouring",
    "device platform",
    ["trusculpt", "trusculpt id", "trusculpt flex"],
    "Ask which mode.",
    "Settings and expected measurement method.",
  ),
  /* microneedling and facial systems */
  P(
    "skinpen",
    "SkinPen",
    "Microneedling",
    "device platform",
    ["skinpen", "skin pen"],
    "Ask whether the cartridge is single-use and opened in front of you.",
    "Depth, topicals applied, and license held.",
  ),
  P(
    "dermapen",
    "Dermapen",
    "Microneedling",
    "device platform",
    ["dermapen", "dp4"],
    "Ask cartridge handling.",
    "Depth and what serum is driven in.",
  ),
  P(
    "hydrafacial",
    "HydraFacial",
    "Facial systems",
    "device platform",
    ["hydrafacial", "hydra facial", "syndeo"],
    "Ask which boosters and whether tips are single-use.",
    "Booster contents and tip sterilization.",
  ),
  P(
    "diamondglow",
    "DiamondGlow",
    "Facial systems",
    "device platform",
    ["diamondglow", "dermalinfusion"],
    "Ask which serum pro-infusion is used.",
    "Tip processing and serum identity.",
  ),
  /* topicals and peels */
  P(
    "zo",
    "ZO Skin Health",
    "Topical lines",
    "topical",
    ["zo skin", "zo medical", "obagi zo"],
    "Physician-dispensed line in many settings.",
    "Actual actives and percentages on the label.",
  ),
  P(
    "obagi",
    "Obagi",
    "Topical lines",
    "topical",
    ["obagi", "nu-derm", "tretinoin cream"],
    "Some products are prescription-only.",
    "Whether a prescriber is involved and at what strength.",
  ),
  P(
    "skinceuticals",
    "SkinCeuticals",
    "Topical lines",
    "topical",
    ["skinceuticals", "ce ferulic"],
    "Retail line.",
    "Concentration and whether it justifies the treatment price.",
  ),
  P(
    "biologique",
    "Biologique Recherche",
    "Topical lines",
    "topical",
    ["biologique recherche", "p50"],
    "Spa-professional line.",
    "Which P50 formulation and its acid load.",
  ),
  P(
    "vipeel",
    "VI Peel",
    "Peel systems",
    "topical",
    ["vi peel", "vi purify"],
    "Branded peel system.",
    "Acid blend, layers, and the license covering the depth.",
  ),
  P(
    "perfectderma",
    "Perfect Derma Peel",
    "Peel systems",
    "topical",
    ["perfect derma", "perfect derma peel"],
    "Branded peel system containing phenol-family agents in some versions.",
    "Exact formulation and aftercare instructions.",
  ),
  P(
    "jessner",
    "Jessner / TCA compounded peel",
    "Peel systems",
    "topical",
    ["jessner", "tca", "compounded peel"],
    "Compounded depth peel.",
    "Percentages, layers, and who compounded it.",
  ),
  /* infusion contents */
  P(
    "myers",
    "Myers' cocktail",
    "Infusion contents",
    "infusion contents",
    ["myers cocktail", "myers"],
    "Compounded infusion; ask who prescribed it.",
    "Exact contents, doses, and the compounding pharmacy.",
  ),
  P(
    "glutathione",
    "Glutathione infusion",
    "Infusion contents",
    "infusion contents",
    ["glutathione", "gluta drip"],
    "Compounded infusion.",
    "Dose, source, and what outcome is actually claimed.",
  ),
  P(
    "nad",
    "NAD+ infusion",
    "Infusion contents",
    "infusion contents",
    ["nad", "nad+"],
    "Compounded infusion.",
    "Rate, monitoring, and licensee present.",
  ),
  P(
    "saline",
    "Saline / lactated Ringer's",
    "Infusion contents",
    "infusion contents",
    ["saline", "normal saline", "lactated ringers", "lr"],
    "Prescription fluid.",
    "Who ordered it and who monitors the line.",
  ),
];

export const PRODUCT_CATEGORIES = Array.from(new Set(PRODUCT_CATALOG.map((p) => p.category)));

/* --------------------------------------------------------------- lookup */

const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

/** Catalog hit for a free-text field, or null when nothing is literally named. */
export function matchService(text: string): ServiceEntry | null {
  const t = norm(text);
  if (t.length < 3) return null;
  for (const e of SERVICE_CATALOG) {
    if (t.includes(norm(e.name))) return e;
    for (const a of e.aliases) if (a.length > 2 && t.includes(norm(a))) return e;
  }
  return null;
}

export function matchProduct(text: string): ProductEntry | null {
  const t = norm(text);
  if (t.length < 3) return null;
  for (const e of PRODUCT_CATALOG) {
    if (t.includes(norm(e.name))) return e;
    for (const a of e.aliases) if (a.length > 2 && t.includes(norm(a))) return e;
  }
  return null;
}

export function searchServices(q: string, limit = 12): ServiceEntry[] {
  const t = norm(q);
  if (!t) return SERVICE_CATALOG.slice(0, limit);
  return SERVICE_CATALOG.filter(
    (e) =>
      norm(e.name).includes(t) ||
      e.aliases.some((a) => norm(a).includes(t)) ||
      norm(e.group).includes(t),
  ).slice(0, limit);
}

export function searchProducts(q: string, limit = 12): ProductEntry[] {
  const t = norm(q);
  if (!t) return PRODUCT_CATALOG.slice(0, limit);
  return PRODUCT_CATALOG.filter(
    (e) =>
      norm(e.name).includes(t) ||
      e.aliases.some((a) => norm(a).includes(t)) ||
      norm(e.category).includes(t),
  ).slice(0, limit);
}

/** Regex built from every catalog alias, for the intake extractor. */
export const PRODUCT_ALIAS_RE = new RegExp(
  `\\b(${PRODUCT_CATALOG.flatMap((p) => [p.name, ...p.aliases])
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length)
    .join("|")})\\b`,
  "i",
);

export const SERVICE_ALIAS_RE = new RegExp(
  `\\b(${SERVICE_CATALOG.flatMap((s) => [s.name, ...s.aliases])
    .filter((s) => s.length > 3)
    .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .sort((a, b) => b.length - a.length)
    .join("|")})\\b`,
  "i",
);
