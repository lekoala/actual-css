import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src", "css");
const DIST = join(ROOT, "dist");

const EXCLUDE = ["optional"];
const MAX_SHIPPED_BROTLI = 13 * 1024;

async function collectCSS(root, base = "") {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = join(root, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      if (EXCLUDE.includes(entry.name)) continue;
      files.push(...(await collectCSS(full, rel)));
    } else if (entry.name.endsWith(".css")) {
      files.push(rel);
    }
  }

  return files;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  const cssFiles = await collectCSS(SRC);

  const rows = [];
  let totalRaw = 0;

  for (const rel of cssFiles) {
    const st = await stat(join(SRC, rel));
    totalRaw += st.size;
    rows.push({ file: rel, raw: st.size });
  }

  rows.sort((a, b) => b.raw - a.raw || a.file.localeCompare(b.file, "en"));

  // ── Dist sizes ──────────────────────────────────────────
  let devSize = 0;
  let minSize = 0;
  let brotliSize = 0;
  let themesMinSize = 0;
  let themesBrotliSize = 0;

  try {
    const devPath = join(DIST, "actual.css");
    const minPath = join(DIST, "actual.min.css");
    const themesMinPath = join(DIST, "actual-themes.min.css");
    const [devSt, minSt, themesMinSt] = await Promise.all([
      stat(devPath),
      stat(minPath),
      stat(themesMinPath).catch(() => null),
    ]);
    devSize = devSt.size;
    minSize = minSt.size;

    const minCode = await readFile(minPath);
    brotliSize = brotliCompressSync(minCode).length;

    if (themesMinSt) {
      themesMinSize = themesMinSt.size;
      const themesMinCode = await readFile(themesMinPath);
      themesBrotliSize = brotliCompressSync(themesMinCode).length;
    }
  } catch {
    // dist doesn't exist yet
  }

  // ── Print table ────────────────────────────────────────
  const hasDist = devSize > 0;
  const colFile = 38;
  const colRaw = 10;
  const colMin = 10;
  const colBr = 10;

  const sepLen = colFile + 3 + colRaw + (hasDist ? 4 + colMin + 4 + colBr : 0);
  const sep = "─".repeat(sepLen);

  console.log();
  console.log(sep);
  let header = `  ${"File".padEnd(colFile)}  ${"Raw".padStart(colRaw)}`;
  if (hasDist) {
    header += `   ${"Minified".padStart(colMin)}   ${"Brotli".padStart(colBr)}`;
  }
  console.log(header);
  console.log(sep);

  for (const { file, raw } of rows) {
    const line = `  ${file.padEnd(colFile)}  ${formatBytes(raw).padStart(colRaw)}`;
    console.log(line);
  }

  console.log(sep);
  const count = `${rows.length} source files`;
  let totalLine = `  ${count.padEnd(colFile)}  ${formatBytes(totalRaw).padStart(colRaw)}`;
  if (hasDist) {
    totalLine += `   ${formatBytes(minSize).padStart(colMin)}   ${formatBytes(brotliSize).padStart(colBr)}`;
  }
  console.log(totalLine);

  if (hasDist) {
    const ratio =
      brotliSize > 0
        ? `${formatBytes(minSize)} minified → ${formatBytes(brotliSize)} brotli (${((brotliSize / minSize) * 100).toFixed(1)}% of minified)`
        : "";
    console.log(`  ${" ".padEnd(colFile)}  ${" ".padStart(colRaw)}   ${ratio}`);

    if (themesMinSize > 0) {
      const themesLabel = "    actual-themes.min.css";
      const themesLine = `  ${themesLabel.padEnd(colFile)}  ${" ".padStart(colRaw)}   ${formatBytes(themesMinSize).padStart(colMin)}   ${formatBytes(themesBrotliSize).padStart(colBr)}`;
      console.log(themesLine);
      const themesRatio = `${formatBytes(themesMinSize)} → ${formatBytes(themesBrotliSize)} brotli (${((themesBrotliSize / themesMinSize) * 100).toFixed(1)}%)`;
      console.log(`  ${" ".padEnd(colFile)}  ${" ".padStart(colRaw)}   ${themesRatio}`);
      const shipped = `${formatBytes(minSize)} shipped minified → ${formatBytes(brotliSize)} brotli`;
      console.log(`  ${" ".padEnd(colFile)}  ${" ".padStart(colRaw)}   ${shipped}`);
    }
  }

  console.log(sep);
  console.log();

  // ── Write report ───────────────────────────────────────
  const report = {
    totalRaw,
    totalMinified: minSize,
    totalBrotli: brotliSize,
    themesMinified: themesMinSize,
    themesBrotli: themesBrotliSize,
    shippedMinified: minSize,
    shippedBrotli: brotliSize,
    maxShippedBrotli: MAX_SHIPPED_BROTLI,
    fileCount: rows.length,
    files: rows,
  };

  const reportPath = join(ROOT, "size-report.json");
  const next = JSON.stringify(report, null, 2) + "\n";
  let previous = null;
  try {
    previous = await readFile(reportPath, "utf8");
  } catch {
    // no previous report yet
  }
  if (previous === next) {
    console.log("Report unchanged");
  } else {
    await writeFile(reportPath, next);
    console.log("Report written to size-report.json");
  }

  if (hasDist && report.shippedBrotli > MAX_SHIPPED_BROTLI) {
    console.error(
      `Size budget exceeded: shipped brotli is ${formatBytes(report.shippedBrotli)} (max ${formatBytes(MAX_SHIPPED_BROTLI)}).`,
    );
    process.exit(1);
  }
}

main();
