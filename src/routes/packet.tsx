import { createFileRoute } from "@tanstack/react-router";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/packet")({
  head: () => routeHead("packet"),
  component: () => null,
});
