import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

/*
 * Presence is the aria-current contract: the attribute is set on the current
 * item and removed everywhere else, never serialized as aria-current="false".
 * A "false" value would silently defeat every generic [aria-current] rule, so
 * authored markup must not contain it. CSS prose may name the pattern to
 * forbid it — only markup is scanned, and docs prose outside html fences is
 * not markup.
 */
const FORBIDDEN = 'aria-current="false"';

function collect(dir, extension) {
  const files = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collect(path, extension));
    } else if (entry.name.endsWith(extension)) {
      files.push(path);
    }
  }
  return files;
}

/* Yield { text, line } blocks of real markup: whole html files, and html
   fences inside docs pages. Docs prose is skipped so documenting the
   prohibition does not fail its own check. */
function markupBlocks(file, source) {
  if (file.endsWith(".html")) {
    return [{ text: source, line: 1 }];
  }
  const blocks = [];
  for (const match of source.matchAll(/```html[^\n]*\n([\s\S]*?)```/g)) {
    const before = source.slice(0, match.index);
    blocks.push({
      text: match[1],
      line: before.split("\n").length,
    });
  }
  return blocks;
}

function checkFile(file) {
  const source = readFileSync(file, "utf8");
  const issues = [];
  for (const { text, line } of markupBlocks(file, source)) {
    const lines = text.split("\n");
    lines.forEach((content, index) => {
      if (content.includes(FORBIDDEN)) {
        issues.push(
          `${line + index}: markup must not use ${FORBIDDEN} — remove the attribute instead`,
        );
      }
    });
  }
  return issues;
}

function main() {
  const files = [
    ...collect(join(ROOT, "docs", "pages"), ".md"),
    ...collect(join(ROOT, "demo"), ".html"),
    ...collect(join(ROOT, "tests"), ".html"),
  ];
  let failed = false;

  for (const file of files) {
    const issues = checkFile(file);
    if (issues.length > 0) {
      failed = true;
      console.error(`${relative(ROOT, file).replaceAll(sep, "/")}:`);
      for (const issue of issues) {
        console.error(`  ${issue}`);
      }
    }
  }

  if (failed) {
    console.error("Markup check failed.");
    process.exit(1);
  }

  console.log(`Markup check passed (${files.length} files).`);
}

main();
