import { createFileRoute } from "@tanstack/react-router";

import { PanelPage } from "@/components/desk/Workbench";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/packet")({
  head: () => routeHead("packet"),
  component: () => <PanelPage mode="packet" />,
});
