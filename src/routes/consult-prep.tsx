import { createFileRoute } from "@tanstack/react-router";
import { ConsultPrep } from "@/components/desk/Paths";
import { useDesk } from "@/lib/desk-context";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/consult-prep")({
  head: () => routeHead("prep"),
  component: ConsultPrepPage,
});

function ConsultPrepPage() {
  const desk = useDesk();
  return <ConsultPrep a={desk.a} prep={desk.active.prep} setPrep={desk.setPrep} />;
}
