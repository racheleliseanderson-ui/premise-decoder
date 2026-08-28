/**
 * Service-worker options, shared by the Vite plugin and the post-build step.
 *
 * The plugin generates its worker at the end of the *client* build, before
 * Nitro has assembled the deployable output, so what it writes lands in a
 * directory the host never publishes. `scripts/build-sw.mjs` regenerates the
 * worker from the finished output using these same options; keeping them here
 * means the two can never drift.
 */
export const workboxOptions = {
  globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
  // The app is server-rendered, so "/" is never precached and binding the
  // fallback to it makes Workbox throw at worker evaluation -- the worker
  // then never installs at all. Fall back to a real precached page instead.
  navigateFallback: "/offline.html",
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
};
