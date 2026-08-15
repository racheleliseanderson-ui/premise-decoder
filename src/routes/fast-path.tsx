import { createFileRoute } from "@tanstack/react-router";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/fast-path")({
  head: () => routeHead("fast"),
  component: () => null,
});
