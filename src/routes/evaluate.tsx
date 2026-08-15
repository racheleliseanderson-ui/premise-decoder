import { createFileRoute } from "@tanstack/react-router";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/evaluate")({
  head: () => routeHead("full"),
  component: () => null,
});
