/**
 * Shared desk state. Every panel route reads and writes the same blocks,
 * evidence, consult notes, and library selection. Nothing leaves this browser.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useNavigate, useRouterState } from "@tanstack/react-router";
import { assess, emptyInput, type Assessment, type EvalInput, type ServiceClass } from "./engine";
import { stageStatuses } from "./pipeline";
import {
  MAX_VENUES,
  clearDesk,
  deleteSet,
  listSets,
  loadDesk,
  makeBlock,
  mergeImportedSets,
  newId,
  parseImportedSets,
  saveDesk,
  saveSet,
  type Evidence,
  type Origin,
  type PrepState,
  type SavedSet,
  type VenueBlock,
} from "./session";
import { MODE_PATH, isMode, modeFromPath, scrollToId, type GoScroll, type Mode } from "./modes";
import {
  arrivalIsUseful,
  HANDOFF_PARAM_KEYS,
  parseArrivalFromSearch,
  type Arrival,
} from "./handoff";

export interface DeskValue {
  blocks: VenueBlock[];
  active: VenueBlock;
  activeId: string;
  input: EvalInput;
  assessments: Record<string, Assessment>;
  a: Assessment;
  hasInput: boolean;
  multiUnlocked: boolean;
  compareItems: { block: VenueBlock; a: Assessment }[];
  stages: ReturnType<typeof stageStatuses>;
  sets: SavedSet[];
  savedAt: number;
  libraryClass: ServiceClass;
  loaded: string | null;
  mode: Mode;
  /**
   * Context that arrived on the link from another desk, once, on first load.
   * Null on a normal visit. It is never persisted: a handoff describes the
   * moment you crossed over, not a standing fact about this browser.
   */
  arrival: Arrival | null;
  dismissArrival: () => void;
  pdfBusy: boolean;
  comparePdfBusy: boolean;
  packetScope: "active" | "all";
  setPacketScope: (s: "active" | "all") => void;
  go: (m: Mode, opts?: { scroll?: GoScroll }) => void;
  patch: (p: Partial<EvalInput>, meta?: Record<string, Evidence>) => void;
  setField: (field: keyof EvalInput, value: string, origin?: Origin) => void;
  setActiveInput: (next: EvalInput, origin?: Origin) => void;
  setActiveId: (id: string) => void;
  addBlock: () => void;
  duplicateBlock: (id: string) => void;
  removeBlock: (id: string) => void;
  renameBlock: (id: string, name: string) => void;
  setPrep: (prep: PrepState) => void;
  setIntakeDraft: (text: string) => void;
  setLibraryClass: (c: ServiceClass) => void;
  onSaveSet: (name: string) => void;
  onDeleteSet: (id: string) => void;
  onLoadSet: (id: string) => void;
  onClearAll: () => void;
  importJson: (raw: string) => { ok: true; count: number } | { ok: false; error: string };
  setLoaded: (id: string | null) => void;
  exportPdf: () => Promise<void>;
  exportComparison: () => Promise<void>;
}

const DeskContext = createContext<DeskValue | null>(null);

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

export function DeskProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [mode, setMode] = useState<Mode>("fast");
  const [blocks, setBlocks] = useState<VenueBlock[]>(() => [makeBlock(0)]);
  const [activeId, setActiveId] = useState("");
  const [loaded, setLoaded] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [comparePdfBusy, setComparePdfBusy] = useState(false);
  const [sets, setSets] = useState<SavedSet[]>([]);
  const [savedAt, setSavedAt] = useState(0);
  const [libraryClass, setLibraryClass] = useState<ServiceClass>("unselected");
  const [packetScope, setPacketScope] = useState<"active" | "all">("active");
  const [arrival, setArrival] = useState<Arrival | null>(null);
  const hydrated = useRef(false);

  useEffect(() => {
    const stored = loadDesk();
    if (stored) {
      setBlocks(stored.blocks);
      setActiveId(stored.activeId);
      setSavedAt(stored.savedAt);
      setLibraryClass(stored.libraryClass);
      setArrival(stored.carried);
    }
    const fromUrl = modeFromPath(
      typeof window !== "undefined" ? window.location.pathname : pathname,
    );
    if (fromUrl) setMode(fromUrl);
    else setMode("fast");
    setSets(listSets());

    // A handoff is read exactly once, from the address bar, on the client.
    // It seeds nothing about the venue — see lib/handoff.ts — so it can be
    // applied before or after a restored session without conflicting with it.
    if (typeof window !== "undefined") {
      const incoming = parseArrivalFromSearch(window.location.search);
      if (incoming) {
        if (arrivalIsUseful(incoming)) {
          // A fresh link always wins over a stored one, and always re-opens the
          // notice: you crossed over again, so you are told again.
          setArrival(incoming);
          if (incoming.term) {
            const carried = incoming.term;
            const sender =
              incoming.from === "makeup" ? "Makeup Intelligence" : "Skincare Intelligence";
            setBlocks((bs) => {
              const targetId = stored?.activeId ?? bs[0]?.id;
              return bs.map((b) => {
                // Never overwrite a sentence already on the desk.
                if (b.id !== targetId || b.input.marketing.trim()) return b;
                return {
                  ...b,
                  input: { ...b.input, marketing: carried },
                  evidence: {
                    ...b.evidence,
                    // The sender is recorded on the evidence rather than baked
                    // into the origin label, so the provenance rail can name
                    // which desk it came from instead of guessing.
                    marketing: { origin: "handoff", at: Date.now(), source: sender },
                  },
                };
              });
            });
          }
        }
        // Strip the payload whether or not it was useful. A recognised sender
        // carrying nothing still left `?via=makeup&concern=...` sitting in the
        // address bar, where it was bookmarked and shared and did nothing.
        // Only this bridge's own keys are removed; the rest of the query
        // string belongs to the reader.
        const url = new URL(window.location.href);
        for (const key of HANDOFF_PARAM_KEYS) url.searchParams.delete(key);
        const qs = url.searchParams.toString();
        window.history.replaceState(
          window.history.state,
          "",
          `${url.pathname}${qs ? `?${qs}` : ""}${url.hash}`,
        );
      }
    }

    hydrated.current = true;
  }, []);

  useEffect(() => {
    const fromUrl = modeFromPath(pathname);
    if (fromUrl) setMode(fromUrl);
  }, [pathname]);

  const active = useMemo(
    () => blocks.find((b) => b.id === activeId) ?? blocks[0]!,
    [blocks, activeId],
  );

  useEffect(() => {
    if (!hydrated.current) return;
    const t = window.setTimeout(() => {
      const current = modeFromPath(typeof window !== "undefined" ? window.location.pathname : "");
      saveDesk({
        blocks,
        activeId: active.id,
        mode: current ?? mode,
        libraryClass,
        carried: arrival,
      });
      setSavedAt(Date.now());
    }, 450);
    return () => window.clearTimeout(t);
  }, [blocks, activeId, active.id, libraryClass, mode, arrival]);

  const input = active.input;

  const assessments = useMemo(() => {
    const map: Record<string, Assessment> = {};
    for (const b of blocks) map[b.id] = assess(b.input);
    return map;
  }, [blocks]);
  const a = assessments[active.id] ?? assess(emptyInput);
  const hasInput = a.posture.key !== "empty";
  const multiUnlocked = Object.values(assessments).some((x) => x.posture.key === "resolved");
  const compareItems = useMemo(
    () => blocks.map((b) => ({ block: b, a: assessments[b.id] ?? assess(b.input) })),
    [blocks, assessments],
  );
  const stages = useMemo(() => stageStatuses(a, active.evidence, null), [a, active.evidence]);

  const go = useCallback(
    (m: Mode, opts?: { scroll?: GoScroll }) => {
      setMode(m);
      const where = opts?.scroll ?? "panel";
      void navigate({ to: MODE_PATH[m], resetScroll: false }).then(() => {
        if (typeof window === "undefined") return;
        if (where === "top") window.scrollTo({ top: 0, behavior: "auto" });
        else if (where === "demos") scrollToId("demos");
        else if (where === "panel") scrollToId("work-panel");
        else if (where === "desk") scrollToId("desk");
      });
    },
    [navigate],
  );

  const patch = useCallback(
    (p: Partial<EvalInput>, meta?: Record<string, Evidence>) =>
      setBlocks((bs) =>
        bs.map((b) => {
          if (b.id !== active.id) return b;
          const evidence = { ...b.evidence };
          for (const key of Object.keys(p)) {
            const given = meta?.[key];
            const value = String((p as Record<string, unknown>)[key] ?? "");
            if (given) evidence[key] = given;
            else if (!value.trim()) delete evidence[key];
            else evidence[key] = { origin: "typed", at: Date.now() };
          }
          return { ...b, input: { ...b.input, ...p }, evidence };
        }),
      ),
    [active.id],
  );

  const setField = useCallback(
    (field: keyof EvalInput, value: string, origin: Origin = "typed") =>
      patch({ [field]: value } as Partial<EvalInput>, {
        [field]: { origin, at: Date.now() },
      }),
    [patch],
  );

  const setActiveInput = (next: EvalInput, origin: Origin = "scenario") =>
    setBlocks((bs) =>
      bs.map((b) => {
        if (b.id !== active.id) return b;
        const evidence: Record<string, Evidence> = {};
        for (const [k, v] of Object.entries(next)) {
          if (typeof v === "string" && v.trim() && k !== "serviceClass") {
            evidence[k] = { origin, at: Date.now() };
          }
        }
        return { ...b, input: { ...next }, evidence };
      }),
    );

  const addBlock = () =>
    setBlocks((bs) => {
      if (bs.length >= MAX_VENUES) return bs;
      const b = makeBlock(bs.length);
      setActiveId(b.id);
      return [...bs, b];
    });

  const duplicateBlock = (id: string) =>
    setBlocks((bs) => {
      if (bs.length >= MAX_VENUES) return bs;
      const src = bs.find((b) => b.id === id);
      if (!src) return bs;
      const copy: VenueBlock = {
        ...cloneBlock(src),
        id: newId(),
        name: `${src.name} copy`.slice(0, 48),
      };
      setActiveId(copy.id);
      return [...bs, copy];
    });

  const removeBlock = (id: string) =>
    setBlocks((bs) => {
      if (bs.length <= 1) return bs;
      const next = bs.filter((b) => b.id !== id);
      if (id === activeId) setActiveId(next[0]!.id);
      return next;
    });

  const renameBlock = (id: string, name: string) =>
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, name: name.slice(0, 48) } : b)));

  const setPrep = (prep: PrepState) =>
    setBlocks((bs) => bs.map((b) => (b.id === active.id ? { ...b, prep } : b)));

  const setIntakeDraft = (text: string) =>
    setBlocks((bs) =>
      bs.map((b) => (b.id === active.id ? { ...b, intakeDraft: text.slice(0, 12000) } : b)),
    );

  const onSaveSet = (name: string) => setSets(saveSet(name, blocks));
  const onDeleteSet = (id: string) => setSets(deleteSet(id));
  const onLoadSet = (id: string) => {
    const set = sets.find((s) => s.id === id);
    if (!set) return;
    const next = set.blocks.map(cloneBlock);
    setBlocks(next);
    setActiveId(next[0]!.id);
    setLoaded(null);
    go(next.length > 1 ? "compare" : "full");
  };
  const onClearAll = () => {
    clearDesk();
    const fresh = makeBlock(0);
    setBlocks([fresh]);
    setActiveId(fresh.id);
    setLoaded(null);
    setLibraryClass("unselected");
    // "Clear everything" has to mean everything, including what another desk
    // sent over. Otherwise the carried questions outlive the clear.
    setArrival(null);
    go("fast");
  };

  const importJson = (raw: string) => {
    const parsed = parseImportedSets(raw);
    if ("error" in parsed) return { ok: false as const, error: parsed.error };
    const next = mergeImportedSets(parsed.sets);
    setSets(next);
    return { ok: true as const, count: parsed.sets.length };
  };

  const exportPdf = async () => {
    setPdfBusy(true);
    try {
      const { downloadPacketPdf } = await import("@/lib/packet-pdf");
      const { arrivalQuestions } = await import("@/lib/handoff");
      await downloadPacketPdf(a, {
        evidence: active.evidence,
        prep: active.prep,
        carried: arrival ? arrivalQuestions(arrival) : [],
      });
    } finally {
      setPdfBusy(false);
    }
  };

  const exportComparison = async () => {
    setComparePdfBusy(true);
    try {
      const { downloadComparisonPdf } = await import("@/lib/packet-pdf");
      await downloadComparisonPdf(compareItems.map((i) => ({ name: i.block.name, a: i.a })));
    } finally {
      setComparePdfBusy(false);
    }
  };

  const value: DeskValue = {
    blocks,
    active,
    activeId: active.id,
    input,
    assessments,
    a,
    hasInput,
    multiUnlocked,
    compareItems,
    stages,
    sets,
    savedAt,
    libraryClass,
    loaded,
    mode,
    pdfBusy,
    comparePdfBusy,
    packetScope,
    arrival,
    dismissArrival: () => setArrival((a) => (a ? { ...a, noticed: true } : a)),
    setPacketScope,
    go,
    patch,
    setField,
    setActiveInput,
    setActiveId,
    addBlock,
    duplicateBlock,
    removeBlock,
    renameBlock,
    setPrep,
    setIntakeDraft,
    setLibraryClass,
    onSaveSet,
    onDeleteSet,
    onLoadSet,
    onClearAll,
    importJson,
    setLoaded,
    exportPdf,
    exportComparison,
  };

  return <DeskContext.Provider value={value}>{children}</DeskContext.Provider>;
}

export function useDesk() {
  const ctx = useContext(DeskContext);
  if (!ctx) throw new Error("useDesk must be used inside DeskProvider");
  return ctx;
}

export { isMode };
