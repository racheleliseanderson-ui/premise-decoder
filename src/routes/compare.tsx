import { createFileRoute } from "@tanstack/react-router";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/compare")({
  head: () => routeHead("compare"),
  component: () => null,
});
