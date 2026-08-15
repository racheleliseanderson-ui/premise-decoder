import { createFileRoute } from "@tanstack/react-router";
import { FastPath } from "@/components/desk/Paths";
import { useDesk } from "@/lib/desk-context";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/fast-path")({
  head: () => routeHead("fast"),
  component: FastPathPage,
});

function FastPathPage() {
  const desk = useDesk();
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
