/*
 * Aligns every GFM table under docs/. Run with bun run format:docs.
 *
 * The counterpart to the table checks in check-docs.js, the same way
 * generate:reserved pairs with check:reserved: this writes the alignment, that
 * verifies it. Both read the width formula from scripts/docs/tables.js so they
 * cannot disagree.
 *
 * Alignment is cosmetic, so this only rewrites a file whose bytes actually
 * change, and it never touches the width budget — a table that formats past
 * TABLE_MAX_WIDTH is an editorial problem the check reports and a human fixes.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { formatTables } from "./docs/tables.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const DOCS = join(ROOT, "docs");

function walkMarkdown(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(full));
    else if (entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

const changed = [];
const files = walkMarkdown(DOCS);

for (const file of files) {
  const before = readFileSync(file, "utf8");
  const after = formatTables(before);
  if (after === before) continue;
  writeFileSync(file, after);
  changed.push(relative(ROOT, file).replaceAll(sep, "/"));
}

if (changed.length === 0) {
  console.log(`Doc tables already aligned (${files.length} files).`);
} else {
  console.log(`Aligned tables in ${changed.length} of ${files.length} files:`);
  for (const file of changed) console.log(`- ${file}`);
}
