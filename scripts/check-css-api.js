/*
 * CSS API contract check. Run with bun run check:css-api.
 *
 * Verifies the "Public hooks:" headers that declare each file's author-facing
 * customization points:
 *
 *   - every listed hook is actually referenced by the file (declared or used);
 *   - no hook is listed twice within a file.
 *
 * "Internal:" headers list properties that are derived from other hooks or
 * shared tokens, owned by state/variant rules, or positioning plumbing. They
 * are not validated (no author contract) but count as classified.
 *
 * In audit mode (--audit) it lists component-prefixed custom properties that
 * are neither listed as public hooks nor marked internal — these are
 * candidates that should be classified one way or the other.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const SRC = join(ROOT, "src", "css");
const PAGES = join(ROOT, "docs", "pages");

const audit = process.argv.includes("--audit");

function walkCss(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkCss(full));
    else if (entry.name.endsWith(".css")) files.push(full);
  }
  return files;
}

/* { public: [hook, ...], internal: [hook, ...] } from every
   "Public hooks:" / "Internal:" block in the file. A section ends at the next
   label-like line ("Child contract:", "Intent boundary —" is not label-like
   because it has no trailing colon, but "JS target contract:" is). */
function parseHookSections(css) {
  const sections = { public: [], internal: [] };
  for (const block of css.matchAll(/\/\*[\s\S]*?\*\//g)) {
    let active = null;
    for (const rawLine of block[0].split("\n")) {
      const line = rawLine.trim().replace(/^\*\s?/, "").trim();
      if (/^Public hooks:$/.test(line)) {
        active = "public";
        continue;
      }
      if (/^Internal:$/.test(line)) {
        active = "internal";
        continue;
      }
      if (active && /^[A-Za-z][A-Za-z -]*:$/.test(line)) {
        active = null; // next section (e.g. "Child contract:")
        continue;
      }
      if (active) {
        const hook = line.match(/--[a-z0-9-]+/);
        if (hook) sections[active].push(hook[0]);
      }
    }
  }
  return sections;
}

function declaredProps(css) {
  return new Set([...css.matchAll(/(?<![-\w])(--[a-z0-9-]+)\s*:/gi)].map((m) => m[1]));
}

function rel(file) {
  return relative(ROOT, file).replaceAll(sep, "/");
}

function main() {
  const issues = [];
  const unclassified = [];
  const hooksByFile = new Map();

  for (const file of walkCss(SRC)) {
    const css = readFileSync(file, "utf8");
    const { public: hooks, internal } = parseHookSections(css);
    hooksByFile.set(rel(file), new Set(hooks));

    for (const hook of hooks) {
      const referenced = new RegExp(`var\\(\\s*${hook}|${hook}\\s*:`).test(css);
      if (!referenced) {
        issues.push(`${rel(file)}: Public hooks lists ${hook} but the file never references it`);
      }
    }
    const seen = new Set();
    for (const hook of hooks) {
      if (seen.has(hook)) {
        issues.push(`${rel(file)}: hook ${hook} listed more than once`);
      }
      seen.add(hook);
    }

    if (audit) {
      const relPath = rel(file);
      const isCatalogue =
        relPath.startsWith("src/css/themes/") ||
        ["src/css/tokens.css", "src/css/theme.css", "src/css/variants.css", "src/css/utilities.css", "src/css/intents.css", "src/css/focus.css"].includes(relPath);
      if (!isCatalogue) {
        const classified = new Set([...hooks, ...internal]);
        const declared = declaredProps(css);
        for (const prop of declared) {
          if (classified.has(prop)) continue;
          if (prop.startsWith("--ui-") || prop.startsWith("--intent")) continue; // variant relay, not authored
          unclassified.push(`${relPath}: ${prop}`);
        }
      }
    }
  }

  if (issues.length > 0) {
    console.error("check:css-api failed.");
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }

  console.log(`CSS API check passed (${hooksByFile.size} files with public hooks).`);
  if (audit) {
    console.log(`\nUnclassified component-prefixed properties (declare public or internal):`);
    for (const line of unclassified) console.log(`  ${line}`);
  }
}

main();