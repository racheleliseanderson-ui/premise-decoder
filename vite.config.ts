// Build config for this app. The plugin assembly lives in ./vite.base.config.ts;
// this file only carries the options that are specific to this project.
import { defineConfig, loadEnv } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsConfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import { VitePWA } from "vite-plugin-pwa";
import path from "node:path";

export default defineConfig(({ command, mode }) => {
  // Mirror the previous wrapper: inject VITE_* env into `import.meta.env` so the
  // values survive the Nitro server bundle as well as the client bundle.
  const env = loadEnv(mode, process.cwd(), "VITE_");
  const define = Object.fromEntries(
    Object.entries(env).map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  return {
    define,
    css: { transformer: "lightningcss" as const },
    resolve: {
      alias: { "@": path.resolve(process.cwd(), "src") },
      // A second copy of React or the query client breaks hooks and cache identity.
      dedupe: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react-dom/client",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
      ],
    },
    server: { host: "::", port: 8080 },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart({
        // Keep server-only modules out of the client graph.
        importProtection: {
          behavior: "error",
          client: { files: ["**/server/**"], specifiers: ["server-only"] },
        },
        // Redirect TanStack Start's bundled server entry to src/server.ts
        // (our SSR error wrapper). nitro/vite builds from this.
        server: { entry: "server" },
      }),
      // Nitro auto-detects the deploy target (Vercel, Cloudflare, Node) from the
      // build environment; cloudflare-module stays the fallback so local and
      // unknown builds behave exactly as they did before.
      ...(command === "build" ? [nitro({ defaultPreset: "cloudflare-module" })] : []),
      viteReact(),
      VitePWA({
        registerType: "autoUpdate",
        // Nitro emits the real client bundle to .output/public, not dist/.
        // Without these the service worker is written to an unserved folder and
        // precaches nothing, so the "installable desk" silently does not work.
        outDir: ".output/public",
        // Start SSR does not reliably inject the register script. We call
        // registerSW() from the client root instead.
        injectRegister: false,
        includeAssets: ["favicon.ico", "favicon.svg", "favicon.png", "pwa-mark.svg"],
        manifest: {
          id: "/",
          name: "Spa Intelligence",
          short_name: "Spa Desk",
          description:
            "See the room before you book it. Setting evaluation desk — education only. Work stays in this browser.",
          theme_color: "#7A1F2B",
          background_color: "#F7F3EC",
          display: "standalone",
          orientation: "portrait-primary",
          start_url: "/",
          scope: "/",
          lang: "en",
          categories: ["health", "lifestyle", "productivity"],
          icons: [
            {
              src: "/pwa-mark.svg",
              sizes: "any",
              type: "image/svg+xml",
              purpose: "any",
            },
            {
              src: "/favicon.png",
              sizes: "64x64",
              type: "image/png",
              purpose: "any",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
          navigateFallback: "/",
          navigateFallbackDenylist: [/^\/api\//, /^\/sitemap\.xml$/, /^\/robots\.txt$/],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: "StaleWhileRevalidate",
              options: {
                cacheName: "google-fonts-stylesheets",
                expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-webfonts",
                expiration: { maxEntries: 16, maxAgeSeconds: 60 * 60 * 24 * 365 },
              },
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
  };
});
