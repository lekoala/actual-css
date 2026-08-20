import { readFile, readdir, stat, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { brotliCompressSync } from "node:zlib";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src", "css");
const DIST = join(ROOT, "dist");

/*
 * Absolute brotli budgets. Edited by hand when the project deliberately grows;
 * build:size never rewrites its own limits, so a committed report cannot
 * silently raise the bar.
 */
const BUDGETS = {
  coreCssBrotli: 2800, // actual.min.css (current ~2482)
  fullCssBrotli: 17500, // actual.full.min.css (current ~15239)
  fullJsBrotli: 18500, // actual.full.js (current ~16025)
};

async function collectCSS(root, base = "") {
  const entries = await readdir(root, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const full = join(root, entry.name);
    const rel = base ? `${base}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
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

async function distMetrics(names) {
  const metrics = {};

  for (const name of names) {
    try {
      const code = await readFile(join(DIST, name));
      metrics[name] = {
        bytes: code.length,
        brotli: brotliCompressSync(code).length,
      };
    } catch {
      metrics[name] = null;
    }
  }

  return metrics;
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

  const dist = await distMetrics([
    "actual.css",
    "actual.min.css",
    "actual.full.css",
    "actual.full.min.css",
    "actual-themes.min.css",
    "actual.js",
    "actual.full.js",
  ]);

  // ── Print source table ─────────────────────────────────
  const colFile = 38;
  const colRaw = 10;

  console.log();
  console.log("─".repeat(colFile + 3 + colRaw));
  console.log(`  ${"File".padEnd(colFile)}  ${"Raw".padStart(colRaw)}`);
  console.log("─".repeat(colFile + 3 + colRaw));

  for (const { file, raw } of rows) {
    console.log(`  ${file.padEnd(colFile)}  ${formatBytes(raw).padStart(colRaw)}`);
  }

  console.log("─".repeat(colFile + 3 + colRaw));
  const count = `${rows.length} source files`;
  console.log(`  ${count.padEnd(colFile)}  ${formatBytes(totalRaw).padStart(colRaw)}`);
  console.log();

  // ── Dist report ────────────────────────────────────────
  const sections = [];

  if (dist["actual.min.css"]) {
    const { bytes, brotli } = dist["actual.min.css"];
    sections.push(`Core (actual.min.css): ${formatBytes(bytes)} → ${formatBytes(brotli)} brotli`);
  }
  if (dist["actual.full.min.css"]) {
    const { bytes, brotli } = dist["actual.full.min.css"];
    sections.push(`Full (actual.full.min.css): ${formatBytes(bytes)} → ${formatBytes(brotli)} brotli`);
  }
  if (dist["actual-themes.min.css"]) {
    const { bytes, brotli } = dist["actual-themes.min.css"];
    sections.push(`Themes (actual-themes.min.css): ${formatBytes(bytes)} → ${formatBytes(brotli)} brotli`);
  }
  if (dist["actual.js"]) {
    const { bytes, brotli } = dist["actual.js"];
    sections.push(`JS core (actual.js): ${formatBytes(bytes)} → ${formatBytes(brotli)} brotli`);
  }
  if (dist["actual.full.js"]) {
    const { bytes, brotli } = dist["actual.full.js"];
    sections.push(`JS full (actual.full.js): ${formatBytes(bytes)} → ${formatBytes(brotli)} brotli`);
  }

  for (const line of sections) {
    console.log(`  ${line}`);
  }
  console.log();

  // ── Budget guard ────────────────────────────────────────
  const report = {
    totalRaw,
    core: dist["actual.min.css"]
      ? { minified: dist["actual.min.css"].bytes, brotli: dist["actual.min.css"].brotli }
      : null,
    full: dist["actual.full.min.css"]
      ? { minified: dist["actual.full.min.css"].bytes, brotli: dist["actual.full.min.css"].brotli }
      : null,
    themes: dist["actual-themes.min.css"]
      ? { minified: dist["actual-themes.min.css"].bytes, brotli: dist["actual-themes.min.css"].brotli }
      : null,
    js: {
      core: dist["actual.js"]
        ? { bytes: dist["actual.js"].bytes, brotli: dist["actual.js"].brotli }
        : null,
      full: dist["actual.full.js"]
        ? { bytes: dist["actual.full.js"].bytes, brotli: dist["actual.full.js"].brotli }
        : null,
    },
    fileCount: rows.length,
    files: rows,
  };

  const guarded = [
    ["core CSS (actual.min.css)", dist["actual.min.css"]?.brotli, BUDGETS.coreCssBrotli],
    ["full CSS (actual.full.min.css)", dist["actual.full.min.css"]?.brotli, BUDGETS.fullCssBrotli],
    ["full JS (actual.full.js)", dist["actual.full.js"]?.brotli, BUDGETS.fullJsBrotli],
  ];

  const exceeded = [];
  for (const [label, brotli, limit] of guarded) {
    if (brotli == null) continue;
    const ok = brotli <= limit;
    console.log(`  ${label}: ${formatBytes(brotli)} brotli (budget ${formatBytes(limit)})${ok ? "" : " — EXCEEDED"}`);
    if (!ok) exceeded.push(label);
  }

  if (exceeded.length > 0) {
    console.error(`Size budget exceeded: ${exceeded.join(", ")}.`);
    process.exit(1);
  }

  const reportPath = join(ROOT, "size-report.json");
  let previous = null;
  try {
    previous = JSON.parse(await readFile(reportPath, "utf8"));
  } catch {
    // no previous report yet
  }

  const next = JSON.stringify(report, null, 2) + "\n";
  if (previous && JSON.stringify(previous) === JSON.stringify(report)) {
    console.log("Report unchanged");
  } else {
    await writeFile(reportPath, next);
    console.log("Report written to size-report.json");
  }
}

main();