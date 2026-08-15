import { createFileRoute } from "@tanstack/react-router";
import { EvidenceRail } from "@/components/desk/EvidenceRail";
import { FullEvaluate } from "@/components/desk/Paths";
import { jumpToField } from "@/components/desk/DeskLayout";
import { useDesk } from "@/lib/desk-context";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/evaluate")({
  head: () => routeHead("full"),
  component: EvaluatePage,
});

function EvaluatePage() {
  const desk = useDesk();
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
