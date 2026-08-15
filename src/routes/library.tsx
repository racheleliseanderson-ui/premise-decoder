import { createFileRoute } from "@tanstack/react-router";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/library")({
  head: () => routeHead("library"),
  component: () => null,
});
