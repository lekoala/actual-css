import { bundle } from "lightningcss";
import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENTRY = join(ROOT, "src", "css", "actual.css");
const THEMES_ENTRY = join(ROOT, "src", "css", "themes", "index.css");
const DIST = join(ROOT, "dist");

/*
 * Browser targets. LightningCSS skips transpilation for features these
 * versions support natively, so logical properties, :is()/:where(),
 * :has(), and modern selectors stay compact in the dist.
 *
 * Coverage picks up:
 *   - Chrome 120+ / Edge 120+  :has(), :is(), :where(), logical properties, light-dark
 *   - Firefox 121+             :has(), light-dark
 *   - Safari 17.5+             :has() with full support, logical properties, light-dark
 *
 * :is(), :where(), logical properties, gap shorthands, and light-dark()
 * are all covered by these baselines. The only remaining transpilation in
 * the dist is for features already gated by @supports (color-mix,
 * backdrop-filter) whose fallbacks are set outside the gate.
 */
const targets = {
  chrome: 120 << 16,
  firefox: 121 << 16,
  safari: (17 << 16) | (5 << 8),
  edge: 120 << 16,
};

async function build({ entry = ENTRY, minify, naming }) {
  const result = await bundle({
    filename: entry,
    minify,
    targets,
    sourceMap: true,
  });

  const outPath = join(DIST, naming);
  await writeFile(outPath, result.code);
  if (result.map) {
    await writeFile(`${outPath}.map`, result.map);
  }
  return outPath;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  await mkdir(DIST, { recursive: true });

  // clean only CSS artifacts, leave JS bundles intact
  if (existsSync(DIST)) {
    const { readdir } = await import("node:fs/promises");
    for (const f of await readdir(DIST)) {
      if ((f.startsWith("actual") && f.endsWith(".css")) || f.endsWith(".css.map")) {
        await rm(join(DIST, f), { force: true });
      }
    }
  }

  const devPath = await build({ minify: false, naming: "actual.css" });
  const minPath = await build({ minify: true, naming: "actual.min.css" });
  const themesPath = await build({
    entry: THEMES_ENTRY,
    minify: true,
    naming: "actual-themes.min.css",
  });

  const [devStat, minStat, themesStat] = await Promise.all([
    stat(devPath),
    stat(minPath),
    stat(themesPath),
  ]);
  const ratio = ((1 - minStat.size / devStat.size) * 100).toFixed(1);

  console.log(`Built ${devPath} (${formatBytes(devStat.size)})`);
  console.log(`Built ${minPath} (${formatBytes(minStat.size)}) — ${ratio}% smaller`);
  console.log(`Built ${themesPath} (${formatBytes(themesStat.size)})`);
}

main();
