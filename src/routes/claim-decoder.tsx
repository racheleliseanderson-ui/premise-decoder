import { createFileRoute } from "@tanstack/react-router";
import { routeHead } from "@/lib/modes";

export const Route = createFileRoute("/claim-decoder")({
  head: () => routeHead("decode"),
  component: () => null,
});
