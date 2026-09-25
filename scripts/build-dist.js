/*
 * Package distribution builder. Bundles the full framework into dist/ — the
 * compiled half of the package contract (bare `actual-css` and
 * `actual-css/full`). The core is deliberately not compiled on its own:
 * composing adopters import `actual-css/css` sources, and a standalone core
 * artifact would reopen the alias `./core` was removed to avoid. Its size
 * budget is measured in memory by build-size.js. Demo-only assets (the theme
 * palettes bundle) are built separately by build-themes.js into demo/assets/.
 *
 *   bun run build:dist
 */
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bundledCssIssues, inlineImports, minifyCss } from "../src/tooling/css-bundle.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const FULL_ENTRY = join(ROOT, "src", "css", "actual.full.css");
const DIST = join(ROOT, "dist");

async function build({ entry = FULL_ENTRY, minify, naming }) {
  const css = await inlineImports(entry);
  const code = minify ? minifyCss(css) : css;
  const outPath = join(DIST, naming);
  await writeFile(outPath, code);
  return outPath;
}

async function verifyDist(distDir) {
  const distFiles = ["actual.full.css", "actual.full.min.css"];
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

  const fullDevPath = await build({ minify: false, naming: "actual.full.css" });
  const fullMinPath = await build({ minify: true, naming: "actual.full.min.css" });

  const [fullDevStat, fullMinStat] = await Promise.all([stat(fullDevPath), stat(fullMinPath)]);
  const fullRatio = ((1 - fullMinStat.size / fullDevStat.size) * 100).toFixed(1);

  console.log(`Built ${fullDevPath} (${formatBytes(fullDevStat.size)})`);
  console.log(`Built ${fullMinPath} (${formatBytes(fullMinStat.size)}) - ${fullRatio}% smaller`);

  await verifyDist(DIST);
}

main();
