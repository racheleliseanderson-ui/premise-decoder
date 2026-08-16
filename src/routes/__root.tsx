import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { PUBLICATION, shareHead } from "../lib/seo";
import { DeskProvider } from "@/lib/desk-context";
import { DeskLayout } from "@/components/desk/DeskLayout";

function NotFoundComponent() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-bone px-5">
      <div className="max-w-lg border border-rule bg-parchment px-8 py-12 text-center">
        <p className="eyebrow">404 · not on the desk</p>
        <h1 className="mt-5 font-display text-4xl leading-tight text-oxblood md:text-5xl">
          This page is not on the desk.
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-ink-soft">
          Nothing here is named. Return to the setting evaluation desk, or the publication.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link to="/fast-path" className="btn-primary">
            Fast path
          </Link>
          <a href={PUBLICATION} className="btn-quiet">
            Vanity or Vice
          </a>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    const share = shareHead("/");
    const shareImage =
      "https://i0.wp.com/vanityvice.blog/wp-content/uploads/2026/07/spa-3.jpg?resize=1200%2C630&ssl=1";
    const shareImageAlt = "Modern treatment room prepared for a spa consultation";
    const shareMeta = share.meta.map((tag) => {
      if ("property" in tag && tag.property === "og:image") return { ...tag, content: shareImage };
      if ("property" in tag && tag.property === "og:image:alt")
        return { ...tag, content: shareImageAlt };
      if ("property" in tag && tag.property === "og:image:width")
        return { ...tag, content: "1200" };
      if ("property" in tag && tag.property === "og:image:height")
        return { ...tag, content: "630" };
      if ("name" in tag && tag.name === "twitter:image") return { ...tag, content: shareImage };
      return tag;
    });
    return {
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "author", content: "Vanity or Vice" },
        ...shareMeta,
      ],

      links: [
        {
          rel: "stylesheet",
          href: appCss,
        },
        { rel: "preconnect", href: "https://fonts.googleapis.com" },
        { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
        {
          rel: "stylesheet",
          href: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Source+Sans+3:ital,wght@0,400;0,500;0,600;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;600&display=swap",
        },
        { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
        { rel: "icon", href: "/favicon.png", type: "image/png" },
        { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
        ...share.links,
      ],
    };
  },

  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <DeskProvider>
        <DeskLayout>
          <Outlet />
        </DeskLayout>
      </DeskProvider>
    </QueryClientProvider>
  );
}
