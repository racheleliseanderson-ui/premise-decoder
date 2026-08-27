import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/fast-path")({
  beforeLoad: () => {
    throw redirect({ to: "/", replace: true });
  },
  component: () => null,
});
