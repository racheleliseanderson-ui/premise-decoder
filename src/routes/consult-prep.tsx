import { createFileRoute } from "@tanstack/react-router";

import { PanelPage } from "@/components/desk/Workbench";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/consult-prep")({
  head: () => routeHead("prep"),
  component: () => <PanelPage mode="prep" />,
});
