import { useState } from "react";
import type { Assessment } from "@/lib/engine";
import type { SavedSet, VenueBlock } from "@/lib/session";
import { MAX_VENUES, relativeTime } from "@/lib/session";

/**
 * Venue block switcher. Up to MAX_VENUES settings sit on the desk at once,
 * each with its own inputs, score, and fail-closed count.
 * Multi-venue controls stay hidden until at least one venue is resolved.
 */
export function VenueBar({
  blocks,
  activeId,
  scores,
  onSelect,
  onAdd,
  onDuplicate,
  onRemove,
  onRename,
  onCompare,
  unlocked = false,
}: {
  blocks: VenueBlock[];
  activeId: string;
  scores: Record<string, Assessment>;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onCompare: () => void;
  /** True once at least one venue reaches a resolved posture. Unlocks multi-venue controls. */
  unlocked?: boolean;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const showMulti = unlocked || blocks.length > 1;

  return (
    <div className="no-print border border-rule bg-parchment/50">
      <div className="flex items-center justify-between gap-3 border-b border-rule px-4 py-2.5">
        <p className="eyebrow">
          {showMulti ? (
            <>On the desk · {blocks.length}/{MAX_VENUES}</>
          ) : (
            <>This venue</>
          )}
        </p>
        <div className="flex shrink-0 gap-1.5">
          {showMulti && blocks.length > 1 ? (
            <button type="button" className="chip hover:border-oxblood/50" onClick={onCompare}>
              Compare
            </button>
          ) : null}
          {showMulti && blocks.length < MAX_VENUES ? (
            <button type="button" className="chip hover:border-oxblood/50" onClick={onAdd}>
              + Venue
            </button>
          ) : null}
        </div>
      </div>

      <ul className="flex snap-x snap-mandatory overflow-x-auto">
        {blocks.map((b, i) => {
          const a = scores[b.id];
          const on = b.id === activeId;
          return (
            <li
              key={b.id}
              className={`min-w-[13.5rem] shrink-0 snap-start border-r border-rule p-4 transition-colors ${
                on ? "bg-oxblood-tint/35" : "bg-transparent"
              }`}
            >
              {editing === b.id ? (
                <input
                  autoFocus
                  className="field py-1 text-sm"
                  defaultValue={b.name}
                  onBlur={(e) => {
                    onRename(b.id, e.target.value.trim() || b.name);
                    setEditing(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                />
              ) : (
                <button
                  type="button"
                  onClick={() => (on ? setEditing(b.id) : onSelect(b.id))}
                  className="block w-full text-left"
                >
                  <span className="eyebrow">
                    {String(i + 1).padStart(2, "0")} {on ? "· tap to rename" : ""}
                  </span>
                  <span className="mt-1.5 block truncate font-display text-lg leading-tight text-ink">
                    {b.name}
                  </span>
                  <span className="mt-1 block truncate text-xs text-ink-soft">
                    {b.input.menuLine.trim() || "No menu line yet"}
                  </span>
                </button>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="num text-xs text-ink">
                  {a && a.posture.key !== "empty" ? `${a.place}%` : "—"}
                </span>
                <span
                  className={
                    a && a.posture.key !== "empty" && a.failClosed.length
                      ? "chip chip-fail"
                      : a && a.posture.key !== "empty"
                        ? "chip chip-known"
                        : "chip"
                  }
                >
                  {!a || a.posture.key === "empty"
                    ? "Empty"
                    : a.failClosed.length
                      ? `${a.failClosed.length} open`
                      : "Clear"}
                </span>
              </div>

              {showMulti ? (
                <div className="mt-3 flex gap-3">
                  <button
                    type="button"
                    className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-soft hover:text-oxblood"
                    onClick={() => onDuplicate(b.id)}
                  >
                    Duplicate
                  </button>
                  {blocks.length > 1 ? (
                    <button
                      type="button"
                      className="font-mono text-[0.625rem] uppercase tracking-[0.14em] text-ink-soft hover:text-oxblood"
                      onClick={() => onRemove(b.id)}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * Named saved sets. The desk autosaves continuously; a set is a deliberate,
 * named snapshot of every venue block on it.
 */
export function SavedSets({
  sets,
  savedAt,
  onSave,
  onLoad,
  onDelete,
  onClear,
}: {
  sets: SavedSet[];
  savedAt: number;
  onSave: (name: string) => void;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  return (
    <div className="no-print border border-rule bg-bone/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 text-left"
        aria-expanded={open}
      >
        <span className="min-w-0">
          <span className="eyebrow">Session</span>
          <span className="mt-1 block truncate text-sm text-ink">
            Autosaved {relativeTime(savedAt)} · {sets.length} saved set
            {sets.length === 1 ? "" : "s"}
          </span>
        </span>
        <span aria-hidden="true" className="chip shrink-0">
          {open ? "Close" : "Saved sets"}
        </span>
      </button>

      {open ? (
        <div className="rise space-y-5 border-t border-rule px-4 py-5">
          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input
              className="field"
              value={name}
              placeholder="Name this set — e.g. Two med-spas, March"
              onChange={(e) => setName(e.target.value)}
            />
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                onSave(name);
                setName("");
              }}
            >
              Save set
            </button>
          </div>

          {sets.length ? (
            <ul className="space-y-px border border-rule">
              {sets.map((s) => (
                <li
                  key={s.id}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-rule bg-parchment/50 px-4 py-3 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg leading-tight text-ink">{s.name}</p>
                    <p className="mt-0.5 text-xs text-ink-soft">
                      {s.blocks.length} venue{s.blocks.length === 1 ? "" : "s"} ·{" "}
                      {relativeTime(s.savedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      className="chip hover:border-oxblood/50"
                      onClick={() => onLoad(s.id)}
                    >
                      Load
                    </button>
                    <button
                      type="button"
                      className="chip hover:border-oxblood/50"
                      onClick={() => onDelete(s.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm italic leading-relaxed text-ink-soft">
              No saved sets yet. Everything on the desk is already autosaved in this browser — a
              named set is for keeping one comparison while you start another.
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-4">
            <p className="num text-[0.625rem] tracking-[0.14em] text-ink-soft">
              THIS BROWSER ONLY · NOTHING TRANSMITTED
            </p>
            <button type="button" className="btn-quiet" onClick={onClear}>
              Clear the whole desk
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
