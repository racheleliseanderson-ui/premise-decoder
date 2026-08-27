import { createFileRoute } from "@tanstack/react-router";
import { shareHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => shareHead("/"),
  component: () => null,
});
