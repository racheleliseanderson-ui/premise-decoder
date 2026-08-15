import { createFileRoute } from "@tanstack/react-router";
import { VenueIntake } from "@/components/desk/VenueIntake";
import { useDesk } from "@/lib/desk-context";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/venue-text")({
  head: () => routeHead("intake"),
  component: VenueTextPage,
});

function VenueTextPage() {
  const desk = useDesk();
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
