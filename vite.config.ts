// Build config for this app. The plugin assembly lives in ./vite.base.config.ts;
// this file only carries the options that are specific to this project.
import { defineConfig } from "./vite.base.config";
import { VitePWA } from "vite-plugin-pwa";

import { workboxOptions } from "./pwa.config.mjs";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  plugins: [
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
      // Shared with scripts/build-sw.mjs, which regenerates this worker from
      // the finished output. See pwa.config.mjs for why that is necessary.
      workbox: workboxOptions,
      devOptions: { enabled: false },
    }),
  ],
});
