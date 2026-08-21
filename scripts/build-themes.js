/*
 * Demo themes bundle builder. The preset palettes in src/css/themes/ are
 * reference material, not package entrypoints — they are bundled here for
 * the demo pages and the docs site instead of dist/, keeping dist/ strictly
 * equal to the npm-published surface.
 *
 *   bun run build:themes
 */
import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { bundledCssIssues, inlineImports, minifyCss } from "./utils/css-bundle.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const THEMES_ENTRY = join(ROOT, "src", "css", "themes", "index.css");
const OUT_DIR = join(ROOT, "demo", "assets");

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

const css = await inlineImports(THEMES_ENTRY);
const code = minifyCss(css);
const issues = bundledCssIssues(code);
if (issues.length > 0) {
  throw new Error(
    `Theme bundle verification failed:\n${issues.map((issue) => `- ${issue}`).join("\n")}`,
  );
}
await mkdir(OUT_DIR, { recursive: true });
const outPath = join(OUT_DIR, "actual-themes.min.css");
await writeFile(outPath, code);
const { size } = await stat(outPath);
console.log(`Built ${outPath} (${formatBytes(size)})`);
