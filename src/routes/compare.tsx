import { createFileRoute } from "@tanstack/react-router";
import { Compare } from "@/components/desk/Compare";
import { useDesk } from "@/lib/desk-context";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/compare")({
  head: () => routeHead("compare"),
  component: ComparePage,
});

function ComparePage() {
  const desk = useDesk();
  return (
    <Compare
      items={desk.compareItems}
      busy={desk.comparePdfBusy}
      onDownload={desk.exportComparison}
      onOpen={(id) => {
        desk.setActiveId(id);
        desk.go("full");
      }}
    />
  );
}
