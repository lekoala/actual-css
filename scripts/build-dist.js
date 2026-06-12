import { bundle } from "lightningcss";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENTRY = join(ROOT, "src", "actual.css");
const DIST = join(ROOT, "dist");

/*
 * Browser targets. LightningCSS skips transpilation for features these
 * versions support natively, so logical properties, :is()/:where(),
 * :has(), and modern selectors stay compact in the dist.
 *
 * Coverage picks up:
 *   - Chrome 105+ / Edge 105+  :has(), :is(), :where(), logical properties
 *   - Firefox 121+             :has()
 *   - Safari 15.4+              :has() with full support, logical properties
 *
 * :is(), :where(), logical properties, and gap shorthands are all
 * covered by these baselines, so the only remaining transpilation in
 * the dist is for features already gated by @supports (color-mix,
 * light-dark, backdrop-filter).
 */
const targets = {
  chrome: 105 << 16,
  firefox: 121 << 16,
  safari: (15 << 16) | (4 << 8),
  edge: 105 << 16,
};

async function build({ minify, naming }) {
  const result = await bundle({
    filename: ENTRY,
    minify,
    targets,
  });

  const outPath = join(DIST, naming);
  await writeFile(outPath, result.code);
  return outPath;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  if (existsSync(DIST)) {
    await rm(DIST, { recursive: true, force: true });
  }
  await mkdir(DIST, { recursive: true });

  const devPath = await build({ minify: false, naming: "actual.css" });
  const minPath = await build({ minify: true, naming: "actual.min.css" });

  const [devStat, minStat] = await Promise.all([stat(devPath), stat(minPath)]);
  const ratio = ((1 - minStat.size / devStat.size) * 100).toFixed(1);

  console.log(`Built ${devPath} (${formatBytes(devStat.size)})`);
  console.log(`Built ${minPath} (${formatBytes(minStat.size)}) — ${ratio}% smaller`);
}

main();
