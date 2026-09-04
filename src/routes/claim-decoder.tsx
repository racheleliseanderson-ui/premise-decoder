import { createFileRoute } from "@tanstack/react-router";

import { PanelPage } from "@/components/desk/Workbench";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/claim-decoder")({
  head: () => routeHead("decode"),
  component: () => <PanelPage mode="decode" />,
});
