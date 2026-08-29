import { jumpToField } from "@/lib/fields";
import { useDesk } from "@/lib/desk-context";
import type { Mode } from "@/lib/modes";
import { Compare } from "./Compare";
import { DecisionCard } from "./DecisionCard";
import { EvidenceRail } from "./EvidenceRail";
import { ReferenceLibrary } from "./Library";
import { Packet } from "./Packet";
import { ConsultPrep, DecoderPanel, FastPath, FullEvaluate } from "./Paths";
import { VenueIntake } from "./VenueIntake";

/** Visible panel is driven by the URL. Route files only own <title> / meta. */
export function DeskPanel({ mode }: { mode: Mode }) {
  const desk = useDesk();

  if (mode === "fast") {
    return (
      <FastPath
        input={desk.input}
        patch={desk.patch}
        setField={desk.setField}
        evidence={desk.active.evidence}
        a={desk.a}
        onDeepen={() => desk.go("full")}
      />
    );
  }

  if (mode === "intake") {
    return (
      <VenueIntake
        input={desk.input}
        patch={desk.patch}
        a={desk.a}
        evidence={desk.active.evidence}
        draft={desk.active.intakeDraft}
        onDraft={desk.setIntakeDraft}
        onEvaluate={() => desk.go("full")}
      />
    );
  }

  if (mode === "full") {
    return (
      <>
        <FullEvaluate
          input={desk.input}
          patch={desk.patch}
          setField={desk.setField}
          evidence={desk.active.evidence}
          a={desk.a}
        />
        <div className="mt-14">
          <EvidenceRail
            a={desk.a}
            evidence={desk.active.evidence}
            onJump={(field) => jumpToField(field, desk.go)}
          />
        </div>
      </>
    );
  }

  if (mode === "compare") {
    return (
      <Compare
        items={desk.compareItems}
        busy={desk.comparePdfBusy}
        onDownload={() => void desk.exportComparison()}
        onOpen={(id) => {
          desk.setActiveId(id);
          desk.go("full");
        }}
      />
    );
  }

  if (mode === "prep") {
    return <ConsultPrep a={desk.a} prep={desk.active.prep} setPrep={desk.setPrep} />;
  }

  if (mode === "decode") {
    return <DecoderPanel input={desk.input} patch={desk.patch} a={desk.a} />;
  }

  if (mode === "library") {
    return (
      <ReferenceLibrary
        a={desk.a}
        openClass={desk.libraryClass}
        onOpenClass={desk.setLibraryClass}
      />
    );
  }

  const items =
    desk.packetScope === "all"
      ? desk.compareItems
      : desk.compareItems.filter((i) => i.block.id === desk.active.id);

  return (
    <div className="space-y-8">
      <div className="no-print flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-xl">
<<<<<<< Updated upstream
          <p className="eyebrow">Setting decision card · {desk.active.name}</p>
          <h2 className="display-lg mt-3 text-ink">Take it with you</h2>
          <p className="lede mt-4">
            Every field that was actually named, with the sentence it came from; every refusal;
            every unnamed item; the burden drivers, your consult notes, and the cleanest next
            verification steps. Typeset for paper. It states nothing it cannot support.
=======
          <p className="eyebrow">Before you book · {desk.active.name}</p>
          <h2 className="display-lg mt-3 text-ink">Take it with you</h2>
          <p className="lede mt-4">
            Every field that was actually named, with the sentence it came from; everything they
            declined to answer; everything the spa has not stated; what makes this service worth
            checking, your consult notes, and what to ask next. Typeset for paper. It states nothing
            it cannot support.
>>>>>>> Stashed changes
          </p>
          {desk.blocks.length > 1 ? (
            <div className="mt-5 flex flex-wrap items-center gap-1">
              <button
                type="button"
                className={desk.packetScope === "active" ? "segment segment-active" : "segment"}
                onClick={() => desk.setPacketScope("active")}
              >
                This venue
              </button>
              <button
                type="button"
                className={desk.packetScope === "all" ? "segment segment-active" : "segment"}
                onClick={() => desk.setPacketScope("all")}
              >
                All {desk.blocks.length} venues
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            className="btn-primary"
            onClick={() => void desk.exportPdf()}
            disabled={desk.pdfBusy}
          >
<<<<<<< Updated upstream
            {desk.pdfBusy ? "Preparing…" : "Download PDF"}
=======
            {desk.pdfBusy ? "Preparing…" : "Download as PDF"}
>>>>>>> Stashed changes
          </button>
          {desk.blocks.length > 1 ? (
            <button
              type="button"
              className="btn-quiet"
              onClick={() => void desk.exportComparison()}
              disabled={desk.comparePdfBusy}
            >
              {desk.comparePdfBusy ? "Preparing…" : `Comparison PDF · ${desk.blocks.length} venues`}
            </button>
          ) : null}
          <button type="button" className="btn-quiet" onClick={() => window.print()}>
<<<<<<< Updated upstream
            Print
=======
            Print this page
>>>>>>> Stashed changes
          </button>
        </div>
      </div>
      <Packet items={items} />
      <div className="no-print">
        <DecisionCard a={desk.a} />
      </div>
    </div>
  );
}
