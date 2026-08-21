/*
 * Package distribution builder. Bundles src/css entrypoints into dist/ —
 * the npm-published surface. Demo-only assets (the theme palettes bundle)
 * are built separately by build-themes.js into demo/assets/.
 *
 *   bun run build:dist
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bundledCssIssues, inlineImports, minifyCss } from "./utils/css-bundle.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const ENTRY = join(ROOT, "src", "css", "actual.css");
const FULL_ENTRY = join(ROOT, "src", "css", "actual.full.css");
const DIST = join(ROOT, "dist");

async function build({ entry = ENTRY, minify, naming }) {
  const css = await inlineImports(entry);
  const code = minify ? minifyCss(css) : css;
  const outPath = join(DIST, naming);
  await writeFile(outPath, code);
  return outPath;
}

async function verifyDist(distDir) {
  const distFiles = ["actual.css", "actual.min.css", "actual.full.css", "actual.full.min.css"];
  let ok = true;

  for (const file of distFiles) {
    const path = join(distDir, file);
    if (!existsSync(path)) {
      console.error(`FAIL ${file}: missing`);
      ok = false;
      continue;
    }
    const content = await readFile(path, "utf8");

    for (const issue of bundledCssIssues(content)) {
      console.error(`FAIL ${file}: ${issue}`);
      ok = false;
    }
  }

  if (!ok) {
    console.error("\nDist verification FAILED");
    process.exit(1);
  }
  console.log("\nDist verification passed");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  await mkdir(DIST, { recursive: true });

  for (const f of await readdir(DIST)) {
    if ((f.startsWith("actual") && f.endsWith(".css")) || f.endsWith(".css.map")) {
      await rm(join(DIST, f), { force: true });
    }
  }

  const devPath = await build({ minify: false, naming: "actual.css" });
  const minPath = await build({ minify: true, naming: "actual.min.css" });
  const fullDevPath = await build({
    entry: FULL_ENTRY,
    minify: false,
    naming: "actual.full.css",
  });
  const fullMinPath = await build({
    entry: FULL_ENTRY,
    minify: true,
    naming: "actual.full.min.css",
  });

  const [devStat, minStat, fullDevStat, fullMinStat] = await Promise.all([
    stat(devPath),
    stat(minPath),
    stat(fullDevPath),
    stat(fullMinPath),
  ]);
  const ratio = ((1 - minStat.size / devStat.size) * 100).toFixed(1);
  const fullRatio = ((1 - fullMinStat.size / fullDevStat.size) * 100).toFixed(1);

  console.log(`Built ${devPath} (${formatBytes(devStat.size)})`);
  console.log(`Built ${minPath} (${formatBytes(minStat.size)}) - ${ratio}% smaller`);
  console.log(`Built ${fullDevPath} (${formatBytes(fullDevStat.size)})`);
  console.log(`Built ${fullMinPath} (${formatBytes(fullMinStat.size)}) - ${fullRatio}% smaller`);

  await verifyDist(DIST);
}

main();
