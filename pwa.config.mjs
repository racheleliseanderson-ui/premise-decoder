/**
 * Service-worker options, shared by the Vite plugin and the post-build step.
 *
 * The plugin generates its worker at the end of the *client* build, before
 * Nitro has assembled the deployable output, so what it writes lands in a
 * directory the host never publishes. `scripts/build-sw.mjs` regenerates the
 * worker from the finished output using these same options; keeping them here
 * means the two can never drift.
 *
 * NAVIGATION. There used to be a `navigateFallback: "/offline.html"` here, and
 * it did far more than its name suggests. In a worker built by `generateSW`,
 * `navigateFallback` registers a NavigationRoute that answers EVERY navigation
 * from the precache — not only the ones that fail. This app is server-rendered,
 * so nothing else was competing for those requests: the first visit worked
 * because no worker was controlling the page yet, and every visit after it was
 * answered with "The desk needs a connection to open" while the connection was
 * perfectly fine. The desk was, in effect, closed to anyone who came back.
 *
 * The replacement is a navigation route that goes to the network and only falls
 * back to the offline page when the request actually throws. `precacheFallback`
 * resolves `/offline.html` through the precache manifest, so the fallback is
 * still available with no connection at all — which was the only thing the old
 * setting was ever meant to buy.
 */
export const workboxOptions = {
  // Take over from the previous worker immediately. This matters more than
  // usual right now: the worker being replaced answers every navigation with
  // the offline page, so a reader stuck behind it cannot reach a page that
  // would close the last tab and let a waiting worker activate on its own.
  // Without these two, the fix ships and nobody receives it.
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,
  globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2,webmanifest}"],
  runtimeCaching: [
    {
      // Navigations: always the live server, because the desk is rendered
      // there. `NetworkOnly` rather than `NetworkFirst` on purpose — a stale
      // HTML shell paired with a fresh asset hash is a blank screen, and this
      // app has no page worth reading from a week-old cache.
      urlPattern: ({ request }) => request.mode === "navigate",
      handler: "NetworkOnly",
      options: {
        precacheFallback: { fallbackURL: "/offline.html" },
      },
    },
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
