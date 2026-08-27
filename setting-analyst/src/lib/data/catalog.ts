import type { Freshness, RegionId, ServiceClass, VenueId } from "../engine/types.ts";

export type Provenance = {
  source: string;
  sourceType: "editorial" | "regulatory-explainer" | "catalog";
  sourceUrl: string;
  checked: string;
  freshness: Freshness;
  method: string;
};

export const CATALOG_PROVENANCE: Provenance = {
  source: "Vanity or Vice · Spa Intelligence method",
  sourceType: "editorial",
  sourceUrl: "https://vanityvice.blog/spa-intelligence/",
  checked: "2026-08-27",
  freshness: "current",
  method:
    "Menu-audit standard: exact intervention, responsible person, defined outcome, material burden, real price. Catalog names common lines so they can be quoted — it does not rank providers or clear candidacy.",
};

export type ServiceRecord = {
  id: string;
  name: string;
  serviceClass: Exclude<ServiceClass, "unselected">;
  group: string;
  aliases: string[];
  silent: string;
  burdenNote: string;
};

export type ProductRecord = {
  id: string;
  name: string;
  group: string;
  kind: "injectable" | "device platform" | "topical" | "infusion contents";
  aliases: string[];
  silent: string;
  ask: string;
  rx: boolean;
};

export type VenueRecord = {
  id: VenueId;
  label: string;
  short: string;
  oversight: "none" | "unknown" | "mixed" | "medical";
  note: string;
  burden: number;
};

export type RegionRecord = {
  id: RegionId;
  label: string;
  note: string;
};

export const SERVICE_CLASS_LABEL: Record<ServiceClass, string> = {
  unselected: "— not selected —",
  facial: "Facial / esthetic service",
  injectable: "Injectable",
  device: "Energy / device treatment",
  bodywork: "Bodywork / massage",
  chemical: "Chemical peel / resurfacing",
  iv: "IV / infusion service",
  other: "Other / not sure yet",
};

export const HIGH_BURDEN_CLASSES: ServiceClass[] = ["injectable", "device", "chemical", "iv"];

export const SERVICES: ServiceRecord[] = [
  { id: "tox-glabella", name: "Neurotoxin, glabella / frown lines", serviceClass: "injectable", group: "Injectables", aliases: ["botox", "dysport", "xeomin", "jeuveau", "daxxify", "tox", "eleven lines"], silent: "Which toxin brand, how many units, reconstitution, and who injects.", burdenNote: "Prescription biologic. Product identity and injector license are the minimum." },
  { id: "tox-lipflip", name: "Lip flip", serviceClass: "injectable", group: "Injectables", aliases: ["lip flip", "flip"], silent: "Units, brand, and whether the injector is separately licensed to inject.", burdenNote: "Same class as any neuromodulator — a cute name does not lower the burden." },
  { id: "tox-hyperhidrosis", name: "Neurotoxin for sweating", serviceClass: "injectable", group: "Injectables", aliases: ["hyperhidrosis", "underarm sweat", "sweat treatment"], silent: "Whether this is on-label use, total units, and the prescribing licensee.", burdenNote: "Indication matters. Category use is not automatic clearance." },
  { id: "filler-ha", name: "Hyaluronic acid filler", serviceClass: "injectable", group: "Injectables", aliases: ["juvederm", "juvéderm", "restylane", "rha", "versa", "belotero", "lip filler", "cheek filler"], silent: "Product line, syringe volume, placement plane, and reversal agent on site.", burdenNote: "Reversal (hyaluronidase) on site is a disclosure question, not a vibe." },
  { id: "filler-biostim", name: "Biostimulator injection", serviceClass: "injectable", group: "Injectables", aliases: ["sculptra", "radiesse", "collagen stimulator", "pla"], silent: "Vials per session, dilution, session count, and who is accountable for nodules.", burdenNote: "Not reversible the way HA is. Nodule pathway has to be named." },
  { id: "filler-deoxycholic", name: "Fat-dissolving injection", serviceClass: "injectable", group: "Injectables", aliases: ["kybella", "deoxycholic", "double chin injection", "lipolytic"], silent: "Number of vials, sessions, swelling window, and the complication pathway.", burdenNote: "Series math is the real price. Nerve-injury pathway belongs in writing." },
  { id: "prp-inject", name: "PRP / PRF injection", serviceClass: "injectable", group: "Injectables", aliases: ["prp", "prf", "platelet rich", "vampire"], silent: "Draw and spin protocol, who draws blood, and under whose license.", burdenNote: "Blood draw is a medical act. Who draws it is not a detail." },
  { id: "threads", name: "PDO / thread lift", serviceClass: "injectable", group: "Injectables", aliases: ["pdo threads", "thread lift", "barbed threads"], silent: "Thread type, count, insertion depth, and who manages migration or extrusion.", burdenNote: "Temporary device. 'Facelift' language is a claim, not a duration." },
  { id: "weight-glp", name: "Weight or metabolic injection program", serviceClass: "injectable", group: "Injectables", aliases: ["semaglutide", "tirzepatide", "glp-1", "weight loss shot", "lipo shot", "b12 injection"], silent: "Who prescribes, source of the drug, labs, monitoring, and stopping plan.", burdenNote: "Compounded source, labs, and stopping plan are identity — not add-ons." },
  { id: "hormone-pellet", name: "Hormone pellet or injection program", serviceClass: "injectable", group: "Injectables", aliases: ["pellet therapy", "hrt", "testosterone pellet", "bhrt"], silent: "Prescriber, lab baseline, dose, and follow-up interval.", burdenNote: "Prescribing relationship has to be named, not implied by the spa menu." },
  { id: "laser-hair", name: "Laser hair removal", serviceClass: "device", group: "Energy devices", aliases: ["laser hair", "diode", "alexandrite", "nd:yag", "ipl hair", "permanent hair reduction"], silent: "Device platform, wavelength, skin-type screening, and operator training.", burdenNote: "Wavelength and skin-type screening decide whether this is a service or a burn risk conversation." },
  { id: "ipl", name: "IPL / BBL photofacial", serviceClass: "device", group: "Energy devices", aliases: ["ipl", "bbl", "photofacial", "photorejuvenation"], silent: "Platform, filter, settings, and who screens for pigment risk.", burdenNote: "'Safe for everyone' is an unresolved screening claim." },
  { id: "laser-resurface", name: "Ablative or fractional resurfacing laser", serviceClass: "device", group: "Energy devices", aliases: ["co2", "fraxel", "erbium", "fractional laser", "clear + brilliant"], silent: "Depth, downtime, who operates it, and after-hours cover.", burdenNote: "Depth and after-hours cover are the product, not the brochure adjective." },
  { id: "laser-vascular", name: "Vascular / redness laser", serviceClass: "device", group: "Energy devices", aliases: ["vbeam", "pulsed dye", "kt laser", "rosacea laser"], silent: "Platform, settings, and the licensee responsible for the setting used.", burdenNote: "Settings belong to a named licensee." },
  { id: "laser-tattoo", name: "Tattoo or pigment removal laser", serviceClass: "device", group: "Energy devices", aliases: ["picosure", "picoway", "q-switched", "tattoo removal"], silent: "Wavelengths, session count, and management of blistering or scarring.", burdenNote: "Session count is the price. Blistering management is the night cover." },
  { id: "rf-skin", name: "Radiofrequency skin tightening", serviceClass: "device", group: "Energy devices", aliases: ["rf tightening", "thermage", "exilis", "venus legacy"], silent: "Platform, energy levels, and operator credential.", burdenNote: "Platform name is identity. 'Signature RF' is not." },
  { id: "rf-microneedle", name: "RF microneedling", serviceClass: "device", group: "Energy devices", aliases: ["morpheus8", "vivace", "profound", "secret rf", "rf micro"], silent: "Needle depth, energy, sterile tip handling, and prescribing oversight.", burdenNote: "Barrier-crossing device. Tip sterility and settings are checkable." },
  { id: "microneedling", name: "Microneedling", serviceClass: "device", group: "Energy devices", aliases: ["skinpen", "dermapen", "collagen induction", "micro-needling"], silent: "Cartridge single-use status, depth, topicals applied, and license held.", burdenNote: "What is driven into the channels is part of the product." },
  { id: "ultrasound-lift", name: "Ultrasound lifting", serviceClass: "device", group: "Energy devices", aliases: ["ultherapy", "hifu", "sofwave"], silent: "Platform, transducer depths, and who interprets the mapping.", burdenNote: "Mapping and line count are the treatment, not the brand." },
  { id: "cryo-contour", name: "Cryolipolysis body contouring", serviceClass: "device", group: "Energy devices", aliases: ["coolsculpting", "fat freezing", "cryolipolysis"], silent: "Applicator plan, cycle count, and the pathway for paradoxical hyperplasia.", burdenNote: "Paradoxical hyperplasia pathway has to be named before a package is prepaid." },
  { id: "ems-muscle", name: "Electromagnetic muscle stimulation", serviceClass: "device", group: "Energy devices", aliases: ["emsculpt", "emsculpt neo", "trusculpt flex"], silent: "Contraindication screening and who supervises the session.", burdenNote: "Metal-implant screening is not optional copy." },
  { id: "laser-lipo-noninv", name: "Non-invasive laser or ultrasound fat reduction", serviceClass: "device", group: "Energy devices", aliases: ["sculpsure", "ultrashape", "cavitation", "laser lipo"], silent: "Device name, session count, and what measurement is recorded.", burdenNote: "Measurement method is how a 'guarantee' would even be checked." },
  { id: "led-therapy", name: "LED light therapy", serviceClass: "device", group: "Energy devices", aliases: ["led mask", "celluma", "red light bed"], silent: "Device, wavelengths, exposure time, and eye protection.", burdenNote: "Wavelength and time are identity. A bed is not a protocol." },
  { id: "laser-vaginal", name: "Intravaginal energy device", serviceClass: "device", group: "Energy devices", aliases: ["monalisa touch", "femtouch", "vaginal rejuvenation"], silent: "Whether a physician performs it and what the cleared indication is.", burdenNote: "Cleared indication and who performs it are not brochure texture." },
  { id: "peel-superficial", name: "Superficial chemical peel", serviceClass: "chemical", group: "Peels and resurfacing", aliases: ["glycolic peel", "lactic peel", "salicylic peel", "enzyme peel"], silent: "Acid, percentage, pH, layers, and neutralization step.", burdenNote: "Percentage and pH are the product." },
  { id: "peel-medium", name: "Medium-depth chemical peel", serviceClass: "chemical", group: "Peels and resurfacing", aliases: ["tca", "jessner", "vi peel", "perfect derma peel"], silent: "Depth, downtime, sun discipline, and who reviews healing.", burdenNote: "After-hours cover for a medium peel is not a courtesy." },
  { id: "dermaplane", name: "Dermaplaning", serviceClass: "chemical", group: "Peels and resurfacing", aliases: ["dermaplaning", "blade exfoliation"], silent: "Blade single-use status and the license covering blade work.", burdenNote: "Single-use blade is a sanitation signal, not a luxury." },
  { id: "microderm", name: "Microdermabrasion / hydradermabrasion", serviceClass: "chemical", group: "Peels and resurfacing", aliases: ["microdermabrasion", "diamond tip", "hydrodermabrasion"], silent: "Tip sterilization and the serums used by name.", burdenNote: "Serum identity is the add-on that usually goes unnamed." },
  { id: "facial-classic", name: "Classic / European facial", serviceClass: "facial", group: "Facials and esthetics", aliases: ["european facial", "signature facial", "deep cleanse facial"], silent: "Product line by name and the esthetics license held.", burdenNote: "Low structural burden. Product identity still matters." },
  { id: "hydrafacial", name: "Hydradermabrasion facial", serviceClass: "facial", group: "Facials and esthetics", aliases: ["hydrafacial", "aquafacial", "glass skin facial"], silent: "Whether tips are single-use and which boosters are added.", burdenNote: "The booster is often the unresolved product." },
  { id: "facial-extraction", name: "Extraction / acne facial", serviceClass: "facial", group: "Facials and esthetics", aliases: ["acne facial", "extractions", "clarifying facial"], silent: "Instrument processing and whether lancets are used and by whom.", burdenNote: "Lancets change the license question." },
  { id: "facial-oxygen", name: "Oxygen or infusion facial", serviceClass: "facial", group: "Facials and esthetics", aliases: ["oxygen facial", "intraceuticals"], silent: "What is in the infusion and whether the claim is topical only.", burdenNote: "Infusion contents are a product, not an atmosphere." },
  { id: "facial-medgrade", name: "Advanced / clinical facial", serviceClass: "facial", group: "Facials and esthetics", aliases: ["medical grade facial", "clinical facial", "advanced facial"], silent: "Everything: this line names a tier, not a procedure.", burdenNote: "'Medical-grade' is a marketing tier. It is not a product." },
  { id: "brow-lash", name: "Lash or brow service", serviceClass: "facial", group: "Facials and esthetics", aliases: ["lash extensions", "lash lift", "brow lamination", "tinting"], silent: "Adhesive and dye by name, patch testing, and tool processing.", burdenNote: "Patch testing and adhesive name are identity." },
  { id: "wax-sugar", name: "Waxing or sugaring", serviceClass: "facial", group: "Facials and esthetics", aliases: ["brazilian wax", "sugaring", "hair removal wax"], silent: "Double-dipping policy and post-service care instructions.", burdenNote: "Sanitation policy is the service." },
  { id: "pmu", name: "Permanent makeup / microblading", serviceClass: "facial", group: "Facials and esthetics", aliases: ["microblading", "permanent makeup", "pmu", "powder brows", "lip blush"], silent: "Pigment brand, needle single-use status, bloodborne pathogen training, and the tattoo permit.", burdenNote: "Tattoo permit and pigment brand are checkable." },
  { id: "scalp-hair", name: "Scalp or hair restoration service", serviceClass: "facial", group: "Facials and esthetics", aliases: ["scalp facial", "hair restoration", "scalp micropigmentation"], silent: "Whether any prescription or injection is involved and who supervises it.", burdenNote: "If a needle or a prescription enters, the class changes." },
  { id: "massage-deep", name: "Deep tissue / therapeutic massage", serviceClass: "bodywork", group: "Bodywork and manual", aliases: ["deep tissue", "therapeutic massage", "sports massage"], silent: "The therapist's massage license and the draping and pressure consent.", burdenNote: "License and pressure consent. Low structural medical burden." },
  { id: "massage-relax", name: "Relaxation / Swedish massage", serviceClass: "bodywork", group: "Bodywork and manual", aliases: ["swedish", "relaxation massage", "aromatherapy massage"], silent: "Who is on the table with you and under which license.", burdenNote: "Named licensee still applies." },
  { id: "lymphatic", name: "Lymphatic drainage / post-op massage", serviceClass: "bodywork", group: "Bodywork and manual", aliases: ["lymphatic drainage", "post-op massage", "mld"], silent: "Post-surgical clearance, training certificate, and coordination with the surgeon.", burdenNote: "Post-op work without surgical clearance is an open gap." },
  { id: "cupping", name: "Cupping / gua sha / manual therapy", serviceClass: "bodywork", group: "Bodywork and manual", aliases: ["cupping", "gua sha", "myofascial"], silent: "Marking expectations and the scope of the practitioner's license.", burdenNote: "Scope of the license, not the tool." },
  { id: "body-wrap", name: "Body wrap or scrub", serviceClass: "bodywork", group: "Bodywork and manual", aliases: ["body wrap", "body scrub", "detox wrap"], silent: "What is applied and what measurable change is actually claimed.", burdenNote: "'Detox' is a claim. What is applied is a product." },
  { id: "iv-hydration", name: "IV hydration drip", serviceClass: "iv", group: "IV and infusion", aliases: ["iv drip", "hydration iv", "banana bag", "hangover iv"], silent: "Prescriber, contents and doses, sterile compounding source, and emergency plan.", burdenNote: "Prescriber, contents, source, emergency plan. All four." },
  { id: "iv-vitamin", name: "Vitamin or mineral infusion", serviceClass: "iv", group: "IV and infusion", aliases: ["vitamin drip", "myers cocktail", "glutathione iv", "vitamin c iv"], silent: "Exact contents, who mixed them, and who monitors the line.", burdenNote: "Who mixed it is as important as what is in it." },
  { id: "iv-nad", name: "NAD+ infusion", serviceClass: "iv", group: "IV and infusion", aliases: ["nad", "nad+ drip"], silent: "Infusion rate, monitoring, and the licensee physically present.", burdenNote: "Rate and who is in the room." },
  { id: "im-shot", name: "IM vitamin or lipotropic injection", serviceClass: "iv", group: "IV and infusion", aliases: ["b12 shot", "lipo shot", "mic injection"], silent: "Prescriber, contents, and injection site protocol.", burdenNote: "A shot still has a prescriber." },
  { id: "hyperbaric", name: "Hyperbaric or oxygen therapy", serviceClass: "iv", group: "IV and infusion", aliases: ["hyperbaric", "hbot", "oxygen chamber"], silent: "Chamber type, pressure, medical clearance, and supervision.", burdenNote: "Chamber type and medical clearance." },
  { id: "ozone-uv", name: "Ozone or UV blood therapy", serviceClass: "iv", group: "IV and infusion", aliases: ["ozone therapy", "uvlrx", "blood irradiation"], silent: "Who performs it, what evidence is claimed, and what the consent form says.", burdenNote: "Evidence and consent have to survive ordinary questions." },
  { id: "cryotherapy", name: "Whole-body cryotherapy", serviceClass: "other", group: "Recovery and diagnostics", aliases: ["cryotherapy", "cryo chamber", "cold chamber"], silent: "Attendant presence, session limits, and burn/frostbite protocol.", burdenNote: "Attendant and frostbite protocol." },
  { id: "sauna-cold", name: "Sauna, cold plunge, contrast therapy", serviceClass: "other", group: "Recovery and diagnostics", aliases: ["infrared sauna", "cold plunge", "contrast therapy", "ice bath"], silent: "Water sanitation, temperature logs, and supervision.", burdenNote: "Sanitation logs are the practice." },
  { id: "compression", name: "Compression or pneumatic recovery", serviceClass: "other", group: "Recovery and diagnostics", aliases: ["normatec", "compression boots", "pressotherapy"], silent: "Sleeve hygiene and contraindication screening.", burdenNote: "Sleeve hygiene between clients." },
  { id: "body-scan", name: "Body composition or skin scan", serviceClass: "other", group: "Recovery and diagnostics", aliases: ["inbody", "dexa", "visia", "skin analysis"], silent: "Who interprets the result and whether it drives a sales recommendation.", burdenNote: "Interpretation is a person, not a printout." },
  { id: "lab-panel", name: "Lab panel or biomarker program", serviceClass: "other", group: "Recovery and diagnostics", aliases: ["blood panel", "biomarker", "hormone panel", "food sensitivity"], silent: "Ordering clinician, lab used, and who reviews abnormal results.", burdenNote: "Who reviews an abnormal result is the night-cover question in lab form." },
  { id: "teeth-whitening", name: "Teeth whitening", serviceClass: "other", group: "Recovery and diagnostics", aliases: ["teeth whitening", "led whitening", "zoom whitening"], silent: "Gel concentration, who applies it, and the license that covers it.", burdenNote: "Concentration and license." },
  { id: "other-unnamed", name: "Something else / not named yet", serviceClass: "other", group: "Recovery and diagnostics", aliases: [], silent: "Everything. An unnamed service cannot be checked.", burdenNote: "Unnamed cannot be checked. That is the point." },
];

export const PRODUCTS: ProductRecord[] = [
  { id: "botox", name: "Botox Cosmetic", group: "Neurotoxins", kind: "injectable", aliases: ["botox", "onabotulinumtoxina"], silent: "Prescription product; ask who prescribed and who injects.", ask: "Units, dilution, injector license, and lot handling.", rx: true },
  { id: "dysport", name: "Dysport", group: "Neurotoxins", kind: "injectable", aliases: ["dysport", "abobotulinumtoxina"], silent: "Prescription product; unit scale differs from other toxins.", ask: "Unit conversion, total dose, and the prescribing licensee.", rx: true },
  { id: "xeomin", name: "Xeomin", group: "Neurotoxins", kind: "injectable", aliases: ["xeomin", "incobotulinumtoxina"], silent: "Prescription product.", ask: "Dose, injector license, and storage handling.", rx: true },
  { id: "jeuveau", name: "Jeuveau", group: "Neurotoxins", kind: "injectable", aliases: ["jeuveau", "newtox"], silent: "Prescription product.", ask: "Dose and who holds prescribing authority.", rx: true },
  { id: "daxxify", name: "Daxxify", group: "Neurotoxins", kind: "injectable", aliases: ["daxxify", "daxibotulinumtoxina"], silent: "Prescription product.", ask: "Dose, duration claims, and the injector's license.", rx: true },
  { id: "juvederm", name: "Juvéderm family", group: "Fillers", kind: "injectable", aliases: ["juvederm", "juvéderm", "ultra xc", "voluma", "volux", "volbella"], silent: "Prescription device; ask which specific product in the family.", ask: "Which product, volume placed, plane, and hyaluronidase on site.", rx: true },
  { id: "restylane", name: "Restylane family", group: "Fillers", kind: "injectable", aliases: ["restylane", "lyft", "kysse", "refyne", "defyne", "contour"], silent: "Prescription device; family members differ materially.", ask: "Exact product, volume, and reversal availability.", rx: true },
  { id: "rha", name: "RHA collection", group: "Fillers", kind: "injectable", aliases: ["rha", "rha 2", "rha 3", "rha 4", "redensity"], silent: "Prescription device.", ask: "Which RHA, how much, and who injects.", rx: true },
  { id: "versa", name: "Revanesse Versa", group: "Fillers", kind: "injectable", aliases: ["versa", "revanesse"], silent: "Prescription device.", ask: "Volume and injector license.", rx: true },
  { id: "belotero", name: "Belotero", group: "Fillers", kind: "injectable", aliases: ["belotero"], silent: "Prescription device.", ask: "Placement depth and reversal plan.", rx: true },
  { id: "sculptra", name: "Sculptra", group: "Biostimulators", kind: "injectable", aliases: ["sculptra", "poly-l-lactic"], silent: "Prescription product; not reversible.", ask: "Vial count, dilution, session plan, and nodule management.", rx: true },
  { id: "radiesse", name: "Radiesse", group: "Biostimulators", kind: "injectable", aliases: ["radiesse", "calcium hydroxylapatite"], silent: "Prescription product; not reversible.", ask: "Dilution, plane, and who manages complications.", rx: true },
  { id: "kybella", name: "Kybella", group: "Injectable lipolytics", kind: "injectable", aliases: ["kybella", "deoxycholic acid"], silent: "Prescription product.", ask: "Vials, sessions, swelling window, and nerve-injury pathway.", rx: true },
  { id: "hyaluronidase", name: "Hyaluronidase", group: "Reversal agents", kind: "injectable", aliases: ["hyaluronidase", "hylenex", "vitrase"], silent: "Prescription product kept for HA filler reversal.", ask: "Whether it is on site tonight and who is licensed to inject it.", rx: true },
  { id: "cutera", name: "Cutera platforms", group: "Laser and light", kind: "device platform", aliases: ["cutera", "excel v", "xeo", "secret rf"], silent: "Ask which handpiece and which cleared indication.", ask: "Operator training, settings used, and skin-type screening.", rx: false },
  { id: "candela", name: "Candela platforms", group: "Laser and light", kind: "device platform", aliases: ["candela", "gentlemax", "gentlelase", "vbeam", "nordlys"], silent: "Ask which handpiece and wavelength.", ask: "Settings, cooling, and operator credential.", rx: false },
  { id: "lumenis", name: "Lumenis platforms", group: "Laser and light", kind: "device platform", aliases: ["lumenis", "m22", "splendorx", "acupulse", "stellar"], silent: "Ask which module is being used on you.", ask: "Fluence, pulse width, and who set them.", rx: false },
  { id: "sciton", name: "Sciton platforms", group: "Laser and light", kind: "device platform", aliases: ["sciton", "bbl", "hero", "joule", "moxi", "halo"], silent: "Ask which module: BBL, Moxi and Halo are different treatments.", ask: "Module, settings, downtime, and operator license.", rx: false },
  { id: "alma", name: "Alma platforms", group: "Laser and light", kind: "device platform", aliases: ["alma", "soprano", "harmony", "hybrid", "opus"], silent: "Ask which applicator.", ask: "Settings and training on that applicator.", rx: false },
  { id: "solta", name: "Solta platforms", group: "Laser and light", kind: "device platform", aliases: ["fraxel", "clear + brilliant", "clear and brilliant", "thermage", "vaser"], silent: "Ask which device and depth.", ask: "Depth, passes, and post-care review.", rx: false },
  { id: "cynosure", name: "Cynosure platforms", group: "Laser and light", kind: "device platform", aliases: ["cynosure", "picosure", "icon", "elite iq", "sculpsure", "potenza"], silent: "Ask which platform and setting.", ask: "Wavelength, energy, and who is at the controls.", rx: false },
  { id: "picoway", name: "PicoWay", group: "Laser and light", kind: "device platform", aliases: ["picoway"], silent: "Pigment and tattoo work; ask the wavelength used.", ask: "Session count and blistering management.", rx: false },
  { id: "inmode", name: "InMode platforms", group: "RF and ultrasound", kind: "device platform", aliases: ["inmode", "morpheus8", "forma", "lumecca", "bodytite", "evoke"], silent: "Ask which InMode applicator — they are different procedures.", ask: "Needle depth, energy, sterile tip status, and prescriber oversight.", rx: false },
  { id: "vivace", name: "Vivace RF microneedling", group: "RF and ultrasound", kind: "device platform", aliases: ["vivace"], silent: "Ask depth and energy per zone.", ask: "Tip single-use status and who selects settings.", rx: false },
  { id: "ultherapy", name: "Ultherapy", group: "RF and ultrasound", kind: "device platform", aliases: ["ultherapy", "ulthera"], silent: "Ask which transducer depths were mapped.", ask: "Who mapped it and how many lines were delivered.", rx: false },
  { id: "sofwave", name: "Sofwave", group: "RF and ultrasound", kind: "device platform", aliases: ["sofwave"], silent: "Ask passes and energy.", ask: "Operator credential and cleared indication.", rx: false },
  { id: "coolsculpting", name: "CoolSculpting / Elite", group: "Body contouring", kind: "device platform", aliases: ["coolsculpting", "cool sculpting", "coolsculpting elite"], silent: "Ask applicator plan and cycle count.", ask: "Paradoxical hyperplasia pathway and who assesses you.", rx: false },
  { id: "emsculpt", name: "Emsculpt / Emsculpt NEO", group: "Body contouring", kind: "device platform", aliases: ["emsculpt", "emsculpt neo", "btl"], silent: "Ask contraindication screening.", ask: "Metal implant screening and supervision.", rx: false },
  { id: "trusculpt", name: "truSculpt", group: "Body contouring", kind: "device platform", aliases: ["trusculpt", "trusculpt id", "trusculpt flex"], silent: "Ask which mode.", ask: "Settings and expected measurement method.", rx: false },
  { id: "skinpen", name: "SkinPen", group: "Microneedling", kind: "device platform", aliases: ["skinpen", "skin pen"], silent: "Ask whether the cartridge is single-use and opened in front of you.", ask: "Depth, topicals applied, and license held.", rx: false },
  { id: "dermapen", name: "Dermapen", group: "Microneedling", kind: "device platform", aliases: ["dermapen", "dp4"], silent: "Ask cartridge handling.", ask: "Depth and what serum is driven in.", rx: false },
  { id: "hydrafacial", name: "HydraFacial", group: "Facial systems", kind: "device platform", aliases: ["hydrafacial", "hydra facial", "syndeo"], silent: "Ask which boosters and whether tips are single-use.", ask: "Booster contents and tip sterilization.", rx: false },
  { id: "diamondglow", name: "DiamondGlow", group: "Facial systems", kind: "device platform", aliases: ["diamondglow", "dermalinfusion"], silent: "Ask which serum pro-infusion is used.", ask: "Tip processing and serum identity.", rx: false },
  { id: "zo", name: "ZO Skin Health", group: "Topical lines", kind: "topical", aliases: ["zo skin", "zo medical", "obagi zo"], silent: "Physician-dispensed line in many settings.", ask: "Actual actives and percentages on the label.", rx: false },
  { id: "obagi", name: "Obagi", group: "Topical lines", kind: "topical", aliases: ["obagi", "nu-derm", "tretinoin cream"], silent: "Some products are prescription-only.", ask: "Whether a prescriber is involved and at what strength.", rx: false },
  { id: "skinceuticals", name: "SkinCeuticals", group: "Topical lines", kind: "topical", aliases: ["skinceuticals", "ce ferulic"], silent: "Retail line.", ask: "Concentration and whether it justifies the treatment price.", rx: false },
  { id: "biologique", name: "Biologique Recherche", group: "Topical lines", kind: "topical", aliases: ["biologique recherche", "p50"], silent: "Spa-professional line.", ask: "Which P50 formulation and its acid load.", rx: false },
  { id: "vipeel", name: "VI Peel", group: "Peel systems", kind: "topical", aliases: ["vi peel", "vi purify"], silent: "Branded peel system.", ask: "Acid blend, layers, and the license covering the depth.", rx: false },
  { id: "perfectderma", name: "Perfect Derma Peel", group: "Peel systems", kind: "topical", aliases: ["perfect derma", "perfect derma peel"], silent: "Branded peel system containing phenol-family agents in some versions.", ask: "Exact formulation and aftercare instructions.", rx: false },
  { id: "jessner", name: "Jessner / TCA compounded peel", group: "Peel systems", kind: "topical", aliases: ["jessner", "tca", "compounded peel"], silent: "Compounded depth peel.", ask: "Percentages, layers, and who compounded it.", rx: false },
  { id: "myers", name: "Myers' cocktail", group: "Infusion contents", kind: "infusion contents", aliases: ["myers cocktail", "myers"], silent: "Compounded infusion; ask who prescribed it.", ask: "Exact contents, doses, and the compounding pharmacy.", rx: true },
  { id: "glutathione", name: "Glutathione infusion", group: "Infusion contents", kind: "infusion contents", aliases: ["glutathione", "gluta drip"], silent: "Compounded infusion.", ask: "Dose, source, and what outcome is actually claimed.", rx: true },
  { id: "nad", name: "NAD+ infusion", group: "Infusion contents", kind: "infusion contents", aliases: ["nad", "nad+"], silent: "Compounded infusion.", ask: "Rate, monitoring, and licensee present.", rx: true },
  { id: "saline", name: "Saline / lactated Ringer's", group: "Infusion contents", kind: "infusion contents", aliases: ["saline", "normal saline", "lactated ringers", "lr"], silent: "Prescription fluid.", ask: "Who ordered it and who monitors the line.", rx: true },
];

export const VENUES: VenueRecord[] = [
  { id: "day-spa", label: "Day spa / wellness spa", short: "Day spa", oversight: "none", note: "Operates under cosmetology, esthetics, or massage licensing. A medical licensee is not implied by the name.", burden: 0 },
  { id: "hotel-spa", label: "Hotel / resort spa", short: "Hotel spa", oversight: "none", note: "Often staffed by rotating or contracted providers. Ask which licensed individual is working your appointment, not which brand runs the spa.", burden: 4 },
  { id: "wellness-studio", label: "Wellness studio / recovery lounge", short: "Wellness studio", oversight: "unknown", note: "Menus here mix esthetics, bodywork, and sometimes infusion or device work under one wellness label. The license behind each line has to be named separately.", burden: 8 },
  { id: "salon-suite", label: "Salon suite / independent booth rental", short: "Salon suite", oversight: "none", note: "The renter, not the building, holds the license and the liability. Ask whose license the service runs under and who answers afterwards.", burden: 10 },
  { id: "franchise-chain", label: "Franchise / chain location", short: "Franchise", oversight: "mixed", note: "Brand protocol is not oversight. Ask which licensee is responsible at this specific location, not what the national brand states.", burden: 6 },
  { id: "mobile", label: "Mobile / in-home / event service", short: "Mobile", oversight: "unknown", note: "No fixed room means no fixed sanitation setup, no autoclave on site, and no facility to return to. Sterile handling and after-hours cover carry more weight here.", burden: 14 },
  { id: "med-spa", label: "Medical spa", short: "Med spa", oversight: "mixed", note: "The label implies medical oversight without stating it. Ask who supervises, under which license, and whether they are on site while you are treated.", burden: 4 },
  { id: "dental-adjacent", label: "Dental or dental-adjacent practice", short: "Dental-adjacent", oversight: "mixed", note: "A dental license covers dentistry. Aesthetic services offered alongside it may sit inside, beside, or outside that scope — ask which license covers this specific service.", burden: 10 },
  { id: "clinic", label: "Medical clinic / physician practice", short: "Clinic", oversight: "medical", note: "A medical practice carries a named responsible licensee. That still has to be identified rather than assumed from the signage.", burden: 0 },
  { id: "unclear", label: "Unclear from marketing", short: "Unclear", oversight: "unknown", note: "The material does not resolve which kind of setting this is. Everything downstream inherits that gap.", burden: 10 },
];

export const REGIONS: RegionRecord[] = [
  { id: "unstated", label: "Not stated yet", note: "Without a jurisdiction, scope-of-practice questions cannot be aimed anywhere. Name the state or country and ask the facility which board licenses the person treating you." },
  { id: "us-ca", label: "California, US", note: "Ask which board — medical, nursing, or cosmetology — licenses the performer, and whether a good-faith examination by a licensee is required before a medical-class service." },
  { id: "us-ny", label: "New York, US", note: "Ask which licensed profession the service falls under and who holds the supervising relationship, since aesthetic medical services are commonly tied to a physician practice." },
  { id: "us-tx", label: "Texas, US", note: "Ask about delegation: who prescribes, who performs, and what written delegation or standing order covers it." },
  { id: "us-fl", label: "Florida, US", note: "Ask whether the location is a registered medical facility and who the named medical director is, in writing." },
  { id: "us-il", label: "Illinois, US", note: "Ask which license category the service sits in and whether the supervising licensee must be physically present." },
  { id: "us-az", label: "Arizona, US", note: "Ask how device and injection services are classified locally, and which board would receive a complaint." },
  { id: "us-wa", label: "Washington, US", note: "Ask which credential covers device work specifically, since energy devices are treated differently from topical esthetics." },
  { id: "us-co", label: "Colorado, US", note: "Ask which board licenses the performer and whether a medical director or delegating physician relationship is required for the service class." },
  { id: "us-nv", label: "Nevada, US", note: "Ask which license category covers injectables and devices, and whether the supervising licensee must be on site." },
  { id: "us-ga", label: "Georgia, US", note: "Ask who the supervising physician is for medical-class services and how the practice is registered locally." },
  { id: "us-other", label: "Other US state", note: "Name the state, then search that state's board for the license the performer claims. Rules on who may inject or operate devices differ state to state." },
  { id: "ca-canada", label: "Canada", note: "Ask which provincial college regulates the performer, and whether the service is a delegated medical act in that province." },
  { id: "uk", label: "United Kingdom", note: "Ask who prescribes, who administers, and whether the premises are registered with the relevant inspectorate." },
  { id: "eu", label: "European Union", note: "Ask which national health authority regulates the service and who the responsible clinician is." },
  { id: "au-nz", label: "Australia / New Zealand", note: "Ask whether a prescribing consultation is required before the appointment and who conducts it." },
  { id: "other", label: "Elsewhere / international", note: "Name the country, then ask which authority licenses the person treating you. Do not import another country's rules." },
];

export const LICENSE_TOKENS = [
  "rn",
  "np",
  "pa",
  "pa-c",
  "pac",
  "md",
  "do",
  "dnp",
  "aprn",
  "lme",
  "licensed esthetician",
  "licensed aesthetician",
  "esthetician license",
  "aesthetician license",
  "state esthetician",
  "state aesthetician",
  "lmt",
  "massage license",
  "cosmetology",
  "physician",
  "dermatologist",
  "nurse practitioner",
  "registered nurse",
  "physician assistant",
  "nurse",
  "license #",
  "lic #",
  "state license",
  "dds",
  "dmd",
  "dentist",
];

export const TITLE_TOKENS = [
  "specialist",
  "technician",
  "expert",
  "artist",
  "consultant",
  "team",
  "staff",
  "provider",
  "our girls",
  "master injector",
  "aesthetic injector",
  "injection specialist",
  "skin specialist",
  "laser technician",
];

export const TIER_LANGUAGE = [
  "medical grade",
  "medical-grade",
  "proprietary",
  "signature",
  "custom blend",
  "advanced",
  "clinical strength",
  "pharmaceutical grade",
  "our own",
  "house",
  "premium",
  "cosmeceutical",
];

export const LICENSE_GLOSSARY = [
  { abbr: "NP", expand: "nurse practitioner" },
  { abbr: "RN", expand: "registered nurse" },
  { abbr: "PA-C", expand: "physician assistant, certified" },
  { abbr: "MD", expand: "doctor of medicine" },
  { abbr: "DO", expand: "doctor of osteopathic medicine" },
  { abbr: "APRN", expand: "advanced practice registered nurse" },
  { abbr: "DNP", expand: "doctor of nursing practice" },
  { abbr: "LME", expand: "licensed medical esthetician" },
  { abbr: "LMT", expand: "licensed massage therapist" },
  { abbr: "DDS", expand: "doctor of dental surgery" },
  { abbr: "DMD", expand: "doctor of dental medicine" },
];

export const VENUE_BY_ID = Object.fromEntries(VENUES.map((v) => [v.id, v])) as Record<VenueId, VenueRecord>;
export const REGION_BY_ID = Object.fromEntries(REGIONS.map((r) => [r.id, r])) as Record<RegionId, RegionRecord>;

export function findService(text: string): ServiceRecord | null {
  const n = text.toLowerCase();
  if (!n.trim()) return null;
  return (
    SERVICES.find((s) => s.aliases.some((a) => a.length > 2 && n.includes(a))) ??
    SERVICES.find((s) => n.includes(s.name.toLowerCase())) ??
    null
  );
}

export function findProduct(text: string): ProductRecord | null {
  const n = text.toLowerCase();
  if (!n.trim()) return null;
  const ranked = PRODUCTS
    .map((p) => {
      const hit = [p.name, ...p.aliases]
        .filter((a) => a.length > 2)
        .some((a) => n.includes(a.toLowerCase()));
      return hit ? p : null;
    })
    .filter((p): p is ProductRecord => Boolean(p));
  return ranked[0] ?? null;
}
