/**
 * Generate the service worker from the finished build output.
 *
 * vite-plugin-pwa runs at the end of the client build, which under this stack
 * happens before Nitro assembles the deployable directory. Its worker
 * therefore lands somewhere the host does not serve, and its precache manifest
 * is built by globbing a directory that does not yet hold the app's assets --
 * the symptom is a worker that 404s at `/sw.js` and a precache of a handful of
 * entries totalling 0 KiB.
 *
 * This runs after `vite build`, finds the directory that will actually be
 * published, and writes a worker whose precache manifest describes the files
 * that are really there.
 */
import { existsSync, readdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { generateSW } from "workbox-build";

import { workboxOptions } from "../pwa.config.mjs";

/** Output directories in the order the deploy targets prefer them. */
const CANDIDATES = [
  ".vercel/output/static", // vercel preset
  ".output/public", // node-server / cloudflare presets
  "dist/client",
];

function findOutputDir() {
  for (const candidate of CANDIDATES) {
    const dir = resolve(process.cwd(), candidate);
    if (existsSync(dir) && readdirSync(dir).length > 0) return { dir, label: candidate };
  }
  return null;
}

const target = findOutputDir();

if (!target) {
  console.error(
    `[build-sw] No build output found. Looked for: ${CANDIDATES.join(", ")}.\n` +
      "[build-sw] Run this after `vite build`.",
  );
  process.exit(1);
}

// Clear the plugin's half-built worker first so exactly one survives, and so
// its stale runtime chunk cannot be precached as an orphan.
for (const stale of readdirSync(target.dir)) {
  if (/^(sw\.js(\.map)?|workbox-[a-z0-9]+\.js(\.map)?)$/.test(stale)) {
    rmSync(resolve(target.dir, stale), { force: true });
  }
}

const { count, size, warnings } = await generateSW({
  ...workboxOptions,
  globDirectory: target.dir,
  swDest: resolve(target.dir, "sw.js"),
  // Inline the runtime rather than emitting a sibling chunk. A separate
  // workbox-<hash>.js has to be resolvable at the site root, and a host that
  // indexes its static assets at build time will not know about a file written
  // after that index was built -- the worker then 404s on its own runtime and
  // fails evaluation.
  inlineWorkboxRuntime: true,
  sourcemap: false,
});

for (const warning of warnings) console.warn(`[build-sw] ${warning}`);

// A precache of almost nothing is the exact failure this script exists to
// prevent, so treat it as a build error rather than shipping a useless worker.
if (count < 5) {
  console.error(
    `[build-sw] Precached only ${count} files from ${target.label}. ` +
      "That is not a working offline shell -- check the glob patterns and the output directory.",
  );
  process.exit(1);
}

console.log(
  `[build-sw] ${target.label}/sw.js precaches ${count} files (${(size / 1024).toFixed(1)} KiB).`,
);
