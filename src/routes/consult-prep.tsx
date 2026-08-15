import { createFileRoute } from "@tanstack/react-router";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/consult-prep")({
  head: () => routeHead("prep"),
  component: () => null,
});
