import { createFileRoute, Navigate } from "@tanstack/react-router";
import { MODE_PATH, SITE_DESCRIPTION, SITE_TITLE } from "@/lib/modes";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: SITE_TITLE },
      { name: "description", content: SITE_DESCRIPTION },
      { property: "og:title", content: "Spa Intelligence · Setting Evaluation Desk" },
      { property: "og:description", content: SITE_DESCRIPTION },
      { name: "twitter:title", content: "Spa Intelligence · Setting Evaluation Desk" },
      { name: "twitter:description", content: SITE_DESCRIPTION },
    ],
  }),
  component: HomeRedirect,
});

/** `/` always opens the paste-first Fast path so the first screen is predictable. */
function HomeRedirect() {
  return <Navigate to={MODE_PATH.fast} />;
}
