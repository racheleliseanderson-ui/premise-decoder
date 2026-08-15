import { createFileRoute, Navigate } from "@tanstack/react-router";
import { MODE_PATH, SITE_DESCRIPTION, SITE_TITLE, isMode } from "@/lib/modes";
import { loadDesk } from "@/lib/session";

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

function HomeRedirect() {
  const stored = typeof window !== "undefined" ? loadDesk() : null;
  const to =
    stored && isMode(stored.mode) ? MODE_PATH[stored.mode] : MODE_PATH.fast;
  return <Navigate to={to} />;
}
