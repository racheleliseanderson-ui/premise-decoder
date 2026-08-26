import { createFileRoute, Navigate } from "@tanstack/react-router";
import { MODE_PATH } from "@/lib/modes";
import { shareHead } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => shareHead("/"),
  component: HomeRedirect,
});

/** `/` always opens the paste-first Fast path so the first screen is predictable. */
function HomeRedirect() {
  return <Navigate to={MODE_PATH.fast} />;
}
