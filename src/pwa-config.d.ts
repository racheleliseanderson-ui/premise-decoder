/**
 * `vite.config.ts` imports the shared service-worker options from
 * `pwa.config.mjs`, which is plain JavaScript with no types. Without this
 * declaration `tsc --noEmit` fails on an implicit `any` — a real error in the
 * tree, since `vite.config.ts` is inside `tsconfig.include`.
 */
declare module "*/pwa.config.mjs" {
  export const workboxOptions: {
    globPatterns: string[];
    navigateFallback: string;
    navigateFallbackDenylist: RegExp[];
    runtimeCaching: Array<import("workbox-build").RuntimeCaching>;
  };
}
