/*
 * Verify that every class used in the docs' ```html snippets is a real Actual
 * CSS class (from the reserved-classes contract) or an explicitly whitelisted
 * demo-only class.
 *
 * Run with bun run check:doc-classes.
 *
 * The reserved list (reserved-classes.json) is the single source of truth for
 * Actual class names. A snippet that reaches for a class Actual does not define
 * (like .tabset) ships a broken example to users, so it must fail here. Demo
 * pages are allowed product-specific classes; keep them in DOC_DEMO_CLASSES so
 * the whitelist stays explicit and reviewable instead of silently growing.
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { scanCodeFences } from "./docs/markdown.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PAGES = join(ROOT, "docs", "pages");
const RESERVED = JSON.parse(readFileSync(join(__dirname, "reserved-classes.json"), "utf8"));

/* Demo-only and example classes deliberately absent from the framework. Only
   add a class here when it is genuinely demo/product CSS, never to mask a typo
   or a missing framework class. */
const DOC_DEMO_CLASSES = new Set([
  "accordion-demo",
  "accordion-demo-icon",
  "actual-combobox",
  "brand",
  "code-block",
  "docs-fab-preview",
  "editorial-grid",
  "profile-aside",
  "profile-layout",
  "profile-main",
  "shell-sidebar",
  "shell-sidebar-main",
  "shell-sidebar-nav",
  "side-nav",
  "site-header",
  "tertiary",
]);

/* Pages whose snippets deliberately show another framework's vocabulary
   (Bootstrap / Tailwind migration guides). Their classes are foreign on
   purpose, so the class contract does not apply. */
const FOREIGN_FRAMEWORK_PAGES = new Set([
  "docs/pages/guides/bootstrap.md",
  "docs/pages/guides/tailwind.md",
]);

/* External icon fonts (Tabler "ti" / "ti-*") are not Actual classes. */
const isExternalIcon = (name) => name === "ti" || name.startsWith("ti-");

function walkMarkdown(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkMarkdown(full));
    else if (entry.name.endsWith(".md")) files.push(full);
  }
  return files;
}

function rel(file) {
  return relative(ROOT, file).replaceAll(sep, "/");
}

function main() {
  const issues = [];
  const known = new Set(RESERVED);

  for (const file of walkMarkdown(PAGES)) {
    const relFile = rel(file);
    if (FOREIGN_FRAMEWORK_PAGES.has(relFile)) continue;
    const markdown = readFileSync(file, "utf8");

    for (const fence of scanCodeFences(markdown)) {
      if (fence.language !== "html") continue;
      // Scan the whole fence as one string so the class attribute regex can
      // span multiple lines and accept either quote style — a single-line,
      // double-quote-only pass would miss class='…' and folded attributes.
      const attrRe = /class\s*=\s*(["'])([\s\S]*?)\1/g;
      let match;
      for (match = attrRe.exec(fence.content); match; match = attrRe.exec(fence.content)) {
        const before = fence.content.slice(0, match.index);
        const line = fence.start + 1 + (before.match(/\n/g)?.length ?? 0);
        for (const name of match[2].split(/\s+/)) {
          if (!name) continue;
          if (known.has(name) || DOC_DEMO_CLASSES.has(name) || isExternalIcon(name)) {
            continue;
          }
          issues.push(
            `${relFile}:${line}: unknown class "${name}" in snippet — add it to Actual (generate:reserved) or whitelist it as demo-only`,
          );
        }
      }
    }
  }

  if (issues.length > 0) {
    console.error("Doc class check failed.");
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }

  console.log(
    `Doc class check passed (${walkMarkdown(PAGES).length} pages, ${known.size} reserved classes).`,
  );
}

main();
