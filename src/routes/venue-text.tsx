import { createFileRoute } from "@tanstack/react-router";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/venue-text")({
  head: () => routeHead("intake"),
  component: () => null,
});
