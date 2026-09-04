import { createFileRoute } from "@tanstack/react-router";

import { PanelPage } from "@/components/desk/Workbench";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/compare")({
  head: () => routeHead("compare"),
  component: () => <PanelPage mode="compare" />,
});
