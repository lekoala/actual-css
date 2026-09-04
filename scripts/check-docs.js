/*
 * Structural checks for the docs site. Run with bun run check:docs.
 *
 * Verifies navigation.json against docs/pages, that every page is well-formed
 * (one H1, explicit fence languages, balanced demo markup, tables that stay
 * readable in the source), that slugs are unique, and that internal links
 * (including anchors) resolve.
 *
 * The table check also covers docs/design-notes, which is hand-edited markdown
 * outside the site navigation.
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, normalize, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { extractAliases, render, scanCodeFences } from "./docs/markdown.js";
import { loadNavigation } from "./docs/navigation.js";
import { findTables, formatTable, measureTable, TABLE_MAX_WIDTH } from "./docs/tables.js";
import { relHref } from "./docs/templates.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PAGES = join(ROOT, "docs", "pages");
const NOTES = join(ROOT, "docs", "design-notes");
const SITE = join(ROOT, "site");

const FENCE_LANGUAGES = new Set(["html", "css", "js", "javascript", "sh", "text"]);
const KNOWN_FENCE_FLAGS = new Set(["demo", "bare", "resize"]);

/*
 * Two things about every table, both measured on its *formatted* form rather
 * than on the bytes: `format:docs` owns the alignment, so a check that read
 * the raw lines would report a ragged table that is one command away from
 * being fine, and would miss a ragged table whose 200-char cell explodes the
 * moment it is aligned.
 *
 * The width is one issue per table rather than per row, because alignment
 * means one long cell makes every row too wide and the fix is always that one
 * cell. The report names the cell to shorten.
 */
function tableIssues(markdown, label) {
  const issues = [];

  for (const table of findTables(markdown)) {
    const line = table.start + 1;
    const { formattedWidth, widestCell } = measureTable(table);

    if (formattedWidth > TABLE_MAX_WIDTH) {
      const size = [...widestCell].length;
      const excerpt = size > 50 ? `${[...widestCell].slice(0, 50).join("")}…` : widestCell;
      issues.push(
        `${label}:${line}: table is ${formattedWidth} chars wide once aligned (max ${TABLE_MAX_WIDTH}) — shorten its widest cell (${size} chars: "${excerpt}") and move the detail into prose below the table`,
      );
      // Alignment is not worth reporting on a table that has to be rewritten.
      continue;
    }

    if (formatTable(table).join("\n") !== table.rows.join("\n")) {
      issues.push(`${label}:${line}: table is not aligned — run \`bun run format:docs\``);
    }
  }

  return issues;
}

/*
 * A demo fence is injected raw into `.docs-preview`, so an unbalanced tag does
 * not stay inside the example: one extra `</div>` closes the preview early and
 * the code block, the prose after it, and the rest of the page escape their
 * container. The browser recovers silently, which is why this has to be a
 * check rather than something the page would visibly complain about.
 *
 * Void elements never take a closing tag, and the optional-close set is legal
 * HTML without one, so both are skipped rather than tracked — a stack that
 * expected `</li>` would report correct markup. That trades away detection of
 * a stray `</li>`, which the HTML parser drops without moving the tree, for no
 * false positives on the failure that actually reshapes the page.
 */
const VOID_ELEMENTS = new Set(
  "area base br col embed hr img input link meta param source track wbr".split(" "),
);
const OPTIONAL_CLOSE = new Set("li p dt dd td th tr thead tbody tfoot option optgroup".split(" "));

/* Comments can hold anything, tag-shaped text included. Blanking them in place
   keeps every later line number honest. */
function blankComments(html) {
  return html.replace(/<!--[\s\S]*?-->/gu, (match) => match.replace(/[^\n]/gu, " "));
}

function countLines(text) {
  return text.split("\n").length - 1;
}

function demoMarkupIssues(fence, label) {
  const issues = [];
  const stack = [];
  const source = blankComments(fence.content);

  for (const match of source.matchAll(/<(\/?)([a-zA-Z][\w:-]*)([^>]*?)(\/?)>/gu)) {
    const [, closing, rawName, , selfClosing] = match;
    const name = rawName.toLowerCase();
    if (VOID_ELEMENTS.has(name) || OPTIONAL_CLOSE.has(name) || selfClosing) continue;

    // fence.content starts one line after the fence marker.
    const line = fence.start + 2 + countLines(source.slice(0, match.index));

    if (!closing) {
      stack.push({ name, line });
      continue;
    }

    const open = stack.pop();
    if (!open) {
      issues.push(
        `${label}:${line}: demo fence has an extra </${name}> — it closes .docs-preview and pushes the rest of the page out of the example`,
      );
      return issues;
    }
    if (open.name !== name) {
      issues.push(
        `${label}:${line}: demo fence closes </${name}> while <${open.name}> (line ${open.line}) is still open`,
      );
      return issues;
    }
  }

  for (const open of stack.reverse()) {
    issues.push(`${label}:${open.line}: demo fence leaves <${open.name}> unclosed`);
  }

  return issues;
}

function isExternal(href) {
  return /^(?:[a-z]+:)?\/\//iu.test(href) || /^(?:mailto|tel):/iu.test(href);
}

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
  const navigation = loadNavigation(ROOT);
  const manifestFiles = new Map(
    navigation.pages.map((page) => [join(PAGES, page.file), { page, toc: [] }]),
  );

  const actualFiles = walkMarkdown(PAGES);

  for (const file of actualFiles) {
    if (!manifestFiles.has(file)) {
      issues.push(`${rel(file)}: not listed in docs/navigation.json`);
    }
  }

  /* Design notes carry the same tables and the same formatter, so they get the
     table check even though they are outside the site navigation and therefore
     skip every other check in this file. */
  for (const file of walkMarkdown(NOTES)) {
    issues.push(...tableIssues(readFileSync(file, "utf8"), rel(file)));
  }

  const seenUrls = new Map();
  for (const page of navigation.pages) {
    const key = `${page.groupSlug}/${page.slug}`;
    if (seenUrls.has(key)) {
      issues.push(`docs/navigation.json: duplicate slug ${key}`);
    }
    seenUrls.set(key, page);

    const file = join(PAGES, page.file);
    if (!manifestFiles.has(file)) continue;

    const markdown = readFileSync(file, "utf8");
    const fences = scanCodeFences(markdown);
    const fencedLines = new Set(
      fences.flatMap((fence) =>
        Array.from({ length: fence.end - fence.start + 1 }, (_, offset) => fence.start + offset),
      ),
    );

    issues.push(...tableIssues(markdown, rel(file)));

    for (const [index, line] of markdown.split(/\r?\n/u).entries()) {
      if (
        !fencedLines.has(index) &&
        /^\s*<(?:article|aside|button|dialog|div|form|header|main|nav|section|table)\b/iu.test(line)
      ) {
        issues.push(
          `${rel(file)}:${index + 1}: live component markup must use an \`\`\`html demo fence so it stays outside .prose`,
        );
      }
    }

    for (const fence of fences) {
      if (!fence.language) {
        issues.push(`${rel(file)}: fence without a language (use \`\`\`html, \`\`\`css, ...)`);
      } else if (!FENCE_LANGUAGES.has(fence.language)) {
        issues.push(`${rel(file)}: unsupported fence language "${fence.language}"`);
      }
      if (fence.language.includes("{")) {
        issues.push(
          `${rel(file)}: legacy fence wrapper class "${fence.language}" — put layout in the example markup`,
        );
      }
      if (fence.demo && fence.language !== "html") {
        issues.push(`${rel(file)}: the demo flag is only supported on html fences`);
      } else if (fence.demo) {
        issues.push(...demoMarkupIssues(fence, rel(file)));
      }
      if (fence.flags.some((flag) => !KNOWN_FENCE_FLAGS.has(flag))) {
        issues.push(
          `${rel(file)}: unknown fence flag "${fence.flags.find((f) => !KNOWN_FENCE_FLAGS.has(f))}"`,
        );
      }
      if (fence.language === "html") {
        for (const match of fence.content.matchAll(/<(input|select|textarea)\b([^>]*)>/gu)) {
          const attrs = match[2];
          const hidden = /type\s*=\s*["']?(hidden|radio|checkbox)["']?/u.test(attrs);
          if (!/class\s*=/u.test(attrs) && !hidden) {
            issues.push(
              `${rel(file)}: bare <${match[1]}> in a code fence — add the component class (.input / .textarea / .select, ...)`,
            );
          }
        }
      }
    }

    const h1Count = (markdown.match(/^#\s+.+$/m) ?? []).length;
    if (h1Count !== 1) {
      issues.push(`${rel(file)}: expected exactly one H1, found ${h1Count}`);
    }

    if (/^\*\*Related terms:\*\*$/m.test(markdown)) {
      issues.push(
        `${rel(file)}: the Related terms line must list at least one term after the colon`,
      );
    } else if (
      /^\*\*Related terms:\*\*.+$/m.test(markdown) &&
      extractAliases(markdown).length === 0
    ) {
      issues.push(
        `${rel(file)}: Related terms parse to no aliases — check the comma-separated list`,
      );
    }

    const sourceRefs = new Set(
      [...markdown.matchAll(/src\/(?:css|js)\/[A-Za-z0-9_./-]+\.(?:css|js|ts)/g)].map((m) => m[0]),
    );
    for (const ref of sourceRefs) {
      if (!existsSync(join(ROOT, ref))) {
        issues.push(`${rel(file)}: references missing source file ${ref}`);
      }
    }

    const rendered = render(markdown);
    manifestFiles.get(file).toc = rendered.toc;
  }

  for (const file of actualFiles) {
    const markdown = readFileSync(file, "utf8");
    const pageDir = dirname(file);

    for (const match of markdown.matchAll(/\[[^\]]+\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)) {
      const href = match[1];
      if (isExternal(href)) continue;
      const [targetPath, anchor] = href.split("#");
      if (!targetPath) continue;
      if (!targetPath.endsWith(".md")) continue;

      const resolved = resolve(pageDir, targetPath);
      if (!resolved.startsWith(PAGES)) continue;
      const info = manifestFiles.get(resolved);
      if (!info) {
        issues.push(`${rel(file)}: broken link to ${href}`);
        continue;
      }
      if (anchor && !info.toc.some((heading) => heading.id === anchor)) {
        issues.push(
          `${rel(file)}: link to ${href} — missing anchor "${anchor}" in ${rel(resolved)}`,
        );
      }
    }
  }

  const pagesByUrl = new Map(navigation.pages.map((page) => [page.url, page]));
  for (const page of navigation.pages) {
    const generatedFile = join(SITE, page.url);
    if (existsSync(generatedFile)) {
      const html = readFileSync(generatedFile, "utf8");
      for (const match of html.matchAll(/\bhref="([^"]*\\[^"]*)"/gu)) {
        issues.push(`${page.url}: generated href contains a backslash: ${match[1]}`);
      }
    }

    const chain = [
      ["previous", page.previous],
      ["next", page.next],
    ];
    for (const [kind, linked] of chain) {
      if (!linked) continue;
      const href = relHref(page.url, linked.url);
      if (normalize(join(dirname(page.url), href)) !== normalize(linked.url)) {
        issues.push(
          `${page.url}: ${kind} link renders as "${href}" but should point at ${linked.url}`,
        );
      }
      if (!pagesByUrl.has(linked.url)) {
        issues.push(`${page.url}: ${kind} target ${linked.url} is not a generated page`);
      }
    }
  }

  if (issues.length > 0) {
    console.error("Docs check failed.");
    for (const issue of issues) console.error(`- ${issue}`);
    process.exit(1);
  }

  console.log(`Docs check passed (${navigation.pages.length} pages, ${actualFiles.length} files).`);
}

main();
