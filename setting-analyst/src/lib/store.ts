import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEMOS } from "@/lib/data/demos";
import { EMPTY_INPUT, type DeskInput, type Mode, type SavedScenario } from "@/lib/engine/types";

export type Theme = "pearl" | "dark" | "cvd";

type DeskState = {
  input: DeskInput;
  mode: Mode;
  theme: Theme;
  paste: string;
  saved: SavedScenario[];
  compareIds: string[];
  lastSavedAt: string | null;
  hydrateCompare: boolean;
  setInput: (patch: Partial<DeskInput>) => void;
  replaceInput: (input: DeskInput) => void;
  setMode: (mode: Mode) => void;
  setTheme: (theme: Theme) => void;
  setPaste: (paste: string) => void;
  loadDemo: (id: string) => void;
  clearDesk: () => void;
  saveNamed: (name: string) => void;
  duplicateCurrent: () => void;
  renameSaved: (id: string, name: string) => void;
  deleteSaved: (id: string) => void;
  pinSaved: (id: string) => void;
  loadSaved: (id: string) => void;
  toggleCompare: (id: string) => void;
};

function uid() {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export const useDesk = create<DeskState>()(
  persist(
    (set, get) => ({
      input: EMPTY_INPUT,
      mode: "fast",
      theme: "pearl",
      paste: "",
      saved: [],
      compareIds: [],
      lastSavedAt: null,
      hydrateCompare: false,
      setInput: (patch) => set({ input: { ...get().input, ...patch }, lastSavedAt: new Date().toISOString() }),
      replaceInput: (input) => set({ input, lastSavedAt: new Date().toISOString() }),
      setMode: (mode) => set({ mode }),
      setTheme: (theme) => set({ theme }),
      setPaste: (paste) => set({ paste }),
      loadDemo: (id) => {
        const demo = DEMOS.find((d) => d.id === id);
        if (!demo) return;
        set({ input: { ...demo.input }, mode: "fast", lastSavedAt: new Date().toISOString() });
      },
      clearDesk: () => set({ input: EMPTY_INPUT, paste: "", lastSavedAt: new Date().toISOString() }),
      saveNamed: (name) => {
        const { input, saved } = get();
        const scenario: SavedScenario = {
          id: uid(),
          name: name.trim() || input.venueName || input.menuLine || "Untitled setting",
          savedAt: new Date().toISOString(),
          input: { ...input },
          pinned: false,
        };
        set({ saved: [scenario, ...saved].slice(0, 24), lastSavedAt: scenario.savedAt });
      },
      duplicateCurrent: () => {
        const { input } = get();
        const copy: DeskInput = {
          ...input,
          venueName: input.venueName ? `${input.venueName} (copy)` : "Copy",
        };
        set({ input: copy, lastSavedAt: new Date().toISOString() });
      },
      renameSaved: (id, name) =>
        set({ saved: get().saved.map((s) => (s.id === id ? { ...s, name } : s)) }),
      deleteSaved: (id) =>
        set({
          saved: get().saved.filter((s) => s.id !== id),
          compareIds: get().compareIds.filter((x) => x !== id),
        }),
      pinSaved: (id) =>
        set({
          saved: get().saved.map((s) => (s.id === id ? { ...s, pinned: !s.pinned } : s)),
        }),
      loadSaved: (id) => {
        const found = get().saved.find((s) => s.id === id);
        if (found) set({ input: { ...found.input }, mode: "fast" });
      },
      toggleCompare: (id) => {
        const { compareIds } = get();
        if (compareIds.includes(id)) {
          set({ compareIds: compareIds.filter((x) => x !== id) });
          return;
        }
        if (compareIds.length >= 5) return;
        set({ compareIds: [...compareIds, id] });
      },
    }),
    {
      name: "spa-intelligence-desk-v2",
      skipHydration: true,
      partialize: (s) => ({
        input: s.input,
        theme: s.theme,
        saved: s.saved,
        compareIds: s.compareIds,
        lastSavedAt: s.lastSavedAt,
      }),
    },
  ),
);
