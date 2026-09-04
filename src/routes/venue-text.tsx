import { createFileRoute } from "@tanstack/react-router";

import { PanelPage } from "@/components/desk/Workbench";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/venue-text")({
  head: () => routeHead("intake"),
  component: () => <PanelPage mode="intake" />,
});
