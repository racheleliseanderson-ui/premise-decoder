import { createFileRoute } from "@tanstack/react-router";

import { PanelPage } from "@/components/desk/Workbench";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/library")({
  head: () => routeHead("library"),
  component: () => <PanelPage mode="library" />,
});
