/**
 * Register the Vite PWA service worker on the client only.
 *
 * The worker caches the desk shell. Venue blocks, evidence, and notes stay in
 * localStorage — the service worker does not upload or sync anything.
 */
import { registerSW } from "virtual:pwa-register";

export function registerDeskPwa() {
  if (typeof window === "undefined") return;
  registerSW({ immediate: true });
}
