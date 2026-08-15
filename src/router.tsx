import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    // The desk is one long page with panel routes. Restoring scroll-to-top on
    // every tab click made every button look dead — the work happens at #desk.
    scrollRestoration: false,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
