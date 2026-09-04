import { createFileRoute } from "@tanstack/react-router";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/cost")({
  head: () => routeHead("cost"),
  component: () => null,
});
