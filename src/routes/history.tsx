import { createFileRoute } from "@tanstack/react-router";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/history")({
  head: () => routeHead("history"),
  component: () => null,
});
